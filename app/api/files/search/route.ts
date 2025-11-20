import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const user = requireAuth(request);
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');

        if (!q) {
            return NextResponse.json({ files: [] });
        }

        const result = await query(
            `SELECT id, name, size, mime_type, is_folder, created_at, updated_at 
       FROM files 
       WHERE owner_id = $1 AND name ILIKE $2
       ORDER BY is_folder DESC, name ASC
       LIMIT 50`,
            [user.id, `%${q}%`]
        );

        return NextResponse.json({ files: result.rows });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Failed to search files' }, { status: 500 });
    }
}
