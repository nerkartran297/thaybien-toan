"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CalendarProps {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  className?: string;
}

const Calendar = ({
  mode = "single",
  selected,
  onSelect,
  className,
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date()
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

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

  const handleDayClick = (day: number) => {
    const newDate = new Date(year, month, day);
    onSelect?.(newDate);
  };

  return (
    <div className={cn("p-3 border-r border-[#ADC178]", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-[#EFEBDF] rounded text-[#2c3e50]"
        >
          ←
        </button>
        <div className="font-semibold text-[#2c3e50]">
          {monthNames[month]} {year}
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-[#EFEBDF] rounded text-[#2c3e50]"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-md font-medium text-[#6C584C]"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const date = new Date(year, month, day);
          const isSelected =
            selected &&
            date.getDate() === selected.getDate() &&
            date.getMonth() === selected.getMonth() &&
            date.getFullYear() === selected.getFullYear();
          const isToday =
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear();

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={cn(
                "aspect-square rounded-md text-md transition-colors p-[2px]",
                isSelected
                  ? "bg-[#ADC178] text-[#2c3e50] font-semibold"
                  : isToday
                  ? "bg-[#EFEBDF] text-[#A98467] font-semibold"
                  : "hover:bg-[#EFEBDF] text-[#2c3e50]"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { Calendar };

