"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Button loading state component
export function ButtonLoader({
  children,
  isLoading,
  loadingText,
  className,
}: {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? loadingText : children}
    </div>
  );
}

// Full screen loading component for auth and page transitions
export function FullScreenLoader({
  message = 'Loading...',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-background flex min-h-screen w-full items-center justify-center px-6",
        className
      )}
    >
      <div className="text-foreground flex flex-col items-center gap-3 text-base font-medium">
        <Loader2 className="h-8 w-8 animate-spin" />
        <div className="text-center">{message}</div>
      </div>
    </div>
  );
}

// Authentication loading component
export function AuthPageLoader({
  message = 'Opening your workspace',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return <FullScreenLoader message={message} className={className} />;
}




