"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatisticCardProps = {
  title: string;
  value: string | number;
  tooltip?: string;
  icon?: ReactNode;
};

export default function StatisticsCard({
  title,
  value,
  tooltip,
  icon,
}: StatisticCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-row items-center justify-between">
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex flex-col items-start">
                  <h3 className="pb-1 text-sm font-medium text-muted-foreground">
                    {title}
                  </h3>
                  <span className="text-2xl font-bold">{value}</span>
                </TooltipTrigger>
                {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>
          {icon && <div className="p-4">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

