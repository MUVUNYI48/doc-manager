import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { id } = await request.json();

    const result = await query(
      'SELECT * FROM files WHERE id = $1 AND owner_id = $2',
      [id, user.id]
    );
    const file = result.rows[0];

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await unlink(file.path);
    await query('DELETE FROM files WHERE id = $1', [id]);

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}