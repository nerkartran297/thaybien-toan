"use client";

import React from "react";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

interface DaySelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const days = [
  { value: "1", label: "T2" },
  { value: "2", label: "T3" },
  { value: "3", label: "T4" },
  { value: "4", label: "T5" },
  { value: "5", label: "T6" },
  { value: "6", label: "T7" },
  { value: "0", label: "CN" },
];

export default function DaySelector({
  value,
  onChange,
  required = false,
}: DaySelectorProps) {
  return (
    <div className="w-full">
      <div className="flex gap-2">
        {days.map((day) => {
          const isSelected = value === day.value;
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => onChange(day.value)}
              className={`flex-1 py-3 px-2 rounded-lg font-medium transition-all ${
                isSelected ? "text-white" : "hover:bg-gray-100"
              }`}
              style={{
                backgroundColor: isSelected
                  ? colors.mediumGreen
                  : "transparent",
                color: isSelected ? "white" : colors.darkBrown,
                border: `1px solid ${
                  isSelected ? colors.mediumGreen : colors.brown
                }`,
              }}
            >
              {day.label}
            </button>
          );
        })}
      </div>
      {/* Hidden input for form validation */}
      <input
        type="text"
        value={value}
        onChange={() => {}}
        required={required}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}
