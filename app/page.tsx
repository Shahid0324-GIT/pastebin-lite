"use client";

import { CreatePasteBody } from "@/lib";
import { useState } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [pasteUrl, setPasteUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasteUrl("");
    setLoading(true);

    try {
      const body: CreatePasteBody = { content };

      if (ttlSeconds) {
        body.ttl_seconds = parseInt(ttlSeconds, 10);
      }

      if (maxViews) {
        body.max_views = parseInt(maxViews, 10);
      }

      const response = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create paste");
        return;
      }

      setPasteUrl(data.url);
      // Reset form
      setContent("");
      setTtlSeconds("");
      setMaxViews("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Network error. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            Pastebin Lite
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Content *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Paste your text here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ttl"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Expiry (seconds)
                </label>
                <input
                  id="ttl"
                  type="number"
                  min="1"
                  value={ttlSeconds}
                  onChange={(e) => setTtlSeconds(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional (e.g., 3600)"
                />
              </div>

              <div>
                <label
                  htmlFor="maxViews"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Max Views
                </label>
                <input
                  id="maxViews"
                  type="number"
                  min="1"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional (e.g., 10)"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? "Creating..." : "Create Paste"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {pasteUrl && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
              <p className="text-green-800 font-medium mb-2">
                Paste created successfully!
              </p>
              <a
                href={pasteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {pasteUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
