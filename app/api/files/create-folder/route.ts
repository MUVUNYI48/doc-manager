import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { name, parentId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folderId = uuidv4();

    await query(
      `INSERT INTO files (id, name, path, size, mime_type, owner_id, parent_id, is_folder) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [folderId, name, '', 0, 'folder', user.id, parentId || null, true]
    );

    return NextResponse.json({ 
      id: folderId, 
      name, 
      is_folder: true 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}