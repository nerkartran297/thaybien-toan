"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  category: string;
}

export default function ProductImageGallery({
  images,
  productName,
  category,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current || !isZoomed) return;

      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const rect = imageRef.current!.getBoundingClientRect();
        const x = Math.max(
          0,
          Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
        );
        const y = Math.max(
          0,
          Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)
        );

        setMousePosition({ x, y });
      });
    },
    [isZoomed]
  );

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        ref={imageRef}
        className="relative aspect-square w-full overflow-hidden rounded-lg bg-white cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={images[selectedImage]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          fill
          className={`${isZoomed ? "scale-200" : "scale-100"} ${
            category === "guitar" ? "object-contain" : "object-cover"
          }`}
          style={{
            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
            transition: isZoomed ? "none" : "transform 0.3s ease-out",
          }}
          priority
        />
        {isZoomed && <div className="absolute inset-0 pointer-events-none" />}
      </div>

      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`relative aspect-square overflow-hidden rounded-lg transition-all duration-200 ${
              selectedImage === index
                ? "ring-2 ring-[#D4A047] ring-offset-2"
                : "hover:opacity-80"
            }`}
          >
            <Image
              src={image}
              alt={`${productName} - Thumbnail ${index + 1}`}
              fill
              className="object-cover transition-transform duration-200 hover:scale-110"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
