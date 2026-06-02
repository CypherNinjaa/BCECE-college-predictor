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
import PredictionAnimation from "./PredictionAnimation";

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
  round: number;
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
  const [category, setCategory] = useState<"UR" | "BC" | "EBC" | "SC" | "ST" | "EWS">("UR");
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
  const [showAnimation, setShowAnimation] = useState(false);
  const [apiDataReady, setApiDataReady] = useState(false);
  const [waitingForApi, setWaitingForApi] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [resultsRoundTab, setResultsRoundTab] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync state if video ended but API call was still running
  useEffect(() => {
    if (apiDataReady && waitingForApi) {
      setShowAnimation(false);
      setSearched(true);
      setWaitingForApi(false);
    }
  }, [apiDataReady, waitingForApi]);

  const handleAnimationComplete = useCallback(() => {
    if (apiDataReady) {
      setShowAnimation(false);
      setSearched(true);
    } else {
      setWaitingForApi(true);
    }
  }, [apiDataReady]);

  // Scroll to Top visibility logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // CSV download function with promotional links
  const downloadCSV = () => {
    const activePredictions = predictions.filter((p) => {
      if (category !== "UR" && p.allottedCategory !== category) return false;
      if (collegeTypeFilter !== "ALL" && p.institute.type !== collegeTypeFilter) return false;
      if (p.round !== resultsRoundTab) return false;
      return true;
    });

    if (activePredictions.length === 0) return;

    const headers = [
      "S.No.",
      "Institute Name",
      "Location",
      "Type",
      "Course/Branch",
      "Allotted Seat Category",
      "Opening Rank",
      "Closing Rank"
    ];

    const rows = activePredictions.map((pred, index) => [
      index + 1,
      pred.institute.shortName,
      pred.institute.location,
      pred.institute.type,
      pred.branch.fullName,
      pred.allottedCategory,
      pred.openingRank,
      pred.closingRank
    ]);

    const csvRows = [
      `"STUDY WITH RITESH — BCECE Allotment Predictor 2026 Report"`,
      `"Official Prep Website:","https://studywithritesh.in/"`,
      `"YouTube Channel:","https://www.youtube.com/@studywithritesh8678"`,
      `"Telegram Group:","https://t.me/Studywithritesh"`,
      `"Instagram Profile:","https://www.instagram.com/study_with_ritesh/"`,
      `""`,
      `"Academic Group:","${subGroup}"`,
      `"Social Category:","${category}"`,
      `"Entered Rank Value:","${rankValue}"`,
      `""`,
      headers.join(","),
      ...rows.map(row => 
        row.map(value => {
          const stringVal = String(value).replace(/"/g, '""');
          return `"${stringVal}"`;
        }).join(",")
      )
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SWR_BCECE_Predictions_${subGroup}_Rank_${rankValue}_${category}_Round_${resultsRoundTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF report print/download function with promotional branding links
  const downloadPDF = () => {
    const activePredictions = predictions.filter((p) => {
      if (category !== "UR" && p.allottedCategory !== category) return false;
      if (collegeTypeFilter !== "ALL" && p.institute.type !== collegeTypeFilter) return false;
      if (p.round !== resultsRoundTab) return false;
      return true;
    });

    if (activePredictions.length === 0) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const dateStr = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>BCECE Allotment Report - Study With Ritesh</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              padding: 40px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #6366f1;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title-section h1 {
              margin: 0;
              font-size: 22px;
              color: #1e1b4b;
              font-weight: 800;
            }
            .title-section p {
              margin: 4px 0 0 0;
              font-size: 12px;
              color: #4f46e5;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .meta-info {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 30px;
              font-size: 13px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .meta-item strong {
              color: #475569;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 35px;
              font-size: 12px;
            }
            th {
              background: #4f46e5;
              color: white;
              text-align: left;
              padding: 10px 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.02em;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              font-weight: 700;
              font-size: 10px;
              text-transform: uppercase;
              border-radius: 12px;
            }
            .badge-govt {
              background: #ecfdf5;
              color: #065f46;
              border: 1px solid #a7f3d0;
            }
            .badge-sf {
              background: #fffbeb;
              color: #92400e;
              border: 1px solid #fde68a;
            }
            .promo-box {
              background: #eef2ff;
              border: 1px solid #c7d2fe;
              border-radius: 16px;
              padding: 20px;
              margin-top: 40px;
              page-break-inside: avoid;
            }
            .promo-box h3 {
              margin: 0 0 10px 0;
              font-size: 15px;
              color: #3730a3;
              font-weight: 800;
            }
            .promo-links {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 15px;
            }
            .promo-link-item {
              font-size: 12px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .promo-link-item a {
              color: #4f46e5;
              text-decoration: none;
              font-weight: 700;
            }
            .promo-link-item a:hover {
              text-decoration: underline;
            }
            .disclaimer {
              font-size: 10px;
              color: #64748b;
              text-align: center;
              margin-top: 30px;
              line-height: 1.4;
            }
            @media print {
              body {
                padding: 0;
              }
              .promo-box {
                border: 1px solid #c7d2fe !important;
                background-color: #eef2ff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-section">
              <h1>Study With Ritesh</h1>
              <p>BCECE Allotment Predictor Allotments</p>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              Report ID: SWR-${Math.floor(100000 + Math.random() * 900000)}<br/>
              Generated: ${dateStr}
            </div>
          </div>

          <div class="meta-info">
            <div class="meta-item"><strong>Academic Group:</strong> ${subGroup} (${rankType})</div>
            <div class="meta-item"><strong>Entered Rank:</strong> ${rankValue}</div>
            <div class="meta-item"><strong>Social Category:</strong> ${category} (${category === "UR" ? "Unreserved" : "Reserved"})</div>
            <div class="meta-item"><strong>Round:</strong> Round ${resultsRoundTab}</div>
            <div class="meta-item"><strong>Matching Options:</strong> ${activePredictions.length} colleges found</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">S.No.</th>
                <th style="width: 45%">Institute</th>
                <th style="width: 25%">Course / Branch</th>
                <th style="width: 13%">Type</th>
                <th style="width: 12%; text-align: right;">Cutoff Ranks</th>
              </tr>
            </thead>
            <tbody>
              ${activePredictions.map((pred, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    <strong style="color: #0f172a;">${pred.institute.shortName}</strong><br/>
                    <span style="color: #64748b; font-size: 10px;">${pred.institute.location}</span>
                  </td>
                  <td><span style="font-weight: 600; color: #334155;">${pred.branch.fullName}</span></td>
                  <td>
                    <span class="badge ${pred.institute.type === "Government" ? "badge-govt" : "badge-sf"}">
                      ${pred.institute.type}
                    </span>
                  </td>
                  <td style="text-align: right; font-family: monospace; font-size: 11px; font-weight: bold;">
                    ${pred.openingRank} - ${pred.closingRank}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="promo-box">
            <h3>🚀 Prepare for BCECE with Study With Ritesh!</h3>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #475569; font-weight: 500;">
              Get official notifications, free prep materials, and expert guidance directly from Ritesh Sir.
            </p>
            <div class="promo-links">
              <div class="promo-link-item">
                🌐 <strong>Website:</strong>&nbsp;<a href="https://studywithritesh.in/" target="_blank">studywithritesh.in</a>
              </div>
              <div class="promo-link-item">
                📺 <strong>YouTube:</strong>&nbsp;<a href="https://www.youtube.com/@studywithritesh8678" target="_blank">Study With Ritesh</a>
              </div>
              <div class="promo-link-item">
                📢 <strong>Telegram:</strong>&nbsp;<a href="https://t.me/Studywithritesh" target="_blank">t.me/Studywithritesh</a>
              </div>
              <div class="promo-link-item">
                📸 <strong>Instagram:</strong>&nbsp;<a href="https://www.instagram.com/study_with_ritesh/" target="_blank">@study_with_ritesh</a>
              </div>
            </div>
          </div>

          <div class="disclaimer">
            <strong>Disclaimer:</strong> Predictions are based on official BCECE 2025 Round 1 allotment cutoff data. Actual 2026 counseling outcomes may vary depending on guidelines, candidate preferences, and policies of the BCECE Board.
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

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

  // Reset pagination page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [resultsRoundTab, collegeTypeFilter]);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rankValue || isNaN(Number(rankValue)) || Number(rankValue) <= 0) {
      setError("Please enter a valid rank greater than 0");
      return;
    }

    setError(null);
    setLoading(true);
    setSearched(false);
    setAiResult(null);
    setShowAnimation(true);
    setCurrentPage(1); // Reset page on new search
    setApiDataReady(false);
    setWaitingForApi(false);
    setActiveTab("MATCHES");

    // Scroll to results container immediately so the animation card is visible
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);

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

        // Auto-select round with predictions
        const r1Count = fetchedPredictions.filter((p: any) => {
          if (category !== "UR" && p.allottedCategory !== category) return false;
          if (collegeTypeFilter !== "ALL" && p.institute.type !== collegeTypeFilter) return false;
          return p.round === 1;
        }).length;
        const r2Count = fetchedPredictions.filter((p: any) => {
          if (category !== "UR" && p.allottedCategory !== category) return false;
          if (collegeTypeFilter !== "ALL" && p.institute.type !== collegeTypeFilter) return false;
          return p.round === 2;
        }).length;

        if (r1Count === 0 && r2Count > 0) {
          setResultsRoundTab(2);
        } else {
          setResultsRoundTab(1);
        }

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

        setApiDataReady(true);

      } else {
        setError(resData.error || "Failed to fetch predictions");
        setShowAnimation(false);
        setSearched(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setShowAnimation(false);
      setSearched(true);
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

  // Filtered Predictions for currently active Round Tab
  const activeRoundPredictions = displayPredictions.filter((p) => p.round === resultsRoundTab);

  // Paginated Predictions
  const paginatedPredictions = activeRoundPredictions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-100/80 p-1 rounded-xl">
                {(["UR", "BC", "EBC", "SC", "ST", "EWS"] as const).map((cat) => (
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
      <div ref={resultsRef} className="scroll-mt-6 min-h-[200px]">
        <AnimatePresence mode="wait">
          {showAnimation && (
            <PredictionAnimation
              showAnimation={showAnimation}
              onAnimationComplete={handleAnimationComplete}
              apiDataReady={apiDataReady}
            />
          )}

          {searched && !showAnimation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
            {/* Header + Result Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-bold text-2xl text-slate-800">
                  {activeTab === "MATCHES" ? "Prediction Allotments" : "Study With Ritesh AI Guide"}
                </h3>
                <p className="text-slate-500 text-sm">
                  {activeTab === "MATCHES"
                    ? `Found ${activeRoundPredictions.length} options in Round ${resultsRoundTab} (Total: ${displayPredictions.length} options across all rounds)`
                    : "Personalized choice-filling priorities and expert counseling tips"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {activeTab === "MATCHES" && displayPredictions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadPDF}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-100 text-red-700 hover:bg-red-100 hover:text-red-800 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Download prediction results as PDF"
                    >
                      <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      Download PDF
                    </button>

                    <button
                      onClick={downloadCSV}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Download prediction results as Excel/CSV"
                    >
                      <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download CSV
                    </button>
                  </div>
                )}

                {/* Round Filter Tabs */}
                {activeTab === "MATCHES" && (
                  <div className="flex bg-slate-100/80 border border-slate-200/50 p-1 rounded-xl shadow-inner animate-fade-in">
                    {[
                      { value: 1, label: `Round 1 (${displayPredictions.filter(p => p.round === 1).length})` },
                      { value: 2, label: `Round 2 (${displayPredictions.filter(p => p.round === 2).length})` },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setResultsRoundTab(tab.value)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                          resultsRoundTab === tab.value
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* College Type Filter Tab (Matches Only) */}
                {activeTab === "MATCHES" && (
                  <div className="flex bg-slate-100/80 border border-slate-200/50 p-1 rounded-xl shadow-inner">
                    {[
                      { value: "ALL", label: "All" },
                      { value: "Government", label: "Govt Only" },
                      { value: "Self-Finance", label: "Self-Finance" },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setCollegeTypeFilter(tab.value)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
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
                ) : activeRoundPredictions.length === 0 ? (
                  <div className="glass-panel border border-slate-200/60 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
                    <AlertCircle className="w-12 h-12 text-indigo-400 mx-auto" />
                    <h4 className="font-display font-bold text-lg text-slate-800">
                      No Matches in Round {resultsRoundTab}
                    </h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      We didn't find any eligible options for your rank in Round {resultsRoundTab}. However, you
                      have matching options in the other round! Click the{" "}
                      <span className="font-bold text-indigo-600">Round {resultsRoundTab === 1 ? 2 : 1}</span> tab above
                      to view them.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {paginatedPredictions.map((pred, index) => {
                        return (
                          <motion.div
                            key={pred.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.05, 0.5) }}
                            className="relative overflow-hidden bg-white border border-slate-200/50 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 hover:border-indigo-200/80 transition-all duration-300 flex flex-col justify-between group"
                          >
                            {/* Top interactive gradient accent line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                            <div>
                              <div className="flex items-center justify-between mb-3">
                                {/* College Type Badge */}
                                <div className="flex items-center gap-1.5">
                                  {pred.institute.type === "Government" ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Government
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Self-Finance
                                    </span>
                                  )}
                                  <span className="text-[9px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200/30 px-2 py-0.5 rounded-full uppercase">
                                    Round {pred.round}
                                  </span>
                                </div>

                                {/* Category Seat Badge */}
                                <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50/80 border border-indigo-100/80 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                  {pred.allottedCategory} Seat
                                </span>
                              </div>

                              {/* College Title */}
                              <h4 className="font-display font-extrabold text-sm sm:text-base text-slate-800 line-clamp-2 min-h-10 leading-snug group-hover:text-indigo-600 transition-colors duration-300">
                                {pred.institute.shortName}
                              </h4>

                              {/* Location */}
                              <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-400">
                                <span>{pred.institute.location}</span>
                              </div>

                              {/* Branch Section */}
                              <div className="flex items-center gap-2 mt-3 bg-slate-50 border border-slate-100/80 px-3 py-2 rounded-xl">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-700 truncate">
                                  {pred.branch.fullName}
                                </span>
                              </div>
                            </div>

                            {/* Ranks Visual Widgets */}
                            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100/60">
                              <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-[8px] text-slate-400 uppercase tracking-wider font-extrabold">Open</span>
                                <span className="text-xs font-black text-slate-700">{pred.openingRank}</span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/20 rounded-xl border border-indigo-100/20 shadow-sm">
                                <span className="text-[8px] text-indigo-500 uppercase tracking-wider font-extrabold">Close</span>
                                <span className="text-xs font-black text-indigo-600">{pred.closingRank}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {activeRoundPredictions.length > itemsPerPage && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/40 mt-8 animate-fade-in">
                        <div className="text-xs font-extrabold text-slate-400">
                          Showing <span className="text-slate-700">{Math.min(activeRoundPredictions.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{" "}
                          <span className="text-slate-700">{Math.min(activeRoundPredictions.length, currentPage * itemsPerPage)}</span> of{" "}
                          <span className="text-slate-700">{activeRoundPredictions.length}</span> matching colleges
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100/60 border border-slate-200/50 p-1 rounded-xl shadow-inner shrink-0 select-none">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => {
                              setCurrentPage((prev) => Math.max(1, prev - 1));
                              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                          </button>

                          {Array.from({ length: Math.ceil(activeRoundPredictions.length / itemsPerPage) }).map((_, idx) => {
                            const pageNum = idx + 1;
                            const totalPages = Math.ceil(activeRoundPredictions.length / itemsPerPage);

                            if (totalPages > 6 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                              if (pageNum === 2 && currentPage > 3) {
                                return <span key="ellipsis-start" className="px-2 text-slate-400 text-xs font-extrabold">...</span>;
                              }
                              if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                                return <span key="ellipsis-end" className="px-2 text-slate-400 text-xs font-extrabold">...</span>;
                              }
                              return null;
                            }

                            return (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => {
                                  setCurrentPage(pageNum);
                                  resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                  currentPage === pageNum
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            disabled={currentPage === Math.ceil(activeRoundPredictions.length / itemsPerPage)}
                            onClick={() => {
                              setCurrentPage((prev) => Math.min(Math.ceil(activeRoundPredictions.length / itemsPerPage), prev + 1));
                              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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

      {/* Scroll to Top Arrow */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 md:bottom-8 right-6 z-50 p-3.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all duration-200 group border border-indigo-500/20 cursor-pointer"
          aria-label="Scroll to Top"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  </div>
  );
}
