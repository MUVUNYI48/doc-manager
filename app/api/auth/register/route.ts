import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, validateEmail, validatePassword } from '@/lib/auth';
import { initDB, checkConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const connected = await checkConnection();
    if (!connected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    await initDB();
    
    const { email, password, role = 'viewer' } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const newUser = await createUser(email, password, role);
    
    return NextResponse.json({ 
      message: 'User created successfully',
      user: { id: newUser.id, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}