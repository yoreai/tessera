"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import SearchableMultiSelect from "./SearchableMultiSelect";
import { ALL_CATEGORIES } from "../../lib/fireData";

interface CollapsibleSidebarProps {
  years: number[];
  selectedYears: (string | number)[];
  setSelectedYears: (years: (string | number)[]) => void;
  selectedTypes: (string | number)[];
  setSelectedTypes: (types: (string | number)[]) => void;
  cities: string[];
  selectedCities: (string | number)[];
  setSelectedCities: (cities: (string | number)[]) => void;
  totalCount: number;
  filteredCount: number;
}

export default function CollapsibleSidebar({
  years,
  selectedYears,
  setSelectedYears,
  selectedTypes,
  setSelectedTypes,
  cities,
  selectedCities,
  setSelectedCities,
  totalCount,
  filteredCount,
}: CollapsibleSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="p-4 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Filters</h2>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-600/20 dark:to-purple-600/20 rounded-xl p-4 border border-blue-300 dark:border-blue-500/30">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{filteredCount.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">of {totalCount.toLocaleString()} incidents</div>
        </div>
      </div>

      {/* Filters */}
      <SearchableMultiSelect
        label="Years"
        emoji="📅"
        options={years}
        selected={selectedYears}
        onChange={setSelectedYears}
        placeholder="Select years..."
      />

      <SearchableMultiSelect
        label="Incident Types"
        emoji="🔥"
        options={[...ALL_CATEGORIES]}
        selected={selectedTypes}
        onChange={setSelectedTypes}
        placeholder="Search incident types..."
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            <span className="mr-2">🏙️</span>
            Municipalities
          </label>
          {selectedCities.length === 0 ? (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ All cities</span>
          ) : (
            <button
              onClick={() => setSelectedCities([])}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Show all cities
            </button>
          )}
        </div>
        <SearchableMultiSelect
          label=""
          options={cities}
          selected={selectedCities}
          onChange={setSelectedCities}
          placeholder={selectedCities.length === 0 ? "Showing all cities (filter to narrow)" : "Search municipalities..."}
        />
        <p className="text-xs text-gray-500 dark:text-gray-500 italic">
          {selectedCities.length === 0
            ? "All municipalities included. Select specific cities to filter."
            : `Filtered to ${selectedCities.length} of ${cities.length} displayed cities`
          }
        </p>
      </div>

      {/* Data Note */}
      <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600/30 rounded-xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          <strong>📊 Data Note:</strong> Post-2020 fire alarms reclassified as "Removed" - corrected for analysis.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden lg:block bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700/50 h-screen sticky top-0 overflow-hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 items-center justify-center w-6 h-16 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-r-lg transition-all duration-300 shadow-md"
        style={{ left: isOpen ? "320px" : "0px" }}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-2xl transition-all duration-300"
      >
        <Filter className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Filters</span>
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

