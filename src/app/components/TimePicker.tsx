"use client";

import React, { useState, useRef, useEffect } from "react";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

interface TimePickerProps {
  value: string; // Format: "HH:mm"
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function TimePicker({
  value,
  onChange,
  placeholder = "Chọn giờ",
  required = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format: HH:mm (24h)
  const formatTime = (timeString: string): string => {
    if (!timeString) return "";
    // If already in HH:mm format, return as is
    if (timeString.includes(":")) {
      return timeString;
    }
    return timeString;
  };

  const displayValue = value ? formatTime(value) : "";

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // Generate minutes (00, 15, 30, 45)
  const minutes = ["00", "15", "30", "45"];

  const [selectedHour, setSelectedHour] = useState<string>(
    value ? value.split(":")[0] || "00" : "00"
  );
  const [selectedMinute, setSelectedMinute] = useState<string>(
    value ? value.split(":")[1] || "00" : "00"
  );

  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(":");
      setSelectedHour(hour || "00");
      setSelectedMinute(minute || "00");
    }
  }, [value]);

  const handleTimeSelect = (hour: string, minute: string) => {
    const timeValue = `${hour}:${minute}`;
    onChange(timeValue);
    setIsOpen(false);
  };

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
        <span className={displayValue ? "" : "opacity-50"}>
          {displayValue || placeholder}
        </span>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: colors.brown }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {isOpen && (
        <div
          className="absolute z-50 mt-2 p-4 rounded-lg shadow-lg border"
          style={{
            backgroundColor: "white",
            borderColor: colors.brown,
            minWidth: "280px",
          }}
        >
          <div className="flex gap-4">
            {/* Hours */}
            <div className="flex-1">
              <div
                className="text-xs font-semibold mb-2 text-center"
                style={{ color: colors.brown }}
              >
                Giờ
              </div>
              <div
                className="max-h-48 overflow-y-auto space-y-1"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: `${colors.brown} ${colors.light}`,
                }}
              >
                {hours.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => {
                      setSelectedHour(hour);
                      handleTimeSelect(hour, selectedMinute);
                    }}
                    className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      selectedHour === hour
                        ? "text-white"
                        : "hover:bg-gray-100"
                    }`}
                    style={{
                      backgroundColor:
                        selectedHour === hour ? colors.mediumGreen : "transparent",
                      color:
                        selectedHour === hour ? "white" : colors.darkBrown,
                    }}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div
                className="text-xs font-semibold mb-2 text-center"
                style={{ color: colors.brown }}
              >
                Phút
              </div>
              <div className="space-y-1">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    onClick={() => {
                      setSelectedMinute(minute);
                      handleTimeSelect(selectedHour, minute);
                    }}
                    className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      selectedMinute === minute
                        ? "text-white"
                        : "hover:bg-gray-100"
                    }`}
                    style={{
                      backgroundColor:
                        selectedMinute === minute
                          ? colors.mediumGreen
                          : "transparent",
                      color:
                        selectedMinute === minute ? "white" : colors.darkBrown,
                    }}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick select buttons */}
          <div className="mt-4 pt-4 border-t flex gap-2" style={{ borderColor: colors.light }}>
            <button
              onClick={() => handleTimeSelect("08", "00")}
              className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ color: colors.darkBrown }}
            >
              08:00
            </button>
            <button
              onClick={() => handleTimeSelect("14", "00")}
              className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ color: colors.darkBrown }}
            >
              14:00
            </button>
            <button
              onClick={() => handleTimeSelect("18", "00")}
              className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ color: colors.darkBrown }}
            >
              18:00
            </button>
          </div>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

