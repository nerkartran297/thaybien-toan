"use client";

import Image from "next/image";
import Navigation from "@/app/components/Navigation";

export default function RulesPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--page-background)" }}
    >
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col items-center gap-6">
        <div
          className="w-full relative overflow-hidden rounded-lg shadow-lg border"
          style={{ borderColor: "#FACE84", maxWidth: 960 }}
        >
          <Image
            src="/noiquy.jpg"
            alt="Nội quy lớp học"
            width={1920}
            height={1080}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
