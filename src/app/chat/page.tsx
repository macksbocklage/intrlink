'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import ChatInterface from '@/components/ChatInterface';
import { Loader2 } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  file_type: string;
  created_at: string;
}

export default function ChatPage() {
  const { user, isLoaded } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchDocuments();
    }
  }, [isLoaded, user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Please sign in to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Chat Assistant</h1>
          <p className="text-gray-600">
            Ask questions about your SOPs and get instant AI-powered answers with citations.
          </p>
        </div>
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-280px)]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading your documents...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchDocuments}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full p-6">
              <ChatInterface documents={documents} />
            </div>
          )}
        </div>
        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for better results:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be specific in your questions for more accurate answers</li>
            <li>• Select specific documents to narrow down your search</li>
            <li>• Ask about procedures, policies, or specific sections in your SOPs</li>
            <li>• The AI will cite which documents it used to answer your question</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 