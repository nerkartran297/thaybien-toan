import type { Metadata } from "next";
import { Red_Rose } from "next/font/google";
import { ThemeProvider } from "./(root)/contexts/ThemeContext";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ExamProvider } from "@/contexts/ExamContext";
import { ToastStack } from "@/app/components/ToastStack";
import { ConfirmModalProvider } from "@/app/components/ConfirmModalProvider";

const redRose = Red_Rose({
  variable: "--font-red-rose",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phuc Nguyen Guitar",
  description:
    "Guitar • Performance • Art - Official website of Phuc Nguyen Guitar",
  icons: {
    icon: "/logo-dc.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${redRose.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <ExamProvider>
              {children}
              <ToastStack />
              <ConfirmModalProvider />
            </ExamProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
