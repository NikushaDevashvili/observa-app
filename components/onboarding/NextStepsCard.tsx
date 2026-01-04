"use client";

import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface NextStep {
  taskKey: string;
  title: string;
  description: string;
  type: "automatic" | "manual";
  actionUrl?: string;
  actionText?: string;
}

export function NextStepsCard() {
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNextSteps() {
      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/onboarding/next-steps`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Handle 401 - unauthorized (silently fail)
          if (response.status === 401 || response.status === 404) {
            setLoading(false);
            return;
          }
          // Handle 500 - server error (silently fail)
          if (response.status >= 500) {
            setLoading(false);
            return;
          }
          throw new Error("Failed to fetch next steps");
        }

        const data = await response.json();
        // Handle response structure: API returns { success: true, nextSteps: [...] }
        if (data.success && Array.isArray(data.nextSteps)) {
          setNextSteps(data.nextSteps);
        } else if (Array.isArray(data)) {
          // Fallback for direct array response
          setNextSteps(data);
        } else {
          setNextSteps([]);
        }
      } catch (error) {
        // Silently fail - don't show next steps if there's an error
        console.error("Error fetching next steps:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNextSteps();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (nextSteps.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Recommended Next Steps
        </h3>
        <p className="text-sm text-gray-600">
          Your next steps are being prepared. Please refresh the page in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recommended Next Steps
      </h3>
      <div className="space-y-3">
        {nextSteps.map((step, index) => (
          <div
            key={step.taskKey}
            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {step.title}
                  </h4>
                  {step.type === "automatic" && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      Automatic
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className="text-xs text-gray-600 ml-8">
                    {step.description}
                  </p>
                )}
              </div>
              {step.actionUrl && (
                <a
                  href={step.actionUrl}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                >
                  {step.actionText || "View"}
                  <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

