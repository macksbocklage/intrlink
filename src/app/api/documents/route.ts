import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { processDocument } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const name = formData.get('name') as string;

    // Debug log for file name and type
    if (file && typeof file !== 'string') {
      console.log('UPLOAD DEBUG:', { name: file.name, type: file.type });
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ];
    const isMd = file.name.endsWith('.md');
    if (
      !allowedTypes.includes(file.type) &&
      !(isMd && (
        file.type === 'text/plain' ||
        file.type === 'application/octet-stream' ||
        file.type === 'text/markdown'
      ))
    ) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOCX, TXT, and MD files are allowed.' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract document content using Gemini AI
    let documentContent = '';
    try {
      console.log('Extracting content for:', file.name, file.type, file.size);
      documentContent = await processDocument(buffer, file.name, file.type);
      console.log('Extracted content:', documentContent?.slice(0, 200)); // log first 200 chars
    } catch (error) {
      console.error('Error extracting document content:', error);
      documentContent = '';
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message || 'Failed to upload file' }, { status: 500 });
    }

    // Get file URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Create database entry with extracted content
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        name: name || file.name,
        file_path: fileName,
        file_type: file.type,
        file_size: file.size,
        content: documentContent,
        metadata: {
          original_name: file.name,
          public_url: urlData.publicUrl,
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      document: documentData 
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents });

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // First, get the document to find the file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete the database record
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 