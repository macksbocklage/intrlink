import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { 
  searchRelevantDocuments, 
  generateChatResponse, 
  type DocumentContent,
  type ChatResponse 
} from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, documentIds } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Chat request:', { message, documentIds });

    // Fetch user's documents
    let query = supabase
      .from('documents')
      .select('id, name, content, file_type')
      .eq('user_id', userId);

    // If specific documents are requested, filter by them
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      query = query.in('id', documentIds);
    }

    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    console.log(`Fetched ${documents?.length || 0} documents`);

    // Convert to DocumentContent format
    const documentContents: DocumentContent[] = documents?.map(doc => ({
      id: doc.id,
      name: doc.name,
      content: doc.content || '',
      file_type: doc.file_type
    })) || [];

    // Search for relevant documents based on the query
    const relevantDocuments = await searchRelevantDocuments(
      message, 
      documentContents,
      documentIds // Pass selected document IDs
    );

    console.log(`Found ${relevantDocuments.length} relevant documents for query`);

    // Generate AI response
    const chatResponse: ChatResponse = await generateChatResponse(message, relevantDocuments);

    return NextResponse.json({
      success: true,
      response: chatResponse.response,
      citations: chatResponse.citations,
      documents_used: chatResponse.documents_used,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 