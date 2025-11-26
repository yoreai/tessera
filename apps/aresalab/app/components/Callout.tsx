"use client";

import { Info, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react";
import { ReactNode } from "react";

interface CalloutProps {
  type: "note" | "tip" | "warning" | "info";
  title?: string;
  children: ReactNode;
}

const calloutConfig = {
  note: {
    icon: Info,
    bgClass: "bg-blue-50 dark:bg-blue-900/20",
    borderClass: "border-blue-500",
    iconClass: "text-blue-500",
    titleClass: "text-blue-800 dark:text-blue-300",
  },
  tip: {
    icon: Lightbulb,
    bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
    borderClass: "border-emerald-500",
    iconClass: "text-emerald-500",
    titleClass: "text-emerald-800 dark:text-emerald-300",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-amber-50 dark:bg-amber-900/20",
    borderClass: "border-amber-500",
    iconClass: "text-amber-500",
    titleClass: "text-amber-800 dark:text-amber-300",
  },
  info: {
    icon: CheckCircle,
    bgClass: "bg-purple-50 dark:bg-purple-900/20",
    borderClass: "border-purple-500",
    iconClass: "text-purple-500",
    titleClass: "text-purple-800 dark:text-purple-300",
  },
};

export function Callout({ type, title, children }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgClass} border-l-4 ${config.borderClass} p-4 my-6 rounded-r-lg`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconClass}`} />
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold mb-2 ${config.titleClass}`}>
              {title}
            </h4>
          )}
          <div className="text-gray-700 dark:text-gray-300">{children}</div>
        </div>
      </div>
    </div>
  );
}

