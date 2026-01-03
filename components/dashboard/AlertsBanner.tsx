"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Alert {
  signal_name: string;
  severity: "high" | "medium" | "low";
  count: number;
  latest_timestamp: string;
}

interface AlertsBannerProps {
  alerts: Alert[];
  onDismiss?: () => void;
}

export default function AlertsBanner({ alerts, onDismiss }: AlertsBannerProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    // Load dismissed alerts from localStorage
    const stored = localStorage.getItem("dismissedAlerts");
    if (stored) {
      setDismissed(JSON.parse(stored));
    }
  }, []);

  const handleDismiss = (alertKey: string) => {
    const newDismissed = [...dismissed, alertKey];
    setDismissed(newDismissed);
    localStorage.setItem("dismissedAlerts", JSON.stringify(newDismissed));
    if (onDismiss) onDismiss();
  };

  const visibleAlerts = alerts.filter(
    (alert) => !dismissed.includes(alert.signal_name)
  );

  if (visibleAlerts.length === 0) return null;

  const highSeverityAlerts = visibleAlerts.filter((a) => a.severity === "high");
  const mediumSeverityAlerts = visibleAlerts.filter(
    (a) => a.severity === "medium"
  );

  return (
    <Alert
      className={`mb-4 ${
        highSeverityAlerts.length > 0
          ? "border-red-500 bg-red-50"
          : "border-orange-500 bg-orange-50"
      }`}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>
          {highSeverityAlerts.length > 0
            ? `${highSeverityAlerts.length} High Priority Alert${
                highSeverityAlerts.length > 1 ? "s" : ""
              }`
            : `${mediumSeverityAlerts.length} Medium Priority Alert${
                mediumSeverityAlerts.length > 1 ? "s" : ""
              }`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDismiss("all")}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {visibleAlerts.slice(0, 5).map((alert) => (
            <Badge
              key={alert.signal_name}
              variant={
                alert.severity === "high" ? "destructive" : "secondary"
              }
              className="cursor-pointer"
            >
              {alert.count} {alert.signal_name.replace(/_/g, " ")}
            </Badge>
          ))}
          {visibleAlerts.length > 5 && (
            <span className="text-sm text-muted-foreground">
              +{visibleAlerts.length - 5} more
            </span>
          )}
          <Link href="/dashboard/issues">
            <Button variant="link" size="sm" className="h-auto p-0 ml-2">
              View All →
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}

