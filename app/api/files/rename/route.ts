import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';

export async function PUT(request: NextRequest) {
    try {
        const user = requireAuth(request);
        const { id, name } = await request.json();

        if (!id || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Update file name
        const result = await query(
            'UPDATE files SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND owner_id = $3 RETURNING *',
            [name, id, user.id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'File not found or permission denied' }, { status: 404 });
        }

        return NextResponse.json({ file: result.rows[0] });
    } catch (error) {
        console.error('Rename error:', error);
        return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
    }
}
