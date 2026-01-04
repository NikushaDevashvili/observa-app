"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface ProgressData {
  currentStep: string;
  progressPercentage: number;
  completedAt: string | null;
  startedAt: string;
}

interface OnboardingProgressProps {
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function OnboardingProgress({
  showLabel = true,
  size = "md",
}: OnboardingProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  useEffect(() => {
    async function fetchProgress() {
      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/onboarding/progress`, {
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
          throw new Error("Failed to fetch progress");
        }

        const data = await response.json();
        // Handle response structure: API returns { success: true, progress: {...} }
        if (data.success && data.progress) {
          setProgress(data.progress);
        } else if (data.currentStep || data.progressPercentage !== undefined) {
          // Fallback for direct structure
          setProgress(data);
        }
      } catch (error) {
        // Silently fail - don't show progress if there's an error
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, []);

  const isComplete = progress.progressPercentage >= 100;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Onboarding Progress
          </span>
          {isComplete ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Complete
            </span>
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {progress.progressPercentage}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heightClasses[size]}`}>
        <div
          className={`${
            isComplete ? "bg-green-600" : "bg-blue-600"
          } ${heightClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

