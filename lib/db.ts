import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:muvunyi@localhost:5432/filestore',
});

let isConnected = false;

export const checkConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    isConnected = false;
    return false;
  }
};

export const query = async (text: string, params?: any[]) => {
  if (!isConnected) {
    const connected = await checkConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const initDB = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'viewer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS files (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      path VARCHAR(500) NOT NULL,
      size BIGINT NOT NULL,
      mime_type VARCHAR(255) NOT NULL,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      parent_id VARCHAR(255),
      is_folder BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS shares (
      id VARCHAR(255) PRIMARY KEY,
      file_id VARCHAR(255) NOT NULL REFERENCES files(id),
      token VARCHAR(255) UNIQUE NOT NULL,
      permissions VARCHAR(50) DEFAULT 'view',
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export default pool;