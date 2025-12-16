"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

function LoginForm() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirect = searchParams.get("redirect");

      if (redirect) {
        router.push(redirect);
      } else {
        // Redirect based on role
        if (user.role === "teacher") {
          router.push("/teacher/calendar");
        } else {
          router.push("/student/calendar");
        }
      }
    }
  }, [user, authLoading, router, searchParams]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.light }}
      >
        <div className="text-center">
          <p style={{ color: colors.darkBrown }}>Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already logged in (will redirect)
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.light }}
    >
      <div
        className="w-full max-w-md p-8 rounded-lg shadow-lg"
        style={{
          backgroundColor: "white",
          borderColor: colors.brown,
          borderWidth: "2px",
        }}
      >
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: colors.darkBrown }}
          >
            Đăng Nhập
          </h1>
          <p className="text-sm" style={{ color: colors.brown }}>
            Vui lòng đăng nhập để tiếp tục
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded text-sm"
            style={{
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: colors.darkBrown }}
            >
              Tên tài khoản
            </label>
            <input
              type="text"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: colors.brown,
                color: colors.darkBrown,
              }}
              placeholder="Nhập tên tài khoản"
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: colors.darkBrown }}
            >
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: colors.brown,
                color: colors.darkBrown,
              }}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: loading ? colors.brown : colors.mediumGreen,
              color: "white",
            }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>
        </form>

        <div
          className="mt-6 text-center text-sm"
          style={{ color: colors.brown }}
        >
          <p>
            Bạn chưa có tài khoản?{" "}
            <Link href="/sign-up" className="text-blue-500">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.light }}
      >
        <div className="text-center">
          <p style={{ color: colors.darkBrown }}>Đang tải...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
