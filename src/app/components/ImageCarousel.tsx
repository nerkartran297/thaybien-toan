"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    {
      title: "Guitar Performance",
      subtitle: "Live Music Experience",
      src: "/wallpaper-1.jpg",
    },
    {
      title: "Music Studio",
      subtitle: "Recording & Production",
      src: "/wallpaper-2.jpg",
    },
    {
      title: "Art & Music",
      subtitle: "Creative Expression",
      src: "/wallpaper-3.jpg",
    },
    {
      title: "Live Shows",
      subtitle: "Concert Experience",
      src: "/wallpaper-4.jpg",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-full">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-full h-full relative">
            <Image
              src={image.src}
              alt={image.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}></div>
            {/* Content overlay */}
            {/* <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
                  {image.title}
                </h2>
                <p className="text-xl md:text-2xl drop-shadow-lg">
                  {image.subtitle}
                </p>
              </div>
            </div> */}
          </div>
        </div>
      ))}

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-opacity duration-300 ${
              index === currentIndex
                ? "bg-white opacity-100"
                : "bg-white/50 opacity-50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
