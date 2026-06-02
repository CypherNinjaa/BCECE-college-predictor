"use client";

import { useEffect, useRef, useState } from "react";

interface PredictionAnimationProps {
  showAnimation: boolean;
  onAnimationComplete: () => void;
}

export default function PredictionAnimation({
  showAnimation,
  onAnimationComplete,
}: PredictionAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    if (showAnimation && videoRef.current && isVideoLoaded) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
    }
  }, [showAnimation, isVideoLoaded]);

  const handleVideoEnded = () => {
    // Add a small delay before completing animation for better UX
    setTimeout(() => {
      onAnimationComplete();
    }, 500);
  };

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
  };

  if (!showAnimation) return null;

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 border border-slate-100 max-w-2xl mx-auto my-8">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 text-center">
        <h3 className="text-2xl font-display font-bold text-white flex items-center justify-center space-x-3">
          <svg
            className="w-8 h-8 animate-pulse text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Analyzing Your Data</span>
        </h3>
        <p className="text-indigo-100 mt-2 text-sm font-medium">
          Our system is processing your rank against BCECE round 1 cutoffs...
        </p>
      </div>

      <div className="p-8 space-y-6">
        <div className="relative flex justify-center">
          <video
            ref={videoRef}
            onEnded={handleVideoEnded}
            onLoadedData={handleVideoLoaded}
            className="max-w-md w-full h-auto object-contain rounded-2xl shadow-lg bg-gradient-to-br from-indigo-50 to-slate-50"
            muted
            playsInline
          >
            <source src="/assets/animation.mp4" type="video/mp4" />
            {/* Fallback content */}
            <div className="max-w-md w-full h-64 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="animate-spin w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                  <div className="absolute inset-0 animate-ping w-16 h-16 border-4 border-indigo-300 border-t-transparent rounded-full mx-auto opacity-30"></div>
                </div>
                <p className="text-slate-800 font-semibold text-lg">
                  Processing your prediction...
                </p>
              </div>
            </div>
          </video>

          {/* Loading overlay if video isn't loaded */}
          {!isVideoLoaded && (
            <div className="absolute inset-0 flex justify-center">
              <div className="max-w-md w-full h-64 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="animate-spin w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                    <div className="absolute inset-0 animate-ping w-16 h-16 border-4 border-indigo-300 border-t-transparent rounded-full mx-auto opacity-30"></div>
                  </div>
                  <p className="text-slate-800 font-semibold text-lg">
                    Loading animation...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center space-x-3 text-base text-indigo-700 bg-indigo-50/60 rounded-xl p-4 border border-indigo-100/50">
            <svg
              className="w-5 h-5 animate-pulse text-indigo-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">Powered by Study With Ritesh AI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-emerald-800">Calculating probabilities</span>
              </div>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-indigo-800">Matching colleges</span>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-purple-800">Preparing results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
