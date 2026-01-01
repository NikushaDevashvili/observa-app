"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TraceViewerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("TraceViewer error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
          <h2 className="text-2xl font-bold text-red-600">Error rendering trace</h2>
          <p className="text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <pre className="text-xs bg-muted p-4 rounded max-w-2xl overflow-auto">
            {this.state.error?.stack}
          </pre>
          <Link href="/dashboard/traces">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Traces
            </Button>
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}

