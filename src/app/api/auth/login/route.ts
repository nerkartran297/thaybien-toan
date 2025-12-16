import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Tên tài khoản và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ username });

    if (!user) {
      return NextResponse.json(
        { error: 'Tên tài khoản hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Check if user has a password (defensive check)
    if (!user.password) {
      console.error(`User ${username} found but has no password field`, {
        userId: user._id,
        userFields: Object.keys(user),
      });
      return NextResponse.json(
        { error: 'Tài khoản chưa được thiết lập mật khẩu. Vui lòng liên hệ quản trị viên.' },
        { status: 401 }
      );
    }

    // Verify password
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        console.log(`Password mismatch for user: ${username}`);
        return NextResponse.json(
          { error: 'Tên tài khoản hoặc mật khẩu không đúng' },
          { status: 401 }
        );
      }
    } catch (compareError) {
      console.error('Error comparing password:', compareError);
      return NextResponse.json(
        { error: 'Có lỗi xảy ra khi xác thực mật khẩu' },
        { status: 500 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user._id?.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    );
  }
}

