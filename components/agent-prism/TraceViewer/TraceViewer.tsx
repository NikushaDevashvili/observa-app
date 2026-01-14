import type { TraceRecord, TraceSpan } from "@evilmartians/agent-prism-types";

import {
  filterSpansRecursively,
  flattenSpans,
} from "@evilmartians/agent-prism-data";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { type BadgeProps } from "../Badge";
import { useIsMobile } from "../shared";
import { type SpanCardViewOptions } from "../SpanCard/SpanCard";
import { TraceViewerDesktopLayout } from "./TraceViewerDesktopLayout";
import { TraceViewerMobileLayout } from "./TraceViewerMobileLayout";

export interface ErrorSummary {
  totalErrors: number;
  errorTypes: Record<string, number>;
  errorSpans: string[];
  hasErrors: boolean;
}

export interface TraceViewerData {
  traceRecord: TraceRecord;
  badges?: Array<BadgeProps>;
  spans: TraceSpan[];
  spanCardViewOptions?: SpanCardViewOptions;
  errorSummary?: ErrorSummary;
}

export interface TraceViewerProps {
  data: Array<TraceViewerData>;
  spanCardViewOptions?: SpanCardViewOptions;
}

export const TraceViewer = ({
  data,
  spanCardViewOptions,
}: TraceViewerProps) => {
  const isMobile = useIsMobile();
  const hasInitialized = React.useRef(false);

  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | undefined>();
  const [searchValue, setSearchValue] = useState("");
  const [traceListExpanded, setTraceListExpanded] = useState(true);

  const [selectedTrace, setSelectedTrace] = useState<
    TraceRecordWithDisplayData | undefined
  >(
    data[0]
      ? {
          ...data[0].traceRecord,
          badges: data[0].badges,
          spanCardViewOptions: data[0].spanCardViewOptions,
          errorSummary: data[0].errorSummary,
        }
      : undefined,
  );
  const [selectedTraceSpans, setSelectedTraceSpans] = useState<TraceSpan[]>(
    data[0]?.spans || [],
  );

  const traceRecords: TraceRecordWithDisplayData[] = useMemo(() => {
    return data.map((item) => ({
      ...item.traceRecord,
      badges: item.badges,
      spanCardViewOptions: item.spanCardViewOptions,
      errorSummary: item.errorSummary,
    }));
  }, [data]);

  const filteredSpans = useMemo(() => {
    if (!searchValue.trim()) {
      return selectedTraceSpans;
    }
    return filterSpansRecursively(selectedTraceSpans, searchValue);
  }, [selectedTraceSpans, searchValue]);

  const allIds = useMemo(() => {
    return flattenSpans(selectedTraceSpans).map((span) => span.id);
  }, [selectedTraceSpans]);

  const [expandedSpansIds, setExpandedSpansIds] = useState<string[]>(allIds);

  useEffect(() => {
    setExpandedSpansIds(allIds);
  }, [allIds]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }

    if (!isMobile && selectedTraceSpans.length > 0 && !selectedSpan) {
      setSelectedSpan(selectedTraceSpans[0]);
    }
  }, [selectedTraceSpans, isMobile, selectedSpan]);

  const handleExpandAll = useCallback(() => {
    setExpandedSpansIds(allIds);
  }, [allIds]);

  const handleCollapseAll = useCallback(() => {
    setExpandedSpansIds([]);
  }, []);

  const handleTraceSelect = useCallback(
    (trace: TraceRecord) => {
      setSelectedSpan(undefined);
      setExpandedSpansIds([]);
      const traceData = data.find((item) => item.traceRecord.id === trace.id);
      setSelectedTrace(
        traceData
          ? {
              ...traceData.traceRecord,
              badges: traceData.badges,
              spanCardViewOptions: traceData.spanCardViewOptions,
              errorSummary: traceData.errorSummary,
            }
          : undefined,
      );
      setSelectedTraceSpans(traceData?.spans ?? []);
    },
    [data],
  );

  const handleClearTraceSelection = useCallback(() => {
    setSelectedTrace(undefined);
    setSelectedTraceSpans([]);
    setSelectedSpan(undefined);
    setExpandedSpansIds([]);
  }, []);

  // Function to find span by ID and select it
  const handleJumpToSpan = useCallback(
    (spanId: string) => {
      const allSpans = flattenSpans(selectedTraceSpans);
      const targetSpan = allSpans.find((span) => span.id === spanId);
      if (targetSpan) {
        setSelectedSpan(targetSpan);
        // Expand parent spans to make the target span visible
        const parentIds: string[] = [];
        let currentSpan: TraceSpan | undefined = targetSpan;
        const parentId = (currentSpan as any).parentId;
        if (parentId) {
          let currentParentId: string | null = parentId;
          while (currentParentId) {
            parentIds.push(currentParentId);
            const parentSpan = allSpans.find((s) => s.id === currentParentId);
            currentParentId = parentSpan ? (parentSpan as any).parentId : null;
          }
        }
        setExpandedSpansIds((prev) => [...new Set([...prev, ...parentIds])]);
      }
    },
    [selectedTraceSpans],
  );

  const props: TraceViewerLayoutProps = {
    traceRecords,
    traceListExpanded,
    setTraceListExpanded,
    selectedTrace,
    selectedTraceId: selectedTrace?.id,
    selectedSpan,
    setSelectedSpan,
    searchValue,
    setSearchValue,
    filteredSpans,
    expandedSpansIds,
    setExpandedSpansIds,
    handleExpandAll,
    handleCollapseAll,
    handleTraceSelect,
    spanCardViewOptions:
      spanCardViewOptions || selectedTrace?.spanCardViewOptions,
    onClearTraceSelection: handleClearTraceSelection,
    onJumpToSpan: handleJumpToSpan,
  };

  return (
    <div className="h-[calc(100vh-50px)] w-full max-w-full min-w-0 overflow-hidden">
      <div className="hidden h-full lg:block w-full max-w-full min-w-0">
        <TraceViewerDesktopLayout {...props} />
      </div>
      <div className="h-full lg:hidden w-full max-w-full min-w-0">
        <TraceViewerMobileLayout {...props} />
      </div>
    </div>
  );
};

export interface TraceRecordWithDisplayData extends TraceRecord {
  spanCardViewOptions?: SpanCardViewOptions;
  badges?: BadgeProps[];
  errorSummary?: ErrorSummary;
}

export interface TraceViewerLayoutProps {
  traceRecords: TraceRecordWithDisplayData[];
  traceListExpanded: boolean;
  setTraceListExpanded: (expanded: boolean) => void;
  selectedTrace: TraceRecordWithDisplayData | undefined;
  selectedTraceId?: string;
  selectedSpan: TraceSpan | undefined;
  setSelectedSpan: (span: TraceSpan | undefined) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  filteredSpans: TraceSpan[];
  expandedSpansIds: string[];
  setExpandedSpansIds: (ids: string[]) => void;
  handleExpandAll: () => void;
  handleCollapseAll: () => void;
  handleTraceSelect: (trace: TraceRecord) => void;
  spanCardViewOptions?: SpanCardViewOptions;
  onClearTraceSelection: () => void;
  onJumpToSpan?: (spanId: string) => void;
}
