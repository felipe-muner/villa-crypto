"use client";

import { useState, useEffect } from "react";
import { Villa } from "@/lib/types/villa";
import VillaCard from "./components/VillaCard";
import AddVillaForm from "./components/AddVillaForm";

export default function Home() {
  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");

  const fetchVillas = async () => {
    try {
      const response = await fetch("/api/villas");
      if (response.ok) {
        const data = await response.json();
        setVillas(data);
      }
    } catch (err) {
      setError("Failed to load villas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVillas();
  }, []);

  const handleVillaAdded = (villa: Villa) => {
    setVillas([...villas, villa]);
    setShowAddForm(false);
  };

  const handleVillaDeleted = (id: string) => {
    setVillas(villas.filter((v) => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Villa Availability Checker
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Track your Airbnb and Booking.com listings in one place
              </p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Villa
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="mb-8">
            <AddVillaForm
              onVillaAdded={handleVillaAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : villas.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No villas added yet
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add your first villa to start tracking availability.
            </p>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Add Your First Villa
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {villas.map((villa) => (
              <VillaCard
                key={villa.id}
                villa={villa}
                onDelete={handleVillaDeleted}
              />
            ))}
          </div>
        )}

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How to get your calendar URLs
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-pink-600 dark:text-pink-400 mb-2">
                Airbnb
              </h3>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Go to your Airbnb listing</li>
                <li>Click on &quot;Calendar&quot;</li>
                <li>Click on &quot;Availability settings&quot;</li>
                <li>Scroll to &quot;Sync calendars&quot;</li>
                <li>Click &quot;Export Calendar&quot;</li>
                <li>Copy the iCal link</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                Booking.com
              </h3>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Log in to Booking.com Extranet</li>
                <li>Go to &quot;Property&quot; tab</li>
                <li>Click on &quot;Calendar&quot;</li>
                <li>Look for &quot;Sync calendars&quot;</li>
                <li>Click &quot;Export&quot; to get your iCal URL</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
