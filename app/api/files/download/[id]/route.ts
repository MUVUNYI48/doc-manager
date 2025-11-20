import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id: fileId } = await params;
    console.log('Download request:', { fileId, userId: user.id });

    const result = await query(
      'SELECT * FROM files WHERE id = $1 AND owner_id = $2',
      [fileId, user.id]
    );
    const file = result.rows[0];
    console.log('File found:', !!file);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(file.path);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mime_type,
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
    });
  } catch (error: any) {
    console.error('Download route error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Download failed: ' + error.message }, { status: 500 });
  }
}