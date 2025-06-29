import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Initialize the model
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface DocumentContent {
  id: string;
  name: string;
  content: string;
  file_type: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: string[];
}

export interface ChatResponse {
  response: string;
  citations: string[];
  documents_used: string[];
}

/**
 * Simple markdown to text conversion
 * Removes markdown syntax while preserving the content
 */
function markdownToText(markdown: string): string {
  return markdown
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italic
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove emphasis
    .replace(/~~(.*?)~~/g, '$1')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Extract text content from uploaded documents
 */
export async function extractDocumentContent(fileBuffer: Buffer, fileType: string, fileName?: string): Promise<string> {
  try {
    // If it's a markdown file by extension, treat as markdown
    if (fileName && fileName.endsWith('.md')) {
      const markdownContent = fileBuffer.toString('utf-8');
      return markdownToText(markdownContent);
    }
    // For text files, convert buffer to string
    if (fileType === 'text/plain') {
      return fileBuffer.toString('utf-8');
    }
    // For PDF and DOCX files, we'll use Gemini's multimodal capabilities
    const base64Data = fileBuffer.toString('base64');
    const prompt = `Please extract and return the text content from this document. Return only the extracted text without any additional formatting or commentary.`;
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: fileType,
          data: base64Data
        }
      }
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error extracting document content:', error);
    throw new Error('Failed to extract document content');
  }
}

/**
 * Improved document search with better relevance scoring
 */
export async function searchRelevantDocuments(
  query: string, 
  documents: DocumentContent[],
  selectedDocumentIds?: string[]
): Promise<DocumentContent[]> {
  try {
    if (documents.length === 0) return [];

    // If specific documents are selected, use only those
    let searchableDocuments = documents;
    if (selectedDocumentIds && selectedDocumentIds.length > 0) {
      searchableDocuments = documents.filter(doc => selectedDocumentIds.includes(doc.id));
      console.log(`Searching in ${searchableDocuments.length} selected documents`);
    }

    // If no documents are selected, search in all documents
    if (searchableDocuments.length === 0) {
      searchableDocuments = documents;
      console.log(`No documents selected, searching in all ${documents.length} documents`);
    }

    // For better relevance, let's use a more sophisticated approach
    const prompt = `Given the user query: "${query}"

Available documents:
${searchableDocuments.map((doc, index) => 
  `${index + 1}. Document: ${doc.name}
   Content preview: ${doc.content.substring(0, 1000)}...`
).join('\n\n')}

Please analyze which documents are most relevant to answering this query. Consider:
1. Direct keyword matches
2. Semantic relevance
3. Contextual relevance

Return ONLY the document names that are relevant, separated by commas. If multiple documents are relevant, order them by relevance (most relevant first). If no documents are relevant, return "none".

Example response format: "Document A, Document B" or "none"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const relevantDocNames = response.text().toLowerCase().split(',').map(name => name.trim());

    console.log('AI identified relevant documents:', relevantDocNames);

    if (relevantDocNames.includes('none') || relevantDocNames.length === 0) {
      console.log('No relevant documents found, returning all documents as fallback');
      return searchableDocuments;
    }

    // Match documents by name (case-insensitive)
    const relevantDocuments = searchableDocuments.filter(doc => 
      relevantDocNames.some(name => 
        doc.name.toLowerCase().includes(name) || 
        name.includes(doc.name.toLowerCase())
      )
    );

    // If no exact matches, return all searchable documents as fallback
    if (relevantDocuments.length === 0) {
      console.log('No exact matches found, using all searchable documents');
      return searchableDocuments;
    }

    console.log(`Found ${relevantDocuments.length} relevant documents:`, relevantDocuments.map(d => d.name));
    return relevantDocuments;
  } catch (error) {
    console.error('Error searching relevant documents:', error);
    // Fallback: return all searchable documents if search fails
    return selectedDocumentIds && selectedDocumentIds.length > 0 
      ? documents.filter(doc => selectedDocumentIds.includes(doc.id))
      : documents;
  }
}

/**
 * Generate AI response based on user query and relevant documents
 */
export async function generateChatResponse(
  query: string,
  relevantDocuments: DocumentContent[]
): Promise<ChatResponse> {
  try {
    if (relevantDocuments.length === 0) {
      const result = await model.generateContent(
        `You are an AI assistant for an SOP (Standard Operating Procedure) management system. The user asked: "${query}"\n\nUnfortunately, I don't have access to any relevant documents to answer this question. Please let the user know that they need to upload relevant SOP documents first, and suggest what types of documents might be helpful.`
      );
      const response = await result.response;
      return {
        response: response.text(),
        citations: [],
        documents_used: []
      };
    }

    // Create context from relevant documents with better formatting
    const documentsContext = relevantDocuments.map(doc => 
      `=== DOCUMENT: ${doc.name} ===\n${doc.content}\n`
    ).join('\n');

    const prompt = `You are an AI assistant for an SOP (Standard Operating Procedure) management system. You have access to the following documents:

${documentsContext}

User Question: "${query}"

Instructions:
1. Answer the question based ONLY on the information provided in the documents above
2. If the documents contain relevant information, provide a comprehensive answer
3. If the documents don't contain enough information to fully answer the question, acknowledge this and provide what information you can
4. Always mention the specific document name(s) when referencing information
5. Be specific and detailed in your response
6. If the question is not related to the documents, politely redirect the user to ask about the SOP content

Format your response to be clear, well-structured, and helpful.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Extract document names used in response
    const documentsUsed = relevantDocuments.map(doc => doc.name);
    
    // Generate citations (document names mentioned in response)
    const citations = relevantDocuments
      .filter(doc => response.text().toLowerCase().includes(doc.name.toLowerCase()))
      .map(doc => doc.name);

    console.log(`Generated response using ${relevantDocuments.length} documents:`, relevantDocuments.map(d => d.name));
    console.log(`Citations found:`, citations);

    return {
      response: response.text(),
      citations,
      documents_used: documentsUsed
    };
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Process uploaded document and extract content
 */
export async function processDocument(
  fileBuffer: Buffer, 
  fileName: string, 
  fileType: string
): Promise<string> {
  try {
    const content = await extractDocumentContent(fileBuffer, fileType, fileName);
    return content;
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error('Failed to process document');
  }
}

/**
 * Generate a short, descriptive chat title based on the first user and AI message
 */
export async function generateChatTitle(userMessage: string, aiMessage: string): Promise<string> {
  try {
    const prompt = `Given the following conversation between a user and an AI assistant, generate a short, descriptive title (max 8 words) that summarizes the main topic or question. Do not use generic titles like 'New Chat' or 'Conversation'.

User: ${userMessage}
AI: ${aiMessage}

Title:`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    // Return the first line, trimmed
    return response.text().split('\n')[0].replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error('Error generating chat title:', error);
    return 'Untitled Conversation';
  }
} 