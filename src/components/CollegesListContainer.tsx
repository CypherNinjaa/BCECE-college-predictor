"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Building, ChevronRight, Award } from "lucide-react";
import { motion } from "framer-motion";

interface CollegeItem {
  id: string;
  name: string;
  shortName: string | null;
  location: string | null;
  type: string | null;
  cutoffs: { id: string }[];
}

interface CollegesListContainerProps {
  colleges: CollegeItem[];
}

export function CollegesListContainer({ colleges }: CollegesListContainerProps) {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Get unique locations
  const locations = Array.from(
    new Set(colleges.map((c) => c.location).filter((loc): loc is string => !!loc))
  ).sort();

  // Filter colleges
  const filteredColleges = colleges.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.shortName && c.shortName.toLowerCase().includes(search.toLowerCase()));

    const matchesLocation = locationFilter === "ALL" || c.location === locationFilter;
    const matchesType = typeFilter === "ALL" || c.type === typeFilter;

    return matchesSearch && matchesLocation && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Filter and Search Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-white/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="w-full md:w-96 flex items-center gap-2 bg-slate-100/80 border border-slate-200/50 rounded-xl px-3.5 py-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search college by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-sm w-full focus:outline-none text-slate-700 font-medium placeholder:text-slate-455"
          />
        </div>

        {/* Filters */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Location Select */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-750 py-2 px-3 pr-8 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none min-w-[120px]"
            >
              <option value="ALL">All Cities</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 rotate-90 pointer-events-none" />
          </div>

          {/* Type Select */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-750 py-2 px-3 pr-8 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none min-w-[140px]"
            >
              <option value="ALL">All College Types</option>
              <option value="Government">Government</option>
              <option value="Self-Finance">Self-Finance</option>
            </select>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* College Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredColleges.map((college, idx) => (
          <motion.div
            key={college.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.03, 0.4) }}
            className="bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 group"
          >
            <div>
              {/* Badges */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {college.type}
                </span>
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {college.location}
                </span>
              </div>

              {/* College title */}
              <h3 className="font-display font-bold text-base text-slate-800 line-clamp-2 min-h-12 group-hover:text-indigo-600 transition-colors">
                {college.shortName || college.name}
              </h3>

              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {college.name}
              </p>
            </div>

            {/* Bottom info + link */}
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" />
                {college.cutoffs.length} cutoff combos
              </span>

              <Link
                href={`/colleges/${college.id}`}
                className="flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 group-hover:translate-x-0.5 transition-all"
              >
                View Cutoffs
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredColleges.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 max-w-md mx-auto space-y-3">
          <Building className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-display font-bold text-slate-700">No Colleges Match Filters</h3>
          <p className="text-xs text-slate-500 px-4">
            Try adjusting your search query or location filters to see participating Bihar BCECE institutes.
          </p>
        </div>
      )}
    </div>
  );
}
