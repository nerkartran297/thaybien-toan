import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/auth/logout - Clear auth cookie
export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Delete the auth-token cookie
    cookieStore.delete('auth-token');

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

