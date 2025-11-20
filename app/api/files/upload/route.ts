import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const parentId = formData.get('parentId') as string || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileId = uuidv4();
    const fileName = file.name;
    const filePath = join('uploads', `${fileId}-${fileName}`);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    await query(
      `INSERT INTO files (id, name, path, size, mime_type, owner_id, parent_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [fileId, fileName, filePath, file.size, file.type, user.id, parentId]
    );

    return NextResponse.json({ 
      id: fileId, 
      name: fileName, 
      size: file.size,
      type: file.type 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}