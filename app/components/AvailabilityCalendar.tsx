"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
  isBefore,
  isAfter,
  isSameDay,
} from "date-fns";
import { BookedPeriod } from "@/lib/types/villa";

interface AvailabilityCalendarProps {
  bookedPeriods: BookedPeriod[];
  villaName: string;
}

export default function AvailabilityCalendar({
  bookedPeriods,
  villaName,
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding days for the start of the month
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array(startDayOfWeek).fill(null);

  const isDateBooked = (date: Date): boolean => {
    for (const period of bookedPeriods) {
      const periodStart = new Date(period.start);
      const periodEnd = new Date(period.end);

      // Normalize to start of day for comparison
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDate = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());
      const endDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate());

      if (
        (isAfter(checkDate, startDate) || isSameDay(checkDate, startDate)) &&
        isBefore(checkDate, endDate)
      ) {
        return true;
      }
    }
    return false;
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentDate, "MMMM yyyy")}
        </h3>
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
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

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="h-10" />
        ))}
        {daysInMonth.map((day) => {
          const booked = isDateBooked(day);
          const today = isToday(day);
          const isPast = isBefore(day, new Date()) && !today;

          return (
            <div
              key={day.toISOString()}
              className={`
                h-10 flex items-center justify-center rounded-md text-sm
                ${today ? "ring-2 ring-blue-500" : ""}
                ${
                  booked
                    ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                    : isPast
                    ? "bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                    : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                }
              `}
              title={booked ? "Booked" : "Available"}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900" />
          <span className="text-gray-600 dark:text-gray-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900" />
          <span className="text-gray-600 dark:text-gray-400">Booked</span>
        </div>
      </div>
    </div>
  );
}
