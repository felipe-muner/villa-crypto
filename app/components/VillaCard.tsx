"use client";

import { useState } from "react";
import Image from "next/image";
import { Villa, BookedPeriod } from "@/lib/types/villa";
import AvailabilityCalendar from "./AvailabilityCalendar";

interface VillaCardProps {
  villa: Villa;
  onDelete: (id: string) => void;
}

interface AvailabilityData {
  airbnb: { configured: boolean; bookedPeriods: BookedPeriod[] };
  booking: { configured: boolean; bookedPeriods: BookedPeriod[] };
  combined: { bookedPeriods: BookedPeriod[] };
  lastChecked: string;
  errors?: string[];
}

export default function VillaCard({ villa, onDelete }: VillaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null
  );
  const [error, setError] = useState("");

  const checkAvailability = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/villas/${villa.id}/availability`);
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      const data = await response.json();
      setAvailability(data);
      setExpanded(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check availability"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this villa?")) return;

    try {
      const response = await fetch(`/api/villas/${villa.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onDelete(villa.id);
      }
    } catch (err) {
      console.error("Failed to delete villa:", err);
    }
  };

  const getPlatformBadge = () => {
    switch (villa.platform) {
      case "airbnb":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
            Airbnb
          </span>
        );
      case "booking":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Booking
          </span>
        );
      case "both":
        return (
          <div className="flex gap-1">
            <span className="px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
              Airbnb
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Booking
            </span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {villa.name}
              </h3>
              {getPlatformBadge()}
            </div>
            {villa.location && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {villa.location}
              </p>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 p-1"
            title="Delete villa"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={checkAvailability}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Checking..." : "Check Availability"}
          </button>
          {expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
            >
              Hide
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {expanded && availability && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {availability.errors && availability.errors.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                Warnings:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside">
                {availability.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Last checked:{" "}
            {new Date(availability.lastChecked).toLocaleString()}
          </div>

          <AvailabilityCalendar
            bookedPeriods={availability.combined.bookedPeriods}
            villaName={villa.name}
          />

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Airbnb
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {availability.airbnb.configured
                  ? `${availability.airbnb.bookedPeriods.length} bookings`
                  : "Not configured"}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Booking.com
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {availability.booking.configured
                  ? `${availability.booking.bookedPeriods.length} bookings`
                  : "Not configured"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
