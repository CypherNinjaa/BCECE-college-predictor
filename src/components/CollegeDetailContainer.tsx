"use client";

import React, { useState } from "react";
import { MapPin, ArrowLeft, Filter, BookOpen } from "lucide-react";
import Link from "next/link";

interface CutoffDetail {
  id: string;
  allotmentGroup: string;
  allottedCat: string;
  seatType: string;
  openingRank: number;
  closingRank: number;
  totalSeats: number;
  round: number;
  branch: {
    id: string;
    name: string;
    fullName: string | null;
  };
}

interface CollegeDetailContainerProps {
  college: {
    id: string;
    name: string;
    shortName: string | null;
    location: string | null;
    type: string | null;
  };
  cutoffs: CutoffDetail[];
}

export function CollegeDetailContainer({ college, cutoffs }: CollegeDetailContainerProps) {
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [roundFilter, setRoundFilter] = useState("ALL");

  // Unique categories
  const categories = Array.from(new Set(cutoffs.map((c) => c.allottedCat))).sort();
  // Unique branches
  const branches = Array.from(
    new Map(cutoffs.map((c) => [c.branch.id, c.branch.name])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  // Filtered Cutoffs
  const filteredCutoffs = cutoffs.filter((c) => {
    const matchesCategory = categoryFilter === "ALL" || c.allottedCat === categoryFilter;
    const matchesGroup = groupFilter === "ALL" || c.allotmentGroup === groupFilter;
    const matchesBranch = branchFilter === "ALL" || c.branch.id === branchFilter;
    const matchesRound = roundFilter === "ALL" || String(c.round) === roundFilter;

    return matchesCategory && matchesGroup && matchesBranch && matchesRound;
  });

  return (
    <div className="space-y-6">
      {/* College Info Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {college.type}
              </span>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {college.location}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-tight">
              {college.shortName || college.name}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              {college.name}
            </p>
          </div>

          <Link
            href="/colleges"
            className="self-start sm:self-center inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Colleges
          </Link>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="glass-panel p-5 rounded-2xl border border-white/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 shrink-0">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold">Filter Cutoffs</span>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3 justify-end">
          {/* Branch filter */}
          <div className="relative">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-750 py-2 px-3 pr-8 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none sm:min-w-[150px]"
            >
              <option value="ALL">All Branches</option>
              {branches.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 rotate-90 pointer-events-none" />
          </div>

          {/* Group filter */}
          <div className="relative">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-750 py-2 px-3 pr-8 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none sm:min-w-[120px]"
            >
              <option value="ALL">All Groups</option>
              <option value="PCM">PCM Group</option>
              <option value="PCB">PCB Group</option>
            </select>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 rotate-90 pointer-events-none" />
          </div>

          {/* Round filter */}
          <div className="relative">
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-750 py-2 px-3 pr-8 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none sm:min-w-[100px]"
            >
              <option value="ALL">All Rounds</option>
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
            </select>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 rotate-90 pointer-events-none" />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-750 py-2 px-3 pr-8 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none sm:min-w-[130px]"
            >
              <option value="ALL">All Seat Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} Seat
                </option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Cutoffs Table Card */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-4 px-6">Branch Name</th>
                <th className="py-4 px-6 text-center">Group</th>
                <th className="py-4 px-6 text-center">Round</th>
                <th className="py-4 px-6 text-center">Allotted Category</th>
                <th className="py-4 px-6 text-center">Seat Type</th>
                <th className="py-4 px-6 text-center">Opening Rank</th>
                <th className="py-4 px-6 text-center">Closing Rank</th>
                <th className="py-4 px-6 text-center">Total Seats</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCutoffs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          {c.branch.name}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium">
                          {c.branch.fullName}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100/50 uppercase">
                      {c.allotmentGroup}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center font-bold text-slate-500 text-xs">
                    Round {c.round}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-xs font-extrabold text-slate-600 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-lg uppercase">
                      {c.allottedCat}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                      {c.seatType}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center font-extrabold text-slate-700 text-sm">
                    {c.openingRank}
                  </td>
                  <td className="py-4 px-6 text-center font-extrabold text-slate-750 text-sm">
                    {c.closingRank}
                  </td>
                  <td className="py-4 px-6 text-center font-bold text-slate-500 text-xs">
                    {c.totalSeats}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCutoffs.length === 0 && (
          <div className="py-12 text-center text-slate-450 text-xs font-medium">
            No cutoffs found matching your criteria. Try widening your filters.
          </div>
        )}
      </div>
    </div>
  );
}

// Chevron component helper
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
