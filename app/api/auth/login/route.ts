import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, generateToken, validateEmail } from '@/lib/auth';
import { initDB, checkConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const connected = await checkConnection();
    if (!connected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    await initDB();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user);
    
    return NextResponse.json({ 
      token, 
      user: { id: user.id, email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}