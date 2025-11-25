"use client";
import { motion } from "framer-motion";
import { BarChart3, Map, PieChart, TrendingUp, AlertTriangle } from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const sections: Section[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" />, color: "from-slate-600 to-slate-500" },
  { id: "temporal", label: "Temporal", icon: <TrendingUp className="w-4 h-4" />, color: "from-sky-700 to-sky-600" },
  { id: "geographic", label: "Geographic", icon: <Map className="w-4 h-4" />, color: "from-emerald-700 to-emerald-600" },
  { id: "analysis", label: "Analysis", icon: <PieChart className="w-4 h-4" />, color: "from-amber-700 to-amber-600" },
  { id: "action", label: "Take Action", icon: <AlertTriangle className="w-4 h-4" />, color: "from-rose-700 to-rose-600" },
];

interface SectionNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function SectionNav({ activeSection, onSectionChange }: SectionNavProps) {
  return (
    <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700/50 px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                transition-all duration-300 whitespace-nowrap
                ${isActive
                  ? "text-white shadow-md"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSection"
                  className={`absolute inset-0 bg-gradient-to-r ${section.color} rounded-xl`}
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {section.icon}
                <span className="hidden sm:inline">{section.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
