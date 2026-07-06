"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  value: number;        // 0–100
  size?: number;        // px
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  color?: string;
}

export function CircularGauge({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  className,
  color = "#FF6B9D",
}: CircularGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 50);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  const fontSize = size < 100 ? "text-lg" : "text-2xl";
  const subFontSize = size < 100 ? "text-[10px]" : "text-xs";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-100 dark:text-zinc-800"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold tabular-nums leading-none", fontSize)}>
          {Math.round(animatedValue)}
          <span className="text-[0.6em] font-normal">%</span>
        </span>
        {sublabel && (
          <span className={cn("mt-0.5 text-zinc-500 text-center leading-tight", subFontSize)}>
            {sublabel}
          </span>
        )}
      </div>
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}
