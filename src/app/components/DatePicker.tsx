"use client";

import React, { useState, useRef, useEffect } from "react";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  required = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Format: dd/mm/yyyy
  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    // Parse dd/mm/yyyy or yyyy-mm-dd (from input type="date")
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/").map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateString);
  };

  const displayValue = value
    ? formatDate(parseDate(value))
    : "";

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: (Date | null)[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      if (
        currentDate.getMonth() === month &&
        currentDate.getFullYear() === year
      ) {
        days.push(new Date(currentDate));
      } else {
        days.push(null);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`); // ISO format for input
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date | null): boolean => {
    if (!date || !value) return false;
    const selected = parseDate(value);
    if (!selected) return false;
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
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

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      {isOpen && (
        <div
          className="absolute z-50 mt-2 p-4 rounded-lg shadow-lg border"
          style={{
            backgroundColor: "white",
            borderColor: colors.brown,
            minWidth: "300px",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: colors.darkBrown }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h3
              className="font-semibold"
              style={{ color: colors.darkBrown }}
            >
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: colors.darkBrown }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={index}
                className="text-center text-sm font-medium py-2"
                style={{ color: colors.brown }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays().map((date, index) => {
              if (!date) {
                return <div key={index} className="aspect-square" />;
              }

              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  className={`aspect-square rounded-md text-sm font-medium transition-colors ${
                    isSelectedDate
                      ? "text-white"
                      : isTodayDate
                      ? "font-bold"
                      : "hover:bg-gray-100"
                  }`}
                  style={{
                    backgroundColor: isSelectedDate
                      ? colors.mediumGreen
                      : isTodayDate
                      ? colors.light
                      : "transparent",
                    color: isSelectedDate
                      ? "white"
                      : isTodayDate
                      ? colors.darkBrown
                      : colors.darkBrown,
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

