"use client";

import React from "react";

interface SkeletonProps {
  variant?: "table" | "block";
  rows?: number;
  className?: string;
}

export function Skeleton({ variant = "block", rows = 5, className }: SkeletonProps) {
  if (variant === "table") {
    return (
      <div className={className}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-11 gap-4 py-3 px-6 animate-pulse">
            <div className="col-span-2 h-4 rounded" style={{ backgroundColor: 'var(--border-color)' }} />
            <div className="col-span-7 h-4 rounded" style={{ backgroundColor: 'var(--border-color)' }} />
            <div className="col-span-2 h-4 rounded" style={{ backgroundColor: 'var(--border-color)' }} />
          </div>
        ))}
      </div>
    );
  }

  return <div className={`h-4 rounded animate-pulse ${className ?? ""}`} style={{ backgroundColor: 'var(--border-color)' }} />;
}

export default Skeleton;
