"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PasteData } from "@/lib";

export default function PastePage() {
  const params = useParams();
  const id = params.id as string;

  const [paste, setPaste] = useState<PasteData | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaste = async () => {
      try {
        const response = await fetch(`/api/pastes/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            const data = await response.json();
            setError(data.error || "Paste not found");
          } else {
            setError("Failed to load paste");
          }
          setLoading(false);
          return;
        }

        const data: PasteData = await response.json();
        setPaste(data);
        setLoading(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load paste";
        setError(msg);
        setLoading(false);
      }
    };

    fetchPaste();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !paste) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-700">{error || "Paste not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Paste</h1>

          <div className="bg-gray-100 rounded p-4 font-mono text-sm whitespace-pre-wrap wrap-break-word">
            {paste.content}
          </div>

          <div className="mt-4 text-sm text-gray-600 space-y-1">
            {paste.remaining_views !== null && (
              <p>Views remaining: {paste.remaining_views}</p>
            )}
            {paste.expires_at && (
              <p>Expires: {new Date(paste.expires_at).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
