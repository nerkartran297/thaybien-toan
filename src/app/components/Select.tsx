"use client";

import React, { useState, useRef, useEffect } from "react";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  required = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border rounded-lg focus-within:ring-2 focus-within:ring-offset-2 cursor-pointer transition-all flex items-center justify-between"
        style={{
          borderColor: isOpen ? colors.mediumGreen : colors.brown,
          color: colors.darkBrown,
          backgroundColor: "white",
        }}
      >
        <span className={selectedOption ? "" : "opacity-50"}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: colors.brown }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full rounded-lg shadow-lg border overflow-hidden"
          style={{
            backgroundColor: "white",
            borderColor: colors.brown,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                value === option.value
                  ? ""
                  : "hover:bg-gray-50"
              }`}
              style={{
                backgroundColor:
                  value === option.value ? colors.light : "transparent",
                color: colors.darkBrown,
              }}
            >
              <div className="flex items-center justify-between">
                <span>{option.label}</span>
                {value === option.value && (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: colors.mediumGreen }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden input for form submission */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

