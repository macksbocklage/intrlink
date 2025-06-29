-- Create documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- Create index on created_at for sorting
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own documents
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (user_id = auth.uid()::text);

-- Create policy to allow users to insert their own documents
CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Create policy to allow users to update their own documents
CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (user_id = auth.uid()::text);

-- Create policy to allow users to delete their own documents
CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (user_id = auth.uid()::text);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Create storage policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated'
  );

-- Create storage policy to allow users to view their own documents
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create storage policy to allow users to update their own documents
CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create storage policy to allow users to delete their own documents
CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  citations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_org_id ON conversations(organization_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- Policies for messages (must match conversation ownership)
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()::uuid)
  );
CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()::uuid)
  );
CREATE POLICY "Users can delete messages in their conversations" ON messages
  FOR DELETE USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()::uuid)
  ); 