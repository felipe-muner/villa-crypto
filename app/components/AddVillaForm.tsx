"use client";

import { useState } from "react";
import { Villa } from "@/lib/types/villa";

interface AddVillaFormProps {
  onVillaAdded: (villa: Villa) => void;
  onCancel: () => void;
}

export default function AddVillaForm({
  onVillaAdded,
  onCancel,
}: AddVillaFormProps) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"airbnb" | "booking" | "both">(
    "both"
  );
  const [airbnbCalendarUrl, setAirbnbCalendarUrl] = useState("");
  const [bookingCalendarUrl, setBookingCalendarUrl] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/villas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          platform,
          airbnbCalendarUrl: airbnbCalendarUrl || undefined,
          bookingCalendarUrl: bookingCalendarUrl || undefined,
          location: location || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add villa");
      }

      const newVilla = await response.json();
      onVillaAdded(newVilla);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add villa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Add New Villa
      </h2>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Villa Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Beach House Paradise"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Platform *
          </label>
          <select
            value={platform}
            onChange={(e) =>
              setPlatform(e.target.value as "airbnb" | "booking" | "both")
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="both">Both Platforms</option>
            <option value="airbnb">Airbnb Only</option>
            <option value="booking">Booking.com Only</option>
          </select>
        </div>

        {(platform === "airbnb" || platform === "both") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Airbnb Calendar URL{" "}
              {platform === "airbnb" ? "*" : "(optional)"}
            </label>
            <input
              type="url"
              value={airbnbCalendarUrl}
              onChange={(e) => setAirbnbCalendarUrl(e.target.value)}
              required={platform === "airbnb"}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://www.airbnb.com/calendar/ical/..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Find this in Airbnb: Calendar → Availability → Export Calendar
            </p>
          </div>
        )}

        {(platform === "booking" || platform === "both") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Booking.com Calendar URL{" "}
              {platform === "booking" ? "*" : "(optional)"}
            </label>
            <input
              type="url"
              value={bookingCalendarUrl}
              onChange={(e) => setBookingCalendarUrl(e.target.value)}
              required={platform === "booking"}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://admin.booking.com/..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Find this in Booking.com: Property → Calendar → Sync calendars
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location (optional)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Bali, Indonesia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image URL (optional)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="https://..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "Add Villa"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
