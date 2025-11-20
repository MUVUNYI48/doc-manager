const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:muvunyi@localhost:5432/filestore';

const pool = new Pool({
    connectionString: DATABASE_URL,
});

async function run() {
    try {
        // 1. Get a user
        const userRes = await pool.query('SELECT * FROM users LIMIT 1');
        const user = userRes.rows[0];
        if (!user) {
            console.log('No users found');
            return;
        }
        console.log('User:', user.email);

        // 2. Get a file owned by user
        const fileRes = await pool.query('SELECT * FROM files WHERE owner_id = $1 LIMIT 1', [user.id]);
        const file = fileRes.rows[0];
        if (!file) {
            console.log('No files found for user');
            return;
        }
        console.log('File:', file.name, file.id, file.path);

        // 3. Generate token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
            expiresIn: '1h',
        });
        console.log('Token generated');

        // 4. Simulate download logic (backend side)
        // We can't easily curl localhost if the server is running on a port I don't know or if I want to test the logic directly.
        // But I can test the `readFile` logic directly here.

        try {
            const buffer = fs.readFileSync(file.path);
            console.log('File read successfully, size:', buffer.length);
        } catch (err) {
            console.error('fs.readFileSync failed:', err.message);
            // Try absolute path
            try {
                const absPath = path.join(process.cwd(), file.path);
                console.log('Trying absolute path:', absPath);
                const buffer = fs.readFileSync(absPath);
                console.log('File read successfully with absolute path, size:', buffer.length);
            } catch (err2) {
                console.error('fs.readFileSync with absolute path failed:', err2.message);
            }
        }

        // 5. Curl the endpoint
        // Assuming port 3000
        const cmd = `curl -v -H "Authorization: Bearer ${token}" http://localhost:3000/api/files/download/${file.id} -o /dev/null`;
        console.log('Running curl command...');
        const { execSync } = require('child_process');
        try {
            const output = execSync(cmd, { stdio: 'pipe' });
            console.log('Curl output:', output.toString());
        } catch (err) {
            console.error('Curl failed:', err.message);
            console.error('Curl stderr:', err.stderr.toString());
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

run();
