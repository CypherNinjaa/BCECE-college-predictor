"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Filter,
  Check,
  ChevronDown,
  Sparkles,
  BookOpen,
  Building2,
  AlertCircle,
  ShieldAlert,
  Info,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "./MarkdownRenderer";

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

interface AiRateLimitInfo {
  allowed?: boolean;
  remaining?: number;
  resetAt?: number;
  rateLimit?: {
    limit?: number;
    remaining?: number;
    resetAt?: number;
  };
  error?: string;
  rateLimited?: boolean;
}

function formatRateLimitWait(resetAt: number | null) {
  if (!resetAt) return "about 1 minute";

  const seconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function PredictorContainer({ colleges, branches }: PredictorContainerProps) {
  // Form State
  const [subGroup, setSubGroup] = useState<"PCM" | "PCB" | "PCMB">("PCMB");
  const [category, setCategory] = useState<"UR" | "BC" | "EBC" | "SC" | "ST">("UR");
  const [rankValue, setRankValue] = useState<string>("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);

  // Auto-derive rankType from subGroup
  const rankType: "PCM" | "PCB" = subGroup === "PCB" ? "PCB" : "PCM";
  // Default rankSubCategory — category-specific rank type
  const rankSubCategory: "UR" | "CAT" = category === "UR" ? "UR" : "CAT";

  // UI Dropdown States
  const [branchSearch, setBranchSearch] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  // Refs for click-outside dropdown close
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const collegeDropdownRef = useRef<HTMLDivElement>(null);

  // Predictions State
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SWR AI Mode States
  const [aiMode, setAiMode] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    profileAnalysis: string;
    choiceFillingList: { priority: number; institute: string; branch: string; reason: string }[];
    counselingTips: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"MATCHES" | "AI_COUNSELOR">("MATCHES");
  const [aiRateLimited, setAiRateLimited] = useState<boolean>(false);
  const [aiRateLimitMsg, setAiRateLimitMsg] = useState<string>("");
  const [aiRateLimitResetAt, setAiRateLimitResetAt] = useState<number | null>(null);
  const [aiRemainingRequests, setAiRemainingRequests] = useState<number | null>(null);

  const setAiLimitBlocked = useCallback((resetAt: number | null, message?: string) => {
    setAiRateLimited(true);
    setAiMode(false);
    setAiRateLimitResetAt(resetAt);
    setAiRemainingRequests(0);
    setAiRateLimitMsg(
      message || `AI advisor limit reached. Please wait ${formatRateLimitWait(resetAt)} and try again.`
    );
  }, []);

  const clearAiLimitBlocked = useCallback((remaining?: number | null) => {
    setAiRateLimited(false);
    setAiRateLimitMsg("");
    setAiRateLimitResetAt(null);
    setAiRemainingRequests(typeof remaining === "number" ? remaining : null);
  }, []);

  const applyAiRateLimitStatus = useCallback((data: AiRateLimitInfo) => {
    const rateLimitInfo = data.rateLimit || data;
    const remaining = typeof rateLimitInfo.remaining === "number" ? rateLimitInfo.remaining : null;
    const resetAt = typeof rateLimitInfo.resetAt === "number" ? rateLimitInfo.resetAt : null;
    const isBlocked = data.rateLimited || data.allowed === false || remaining === 0;

    if (isBlocked) {
      if (resetAt && resetAt <= Date.now()) {
        clearAiLimitBlocked(remaining);
        return;
      }

      setAiLimitBlocked(resetAt, data.error);
      return;
    }

    clearAiLimitBlocked(remaining);
  }, [clearAiLimitBlocked, setAiLimitBlocked]);

  // Check AI rate limit status without consuming the AI request quota.
  const checkAiRateLimit = useCallback(async () => {
    try {
      const res = await fetch("/api/predict/ai");
      const data = await res.json();
      applyAiRateLimitStatus(data);
    } catch {
      // Non-critical. The backend still enforces the quota on POST.
    }
  }, [applyAiRateLimitStatus]);

  useEffect(() => {
    const timeout = window.setTimeout(checkAiRateLimit, 0);
    return () => window.clearTimeout(timeout);
  }, [checkAiRateLimit]);

  useEffect(() => {
    if (!aiRateLimitResetAt) return;

    const delay = Math.max(1000, aiRateLimitResetAt - Date.now() + 500);
    const timeout = window.setTimeout(() => {
      clearAiLimitBlocked();
      checkAiRateLimit();
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [aiRateLimitResetAt, checkAiRateLimit, clearAiLimitBlocked]);

  // Click-outside handler for dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setShowBranchDropdown(false);
      }
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(e.target as Node)) {
        setShowCollegeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setAiResult(null);
    setActiveTab("MATCHES");

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
        const fetchedPredictions = resData.data.predictions;
        setPredictions(fetchedPredictions);

        const aiCooldownActive = aiRateLimitResetAt !== null && aiRateLimitResetAt > Date.now();

        if (aiMode && (aiRateLimited || aiCooldownActive)) {
          setAiLimitBlocked(aiRateLimitResetAt);
        }

        if (aiMode && !aiRateLimited && !aiCooldownActive) {
          setAiLoading(true);
          setActiveTab("AI_COUNSELOR");
          try {
            const aiResponse = await fetch("/api/predict/ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subGroup,
                category,
                rankType,
                rankSubCategory,
                rankValue: Number(rankValue),
                predictions: fetchedPredictions,
              }),
            });
            const aiResData = await aiResponse.json();

            if (aiResponse.status === 429 || aiResData.rateLimited) {
              applyAiRateLimitStatus(aiResData);
              setActiveTab("MATCHES");
            } else if (aiResData.success) {
              setAiResult(aiResData.data);
              applyAiRateLimitStatus(aiResData);
            } else {
              setError(aiResData.error || "Failed to generate AI advice");
            }
          } catch (aiErr) {
            console.error("AI Predict API error:", aiErr);
            setError("Unable to connect to AI advisor server.");
          } finally {
            setAiLoading(false);
          }
        }
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

  // Filtered Predictions — show only the user's selected category seats
  const displayPredictions = predictions.filter((p) => {
    // Only show seats matching the user's selected social category
    if (category !== "UR" && p.allottedCategory !== category) return false;
    if (collegeTypeFilter !== "ALL" && p.institute.type !== collegeTypeFilter) return false;
    return true;
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

          {/* Rank Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Enter Your {subGroup === "PCMB" ? "PCM/PCB" : rankType} {category === "UR" ? "UR" : category} Rank Value
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
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                Using <span className="font-bold text-slate-600">{subGroup === "PCMB" ? "PCM/PCB" : rankType} {category === "UR" ? "UR" : category}</span> Rank based on your academic group selection
              </p>
            </div>
          </div>

          {/* Preferred Branches & Colleges (Optional Filters) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Preferred Branches */}
            <div className="relative" ref={branchDropdownRef}>
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
            <div className="relative" ref={collegeDropdownRef}>
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

          {/* AI Mode Toggle */}
          <div className="pt-4 border-t border-slate-100">
            <div
              onClick={() => {
                if (aiRateLimited) {
                  checkAiRateLimit();
                  return;
                }

                setAiMode(!aiMode);
              }}
              className={`flex items-center justify-between p-4 rounded-2xl border select-none transition-all duration-300 ${
                aiRateLimited
                  ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                  : aiMode
                    ? "bg-indigo-50/50 border-indigo-200/80 shadow-md shadow-indigo-50/20 cursor-pointer"
                    : "bg-white border-slate-100 hover:border-slate-200 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  aiRateLimited
                    ? "bg-slate-200 text-slate-400"
                    : aiMode ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-500"
                }`}>
                  {aiRateLimited ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <Sparkles className={`w-5 h-5 ${aiMode ? "animate-pulse" : ""}`} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    {aiRateLimited ? "AI Advisor Temporarily Unavailable" : "Enable AI Advisor Mode"}
                    {!aiRateLimited && (
                      <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                        AI
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-0.5">
                    {aiRateLimited
                      ? aiRateLimitMsg
                      : aiRemainingRequests !== null
                        ? `Get AI-powered strategic guidance. ${aiRemainingRequests} AI request${aiRemainingRequests === 1 ? "" : "s"} left this minute.`
                        : "Get AI-powered strategic choice-filling priorities and counseling guidance based on your rank."
                    }
                  </p>
                </div>
              </div>
              
              <div className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 relative flex items-center shrink-0 ${
                aiRateLimited ? "bg-slate-300" : aiMode ? "bg-indigo-600" : "bg-slate-200"
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  aiMode && !aiRateLimited ? "translate-x-6" : "translate-x-0"
                }`} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || aiLoading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-semibold text-white gradient-bg gradient-hover hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              {loading || aiLoading ? "Generating Predictions..." : "Predict Best Colleges"}
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
                  {activeTab === "MATCHES" ? "Prediction Allotments" : "Study With Ritesh AI Guide"}
                </h3>
                <p className="text-slate-500 text-sm">
                  {activeTab === "MATCHES"
                    ? `Found ${displayPredictions.length} matching college options based on your rank`
                    : "Personalized choice-filling priorities and expert counseling tips"}
                </p>
              </div>

              {/* College Type Filter Tab (Matches Only) */}
              {activeTab === "MATCHES" && (
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
              )}
            </div>

            {/* Main Tabs Selection (AI Mode Only) */}
            {(aiResult || aiLoading || aiMode) && (
              <div className="flex border-b border-slate-200/60 pb-1 gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("MATCHES")}
                  className={`pb-3 text-sm font-extrabold transition-all relative flex items-center gap-1.5 ${
                    activeTab === "MATCHES"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  College Matches ({displayPredictions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("AI_COUNSELOR")}
                  className={`pb-3 text-sm font-extrabold transition-all relative flex items-center gap-1.5 ${
                    activeTab === "AI_COUNSELOR"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Counselor
                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md">AI</span>
                </button>
              </div>
            )}

            {/* Global API Error */}
            {error && activeTab === "MATCHES" && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Failed to process predictions</p>
                  <p className="text-xs mt-1 text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Tab 1: College Match List */}
            {activeTab === "MATCHES" && (
              <>
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
                      return (
                        <motion.div
                          key={pred.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.05, 0.5) }}
                          className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-end mb-4">
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                {pred.allottedCategory} Seat
                              </span>
                            </div>

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
              </>
            )}

            {/* Tab 2: AI Counselor Advice */}
            {activeTab === "AI_COUNSELOR" && (
              <div className="space-y-6">
                {/* AI Disclaimer Warning */}
                <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-3.5 flex items-start gap-3">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    <strong>Disclaimer:</strong> AI-generated guidance is based on historical data and may not reflect actual counseling outcomes. Always verify with official BCECE notifications before making final decisions.
                  </p>
                </div>

                {aiLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center space-y-1">
                      <p className="text-slate-700 text-sm font-bold animate-pulse">
                        Analyzing cutoff data and historical allotments...
                      </p>
                      <p className="text-slate-400 text-xs font-semibold">
                        AI is cross-verifying your profile. This may take a few seconds.
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 max-w-xl mx-auto space-y-2">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                    <p className="text-sm font-bold">Failed to load AI advisor response</p>
                    <p className="text-xs text-red-600">{error}</p>
                    <button
                      type="button"
                      onClick={handlePredict}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Retry Request
                    </button>
                  </div>
                ) : !aiResult ? (
                  <div className="py-10 text-center text-slate-500 text-sm">
                    No AI counseling advice generated. Please try submitting again.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Analysis Block — Full Width with Markdown */}
                    <div className="glass-panel border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
                      <h4 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        AI Counseling Assessment
                      </h4>
                      <MarkdownRenderer content={aiResult.profileAnalysis} />
                    </div>

                    {/* Choice Sheet Block */}
                    <div className="glass-panel border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
                      <h4 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        Recommended Choice-Filling Order
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold mb-4 leading-relaxed">
                        AI-prioritized choice filling order. Use this sequence as a reference when filling choices on the BCECE counseling portal.
                      </p>

                      <div className="space-y-3">
                        {(aiResult.choiceFillingList || []).map((item) => (
                          <div
                            key={item.priority}
                            className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-display font-extrabold text-sm shrink-0 shadow-md shadow-indigo-100">
                              {item.priority}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h5 className="text-sm font-extrabold text-slate-800">
                                {item.institute}
                              </h5>
                              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                {item.branch}
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed font-semibold pt-0.5">
                                {item.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Counseling Guidelines — Inline */}
                    {aiResult.counselingTips && aiResult.counselingTips.length > 0 && (
                      <div className="glass-panel border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
                        <h4 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <Info className="w-5 h-5 text-indigo-600" />
                          Important Counseling Guidelines
                        </h4>
                        <ul className="space-y-3">
                          {aiResult.counselingTips.map((tip, idx) => (
                            <li key={idx} className="flex gap-3 items-start text-sm text-slate-600">
                              <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[11px] font-extrabold text-indigo-700 shrink-0">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed font-medium">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
