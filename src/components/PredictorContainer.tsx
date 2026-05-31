"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Check,
  ChevronDown,
  Sparkles,
  BookOpen,
  Building2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Institute {
  id: string;
  name: string;
  shortName: string | null;
  location: string | null;
  type: string | null;
}

interface Branch {
  id: string;
  name: string;
  fullName: string | null;
  group: string;
}

interface PredictorContainerProps {
  colleges: Institute[];
  branches: Branch[];
}

interface PredictionResult {
  id: string;
  institute: {
    id: string;
    name: string;
    shortName: string;
    location: string;
    type: string;
  };
  branch: {
    id: string;
    name: string;
    fullName: string;
  };
  openingRank: number;
  closingRank: number;
  totalSeats: number;
  allottedCategory: string;
  seatType: string;
  chanceLevel: "HIGH" | "MODERATE" | "LOW";
  chancePercentage: number;
}

export function PredictorContainer({ colleges, branches }: PredictorContainerProps) {
  // Form State
  const [subGroup, setSubGroup] = useState<"PCM" | "PCB" | "PCMB">("PCMB");
  const [category, setCategory] = useState<"UR" | "BC" | "EBC" | "SC" | "ST">("UR");
  const [rankType, setRankType] = useState<"PCM" | "PCB">("PCM");
  const [rankSubCategory, setRankSubCategory] = useState<"UR" | "CAT" | "RCG" | "DQ" | "SMQ">("UR");
  const [rankValue, setRankValue] = useState<string>("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);

  // UI Dropdown States
  const [branchSearch, setBranchSearch] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  // Predictions State
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state for results
  const [collegeTypeFilter, setCollegeTypeFilter] = useState<string>("ALL"); // ALL, Government, Self-Finance

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rankValue || isNaN(Number(rankValue)) || Number(rankValue) <= 0) {
      setError("Please enter a valid rank greater than 0");
      return;
    }

    setError(null);
    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subGroup,
          category,
          rankType,
          rankSubCategory,
          rankValue: Number(rankValue),
          branches: selectedBranches,
          institutes: selectedColleges,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setPredictions(resData.data.predictions);
      } else {
        setError(resData.error || "Failed to fetch predictions");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBranch = (id: string) => {
    setSelectedBranches((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCollege = (id: string) => {
    setSelectedColleges((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const filteredColleges = colleges.filter((c) =>
    c.name.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  // Filtered Predictions
  const displayPredictions = predictions.filter((p) => {
    if (collegeTypeFilter === "ALL") return true;
    return p.institute.type === collegeTypeFilter;
  });

  return (
    <div className="w-full">
      {/* Search / Predictor Form Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl border border-white/50 mb-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Filter className="w-4 h-4" />
          </div>
          <h2 className="font-display font-bold text-xl text-slate-800">
            Configure Prediction Criteria
          </h2>
        </div>

        <form onSubmit={handlePredict} className="space-y-6">
          {/* Sub Group & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sub Group */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Your Academic Group
              </label>
              <div className="grid grid-cols-4 gap-2 bg-slate-100/80 p-1 rounded-xl">
                {(["PCMB", "PCM", "PCB"] as const).map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSubGroup(group)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                      subGroup === group
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {group}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSubGroup("PCMB")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                    subGroup === "PCMB"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  } hidden`}
                >
                  All
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                Choose PCM (Maths), PCB (Biology), or PCMB (Both)
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Your Social Category
              </label>
              <div className="grid grid-cols-5 gap-1.5 bg-slate-100/80 p-1 rounded-xl">
                {(["UR", "BC", "EBC", "SC", "ST"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all duration-200 ${
                      category === cat
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                BC/EBC/SC/ST candidates also compete for UR (General) seats
              </p>
            </div>
          </div>

          {/* Rank Type & Sub Category & Rank Value */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            {/* Rank Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Predicting For Rank Type
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl">
                {(["PCM", "PCB"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setRankType(type);
                      // Reset sub category if invalid
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                      rankType === type
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {type} Rank
                  </button>
                ))}
              </div>
            </div>

            {/* Rank Sub Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rank Sub-Category
              </label>
              <div className="relative">
                <select
                  value={rankSubCategory}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRankSubCategory(e.target.value as "UR" | "CAT" | "RCG" | "DQ" | "SMQ")}
                  className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 appearance-none"
                >
                  <option value="UR">UR (Unreserved) Rank</option>
                  <option value="CAT">Category Rank</option>
                  {category !== "UR" && <option value="RCG">RCG (Reserved Girl) Rank</option>}
                  <option value="DQ">DQ (Disabled Quota) Rank</option>
                  <option value="SMQ">SMQ (Servicemen Quota) Rank</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Rank Value */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Enter Your Rank Value
              </label>
              <input
                type="number"
                value={rankValue}
                onChange={(e) => setRankValue(e.target.value)}
                placeholder="e.g. 450"
                className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 rounded-xl text-sm font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                min="1"
                required
              />
            </div>
          </div>

          {/* Preferred Branches & Colleges (Optional Filters) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Preferred Branches */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Filter by Branches (Optional)
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowBranchDropdown(!showBranchDropdown);
                  setShowCollegeDropdown(false);
                }}
                className="w-full flex items-center justify-between bg-white border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left transition-all duration-200"
              >
                <span>
                  {selectedBranches.length === 0
                    ? "All Branches Selected"
                    : `${selectedBranches.length} Branch(es) Selected`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {showBranchDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-30 mt-2 w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-4 max-h-60 overflow-y-auto"
                  >
                    <div className="flex items-center gap-2 mb-3 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search branches..."
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        className="bg-transparent border-none text-xs w-full focus:outline-none py-1 text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      {filteredBranches.map((branch) => {
                        const isChecked = selectedBranches.includes(branch.id);
                        return (
                          <button
                            key={branch.id}
                            type="button"
                            onClick={() => toggleBranch(branch.id)}
                            className="flex items-center justify-between w-full text-left py-1.5 px-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                          >
                            <span>{branch.name}</span>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isChecked
                                  ? "bg-indigo-500 border-indigo-500 text-white"
                                  : "border-slate-200"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Preferred Colleges */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Filter by Colleges (Optional)
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowCollegeDropdown(!showCollegeDropdown);
                  setShowBranchDropdown(false);
                }}
                className="w-full flex items-center justify-between bg-white border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left transition-all duration-200"
              >
                <span>
                  {selectedColleges.length === 0
                    ? "All Colleges Selected"
                    : `${selectedColleges.length} College(s) Selected`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {showCollegeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-30 mt-2 w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-4 max-h-60 overflow-y-auto"
                  >
                    <div className="flex items-center gap-2 mb-3 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search colleges..."
                        value={collegeSearch}
                        onChange={(e) => setCollegeSearch(e.target.value)}
                        className="bg-transparent border-none text-xs w-full focus:outline-none py-1 text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      {filteredColleges.map((college) => {
                        const isChecked = selectedColleges.includes(college.id);
                        return (
                          <button
                            key={college.id}
                            type="button"
                            onClick={() => toggleCollege(college.id)}
                            className="flex items-center justify-between w-full text-left py-1.5 px-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                          >
                            <span className="truncate pr-2">
                              {college.shortName || college.name}
                            </span>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? "bg-indigo-500 border-indigo-500 text-white"
                                  : "border-slate-200"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-semibold text-white gradient-bg gradient-hover hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              {loading ? "Generating Predictions..." : "Predict Best Colleges"}
            </button>
          </div>
        </form>
      </div>

      {/* Predictions Section */}
      <AnimatePresence>
        {searched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header + Result Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-2xl text-slate-800">
                  Prediction Results
                </h3>
                <p className="text-slate-500 text-sm">
                  Found {displayPredictions.length} matching college options based on your rank
                </p>
              </div>

              {/* College Type Filter Tab */}
              <div className="flex bg-slate-100/80 border border-slate-200/50 p-1 rounded-xl">
                {[
                  { value: "ALL", label: "All" },
                  { value: "Government", label: "Govt Only" },
                  { value: "Self-Finance", label: "Self-Finance" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setCollegeTypeFilter(tab.value)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      collegeTypeFilter === tab.value
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Failed to process predictions</p>
                  <p className="text-xs mt-1 text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Results Grid */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm font-semibold">
                  Analyzing 2025 cutoff distributions...
                </p>
              </div>
            ) : displayPredictions.length === 0 ? (
              <div className="glass-panel border border-slate-200/60 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
                <AlertCircle className="w-12 h-12 text-indigo-400 mx-auto" />
                <h4 className="font-display font-bold text-lg text-slate-800">
                  No College Options Match Your Rank
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Based on the 2025 cutoff data, your rank of{" "}
                  <span className="font-bold text-slate-800">{rankValue}</span> in the{" "}
                  <span className="font-bold text-slate-800">{rankType}</span> group is above the
                  closing cutoffs for the filtered colleges. Consider adjusting your category or selecting
                  different colleges/branches.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayPredictions.map((pred, index) => {
                  const chanceColors = {
                    HIGH: {
                      bg: "bg-emerald-50 border-emerald-100",
                      text: "text-emerald-700",
                      dot: "bg-emerald-500",
                      badge: "bg-emerald-500 text-white shadow-emerald-100",
                    },
                    MODERATE: {
                      bg: "bg-amber-50 border-amber-100",
                      text: "text-amber-700",
                      dot: "bg-amber-500",
                      badge: "bg-amber-500 text-white shadow-amber-100",
                    },
                    LOW: {
                      bg: "bg-rose-50 border-rose-100",
                      text: "text-rose-700",
                      dot: "bg-rose-500",
                      badge: "bg-rose-500 text-white shadow-rose-100",
                    },
                  };

                  const currentColors = chanceColors[pred.chanceLevel as keyof typeof chanceColors];

                  return (
                    <motion.div
                      key={pred.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Chance & Group info */}
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${currentColors.badge}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            {pred.chanceLevel} CHANCE ({pred.chancePercentage}%)
                          </span>

                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {pred.allottedCategory} Seat
                          </span>
                        </div>

                        {/* College name & Branch */}
                        <h4 className="font-display font-bold text-base text-slate-800 line-clamp-2 min-h-12">
                          {pred.institute.shortName}
                        </h4>

                        <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {pred.institute.location} • {pred.institute.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2 bg-slate-50 border border-slate-100/50 p-2.5 rounded-xl">
                          <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700">
                            {pred.branch.fullName}
                          </span>
                        </div>
                      </div>

                      {/* Cutoff Ranks Info */}
                      <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-50">
                        <div className="bg-slate-50/50 rounded-xl p-2 text-center border border-slate-100">
                          <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            Opening Rank
                          </span>
                          <span className="text-sm font-extrabold text-slate-700">
                            {pred.openingRank}
                          </span>
                        </div>
                        <div className="bg-slate-50/50 rounded-xl p-2 text-center border border-slate-100">
                          <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            Closing Rank
                          </span>
                          <span className="text-sm font-extrabold text-slate-700">
                            {pred.closingRank}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
