"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

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
    <>
      <div className=" p-6 border-1  items-center flex flex-row justify-between">
        <div className="">
          <Tooltip>
            <TooltipTrigger className="flex flex-col items-start">
              <h1 className="pb-1">{title}</h1>
              <span className="text-xl">{value}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="border-1 p-4">{icon}</div>
      </div>
    </>
  );
}
