"use client";

import React, { useState } from "react";
import { Search, Building, Filter, BookOpen } from "lucide-react";

interface CutoffRow {
  id: string;
  allotmentGroup: string;
  allottedCat: string;
  seatType: string;
  openingRank: number;
  closingRank: number;
  totalSeats: number;
  institute: {
    id: string;
    name: string;
    shortName: string | null;
    location: string | null;
  };
  branch: {
    id: string;
    name: string;
    fullName: string | null;
  };
}

interface CutoffAnalyzerContainerProps {
  initialCutoffs: CutoffRow[];
  colleges: { id: string; name: string; shortName: string | null }[];
  branches: { id: string; name: string }[];
}

export function CutoffAnalyzerContainer({
  initialCutoffs,
  colleges,
  branches,
}: CutoffAnalyzerContainerProps) {
  const [search, setSearch] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Filter lists
  const categories = Array.from(new Set(initialCutoffs.map((c) => c.allottedCat))).sort();

  const filteredCutoffs = initialCutoffs.filter((c) => {
    const matchesSearch =
      c.institute.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.institute.shortName && c.institute.shortName.toLowerCase().includes(search.toLowerCase())) ||
      c.branch.name.toLowerCase().includes(search.toLowerCase());

    const matchesCollege = selectedCollege === "ALL" || c.institute.id === selectedCollege;
    const matchesBranch = selectedBranch === "ALL" || c.branch.id === selectedBranch;
    const matchesGroup = selectedGroup === "ALL" || c.allotmentGroup === selectedGroup;
    const matchesCategory = selectedCategory === "ALL" || c.allottedCat === selectedCategory;

    return matchesSearch && matchesCollege && matchesBranch && matchesGroup && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Box */}
      <div className="glass-panel p-6 rounded-3xl border border-white/50 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold">Configure Cutoff Analyzer Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3.5">
          {/* Text Search */}
          <div className="md:col-span-2 relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search college or branch name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none w-full focus:outline-none text-slate-700 font-semibold"
            />
          </div>

          {/* College Filter */}
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="bg-white border border-slate-200 text-slate-750 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName || c.name}
              </option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-white border border-slate-200 text-slate-750 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-white border border-slate-200 text-slate-750 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Groups</option>
            <option value="PCM">PCM Group</option>
            <option value="PCB">PCB Group</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 text-slate-750 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-800 font-extrabold">{filteredCutoffs.length}</span> entries
        </span>
      </div>

      {/* Cutoffs Table Card */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-4 px-6">College Info</th>
                <th className="py-4 px-6">Branch Name</th>
                <th className="py-4 px-6 text-center">Group</th>
                <th className="py-4 px-6 text-center">Allotted Cat</th>
                <th className="py-4 px-6 text-center">Seat Type</th>
                <th className="py-4 px-6 text-center">Opening Rank</th>
                <th className="py-4 px-6 text-center">Closing Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCutoffs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* College info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {c.institute.shortName}
                        </span>
                        <span className="text-[10px] text-slate-450 font-medium">
                          {c.institute.location}
                        </span>
                      </div>
                    </div>
                  </td>
                  {/* Branch info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-550 shrink-0" />
                      <span className="text-xs font-bold text-slate-700">{c.branch.name}</span>
                    </div>
                  </td>
                  {/* Group */}
                  <td className="py-4 px-6 text-center">
                    <span className="text-xs font-extrabold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50 uppercase">
                      {c.allotmentGroup}
                    </span>
                  </td>
                  {/* Category */}
                  <td className="py-4 px-6 text-center">
                    <span className="text-xs font-extrabold text-slate-600 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-lg uppercase">
                      {c.allottedCat}
                    </span>
                  </td>
                  {/* Seat Type */}
                  <td className="py-4 px-6 text-center">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                      {c.seatType}
                    </span>
                  </td>
                  {/* Opening */}
                  <td className="py-4 px-6 text-center font-extrabold text-slate-700 text-sm">
                    {c.openingRank}
                  </td>
                  {/* Closing */}
                  <td className="py-4 px-6 text-center font-extrabold text-slate-750 text-sm">
                    {c.closingRank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCutoffs.length === 0 && (
          <div className="py-12 text-center text-slate-450 text-xs font-medium">
            No cutoffs found. Please adjust your filter selections.
          </div>
        )}
      </div>
    </div>
  );
}
