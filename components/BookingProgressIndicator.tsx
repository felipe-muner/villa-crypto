"use client";

import { FileText, CreditCard, CheckCircle, Home, XCircle } from "lucide-react";

interface BookingProgressIndicatorProps {
  step: number; // 0 = cancelled, 1 = pending, 2 = paid, 3 = confirmed, 4 = completed
  size?: "sm" | "md" | "lg";
  paymentDetected?: boolean; // Show orange indicator when payment is detected but not confirmed
  cancelled?: boolean;
}

export function BookingProgressIndicator({
  step,
  size = "md",
  paymentDetected = false,
  cancelled = false,
}: BookingProgressIndicatorProps) {
  const sizeConfig = {
    sm: { icon: "h-4 w-4", line: "w-4 h-0.5" },
    md: { icon: "h-5 w-5", line: "w-5 h-0.5" },
    lg: { icon: "h-6 w-6", line: "w-6 h-1" },
  };

  const config = sizeConfig[size];

  // Colors for each step (matching the image: blue → green → purple → purple)
  const stepColors: Record<number, string> = {
    1: "text-blue-500",    // Pending/Booked
    2: "text-green-500",   // Paid
    3: "text-purple-500",  // Confirmed
    4: "text-purple-500",  // Completed
  };

  const lineColors: Record<number, string> = {
    2: "bg-green-500",
    3: "bg-purple-500",
    4: "bg-purple-500",
  };

  const inactiveColor = "text-gray-300 dark:text-gray-600";
  const inactiveLineColor = "bg-gray-200 dark:bg-gray-700";
  const paymentDetectedColor = "text-orange-500";

  if (cancelled) {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <XCircle className={config.icon} />
        <span className="text-xs font-medium">Cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {/* Step 1: Booked/Pending */}
      <div className={`${config.icon} ${step >= 1 ? stepColors[1] : inactiveColor}`}>
        <FileText className="h-full w-full" />
      </div>

      {/* Line 1-2 */}
      <div
        className={`${config.line} mx-0.5 rounded-full transition-colors ${
          step >= 2 ? lineColors[2] : inactiveLineColor
        }`}
      />

      {/* Step 2: Paid */}
      <div
        className={`${config.icon} ${
          paymentDetected && step < 2
            ? paymentDetectedColor
            : step >= 2
            ? stepColors[2]
            : inactiveColor
        }`}
      >
        <CreditCard className="h-full w-full" />
      </div>

      {/* Line 2-3 */}
      <div
        className={`${config.line} mx-0.5 rounded-full transition-colors ${
          step >= 3 ? lineColors[3] : inactiveLineColor
        }`}
      />

      {/* Step 3: Confirmed */}
      <div className={`${config.icon} ${step >= 3 ? stepColors[3] : inactiveColor}`}>
        <CheckCircle className="h-full w-full" />
      </div>

      {/* Line 3-4 */}
      <div
        className={`${config.line} mx-0.5 rounded-full transition-colors ${
          step >= 4 ? lineColors[4] : inactiveLineColor
        }`}
      />

      {/* Step 4: Completed */}
      <div className={`${config.icon} ${step >= 4 ? stepColors[4] : inactiveColor}`}>
        <Home className="h-full w-full" />
      </div>
    </div>
  );
}
