"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Villa } from "@/lib/types/database";

interface VillaFormProps {
  villa?: Villa;
}

export function VillaForm({ villa }: VillaFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: villa?.name || "",
    description: villa?.description || "",
    location: villa?.location || "",
    pricePerNight: villa?.pricePerNight ? String(villa.pricePerNight) : "",
    maxGuests: villa?.maxGuests || 1,
    bedrooms: villa?.bedrooms || 1,
    bathrooms: villa?.bathrooms || 1,
    airbnbCalendarUrl: villa?.airbnbCalendarUrl || "",
    bookingCalendarUrl: villa?.bookingCalendarUrl || "",
    amenities: villa?.amenities?.join(", ") || "",
    isActive: villa?.isActive ?? true,
  });

  const [images, setImages] = useState<string[]>(villa?.images || []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();
        setImages((prev) => [...prev, data.url]);
      }
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const amenitiesArray = formData.amenities
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const payload = {
        name: formData.name,
        description: formData.description || null,
        location: formData.location || null,
        pricePerNight: formData.pricePerNight,
        maxGuests: formData.maxGuests,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        airbnbCalendarUrl: formData.airbnbCalendarUrl || null,
        bookingCalendarUrl: formData.bookingCalendarUrl || null,
        amenities: amenitiesArray,
        images,
        isActive: formData.isActive,
      };

      const url = villa ? `/api/villas/${villa.id}` : "/api/villas";
      const method = villa ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save villa");
      }

      router.push("/admin/villas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Villa Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="pricePerNight"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Price per Night (USD) *
            </label>
            <input
              type="number"
              id="pricePerNight"
              required
              min="0"
              step="0.01"
              value={formData.pricePerNight}
              onChange={(e) =>
                setFormData({ ...formData, pricePerNight: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Capacity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Capacity
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label
              htmlFor="maxGuests"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Max Guests
            </label>
            <input
              type="number"
              id="maxGuests"
              min="1"
              value={formData.maxGuests}
              onChange={(e) =>
                setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="bedrooms"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Bedrooms
            </label>
            <input
              type="number"
              id="bedrooms"
              min="0"
              value={formData.bedrooms}
              onChange={(e) =>
                setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="bathrooms"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Bathrooms
            </label>
            <input
              type="number"
              id="bathrooms"
              min="0"
              value={formData.bathrooms}
              onChange={(e) =>
                setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Images
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={url}
                alt={`Villa image ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isUploading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Upload Images
              </>
            )}
          </label>
        </div>
      </div>

      {/* Calendar URLs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Calendar Integration
        </h2>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label
              htmlFor="airbnbCalendarUrl"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Airbnb Calendar URL (iCal)
            </label>
            <input
              type="url"
              id="airbnbCalendarUrl"
              value={formData.airbnbCalendarUrl}
              onChange={(e) =>
                setFormData({ ...formData, airbnbCalendarUrl: e.target.value })
              }
              placeholder="https://www.airbnb.com/calendar/ical/..."
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="bookingCalendarUrl"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Booking.com Calendar URL (iCal)
            </label>
            <input
              type="url"
              id="bookingCalendarUrl"
              value={formData.bookingCalendarUrl}
              onChange={(e) =>
                setFormData({ ...formData, bookingCalendarUrl: e.target.value })
              }
              placeholder="https://admin.booking.com/..."
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Amenities
        </h2>
        <div>
          <label
            htmlFor="amenities"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Amenities (comma-separated)
          </label>
          <input
            type="text"
            id="amenities"
            value={formData.amenities}
            onChange={(e) =>
              setFormData({ ...formData, amenities: e.target.value })
            }
            placeholder="Pool, WiFi, Air conditioning, Kitchen..."
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Status
        </h2>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="isActive"
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Villa is active and available for booking
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : villa ? "Update Villa" : "Create Villa"}
        </button>
      </div>
    </form>
  );
}
