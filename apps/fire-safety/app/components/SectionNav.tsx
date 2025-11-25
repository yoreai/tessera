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
  { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" />, color: "from-blue-500 to-cyan-500" },
  { id: "temporal", label: "Temporal", icon: <TrendingUp className="w-4 h-4" />, color: "from-purple-500 to-pink-500" },
  { id: "geographic", label: "Geographic", icon: <Map className="w-4 h-4" />, color: "from-green-500 to-emerald-500" },
  { id: "analysis", label: "Analysis", icon: <PieChart className="w-4 h-4" />, color: "from-orange-500 to-red-500" },
  { id: "action", label: "Take Action", icon: <AlertTriangle className="w-4 h-4" />, color: "from-red-500 to-rose-500" },
];

interface SectionNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function SectionNav({ activeSection, onSectionChange }: SectionNavProps) {
  return (
    <div className="sticky top-0 z-40 bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-4 py-3">
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
                  ? "text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
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

