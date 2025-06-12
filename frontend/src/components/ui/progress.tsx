"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * プログレスバーコンポーネント
 * 
 * 進捗率を視覚的に表示するためのコンポーネント。
 * 0から100のパーセンテージ値を受け取り、バーとして表示する。
 */
const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    max?: number
  }
>(({ className, value, max = 100, ...props }, ref) => {
  void max; // max is available for future use
  return (
  <div
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
  );
})
Progress.displayName = "Progress"

export { Progress }