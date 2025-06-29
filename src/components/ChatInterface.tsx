'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Loader2, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  citations?: string[];
}

interface Document {
  id: string;
  name: string;
  file_type: string;
}

interface ChatInterfaceProps {
  documents: Document[];
}

export default function ChatInterface({ documents }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<'all' | 'selected'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const documentIdsToSearch = searchMode === 'selected' && selectedDocuments.length > 0 
        ? selectedDocuments 
        : undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          documentIds: documentIdsToSearch,
        }),
      });
      if (!response.ok) throw new Error('Failed to get AI response');
      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
        citations: data.citations,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const toggleSearchMode = () => {
    setSearchMode(prev => prev === 'all' ? 'selected' : 'all');
    if (searchMode === 'all') {
      setSelectedDocuments([]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Document Selection */}
      {documents.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Document Search Options:
            </h3>
            <button
              onClick={toggleSearchMode}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border transition-colors ${
                searchMode === 'selected'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-green-100 border-green-300 text-green-700'
              }`}
            >
              <Search className="w-3 h-3" />
              {searchMode === 'all' ? 'Search All Documents' : 'Search Selected Only'}
            </button>
          </div>
          {searchMode === 'selected' && (
            <>
              <p className="text-xs text-gray-600 mb-2">
                Select specific documents to search in:
              </p>
              <div className="flex flex-wrap gap-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => toggleDocumentSelection(doc.id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border transition-colors ${
                      selectedDocuments.includes(doc.id)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    {doc.name}
                  </button>
                ))}
              </div>
              {selectedDocuments.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Searching in {selectedDocuments.length} selected document(s)
                </p>
              )}
            </>
          )}
          {searchMode === 'all' && (
            <p className="text-xs text-gray-600">
              AI will search across all {documents.length} documents to find the most relevant information.
            </p>
          )}
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Ask me anything about your SOPs!</p>
            <p className="text-sm">I can help you find information, answer questions, and provide insights from your uploaded documents.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex gap-3 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.citations.map((citation, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                          >
                            {citation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-gray-600">Searching documents...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <div className="border-t pt-4">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your SOPs..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
} 