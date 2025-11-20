import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId') || null;

    const result = await query(
      `SELECT id, name, size, mime_type, is_folder, created_at, updated_at 
       FROM files 
       WHERE owner_id = $1 AND parent_id ${parentId ? '= $2' : 'IS NULL'}
       ORDER BY is_folder DESC, name ASC`,
      parentId ? [user.id, parentId] : [user.id]
    );

    return NextResponse.json({ files: result.rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}