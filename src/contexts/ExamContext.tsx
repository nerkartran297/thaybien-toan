"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ActiveAttempt {
  examId: string;
  attemptId: string;
  startedAt: Date;
}

interface ExamContextType {
  activeAttempt: ActiveAttempt | null;
  startExam: (examId: string, attemptId: string, startedAt: Date) => void;
  submitExam: () => void;
  isExamInProgress: () => boolean;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

const STORAGE_KEY = "activeExamAttempt";

export function ExamProvider({ children }: { children: React.ReactNode }) {
  const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(null);
  const router = useRouter();

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const startedAt = new Date(parsed.startedAt);
        
        // Verify attempt still exists and not submitted
        verifyAndRestoreAttempt(parsed.examId, parsed.attemptId, startedAt);
      } catch (error) {
        console.error("Error restoring exam attempt:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const verifyAndRestoreAttempt = async (
    examId: string,
    attemptId: string,
    startedAt: Date
  ) => {
    try {
      const response = await fetch(`/api/exam-attempts/${attemptId}`);
      if (response.ok) {
        const attempt = await response.json();
        // Only restore if not submitted
        if (!attempt.submittedAt) {
          setActiveAttempt({ examId, attemptId, startedAt });
          // Auto redirect to exam page only if not already on it
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (!currentPath.includes(`/student/exams/${examId}/take`)) {
              router.push(`/student/exams/${examId}/take`);
            }
          }
        } else {
          // Attempt was submitted, clear storage
          // Don't auto redirect - let user choose what to do next
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        // Attempt not found, clear storage
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error verifying attempt:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const startExam = (examId: string, attemptId: string, startedAt: Date) => {
    const attempt: ActiveAttempt = { examId, attemptId, startedAt };
    setActiveAttempt(attempt);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      examId,
      attemptId,
      startedAt: startedAt.toISOString(),
    }));
  };

  const submitExam = () => {
    setActiveAttempt(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isExamInProgress = () => {
    return activeAttempt !== null;
  };

  return (
    <ExamContext.Provider
      value={{
        activeAttempt,
        startExam,
        submitExam,
        isExamInProgress,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error("useExam must be used within an ExamProvider");
  }
  return context;
}

