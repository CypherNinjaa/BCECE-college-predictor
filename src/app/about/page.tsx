import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Info, Landmark, BookOpen, Scale } from "lucide-react";

export default function AboutPage() {
  const reservations = [
    { category: "UR (Unreserved)", percentage: "40%", description: "Open to all candidates based on merit rank." },
    { category: "EBC (Extremely Backward Class)", percentage: "18%", description: "Reserved for candidates belonging to EBC category." },
    { category: "SC (Scheduled Caste)", percentage: "16%", description: "Reserved for candidates belonging to SC category." },
    { category: "BC (Backward Class)", percentage: "12%", description: "Reserved for candidates belonging to BC category." },
    { category: "EWS (Economically Weaker Sections)", percentage: "10%", description: "Reserved for general category candidates with qualifying income criteria." },
    { category: "RCG (Reserved Category Girl)", percentage: "3%", description: "Reserved exclusively for girls across categories." },
    { category: "ST (Scheduled Tribe)", percentage: "1%", description: "Reserved for candidates belonging to ST category." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl pointer-events-none"></div>

      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 space-y-10">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-slate-850 tracking-tight leading-tight">
            Counseling Guidelines & Predictor Info
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto">
            Understand Bihar Combined Entrance counseling guidelines, reservation rules, and how prediction estimates are calculated.
          </p>
        </div>

        {/* Prediction engine block */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-500" />
            How Predictions are Calculated
          </h2>
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            Our prediction algorithm compares your 2026 BCECE entrance rank (PCM/PCB) against historical Round-1 allotment cutoffs (opening and closing ranks) from 2025:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            <div className="border border-emerald-100 bg-emerald-50/50 p-4 rounded-2xl space-y-2">
              <span className="block text-emerald-800 font-bold">🟢 High Chance</span>
              <p className="text-slate-550 leading-relaxed font-medium">
                Your rank is equal to or better (lower) than the opening rank for this seat. You are highly likely to qualify.
              </p>
            </div>
            <div className="border border-amber-100 bg-amber-50/50 p-4 rounded-2xl space-y-2">
              <span className="block text-amber-800 font-bold">🟡 Moderate Chance</span>
              <p className="text-slate-550 leading-relaxed font-medium">
                Your rank falls strictly between the opening and closing ranks of 2025. You have a competitive chance.
              </p>
            </div>
            <div className="border border-rose-100 bg-rose-50/50 p-4 rounded-2xl space-y-2">
              <span className="block text-rose-800 font-bold">🔴 Low Chance</span>
              <p className="text-slate-550 leading-relaxed font-medium">
                Your rank is slightly above the 2025 closing rank (within 10% tolerance). Qualification is marginal.
              </p>
            </div>
          </div>
        </div>

        {/* Reservation Rules Block */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-500" />
            Bihar BCECE Seat Reservation Policy
          </h2>
          <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
            Bihar Combined Entrance Competitive Examination Board (BCECEB) enforces seat reservations across colleges. All categories can also claim open merit seats (UR) if they qualify on general score:
          </p>

          <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100 p-3.5 font-bold text-slate-500 uppercase tracking-wider">
              <span>Category</span>
              <span className="text-center">Seat Percentage</span>
              <span>Details</span>
            </div>
            <div className="divide-y divide-slate-100">
              {reservations.map((res, index) => (
                <div key={index} className="grid grid-cols-3 p-3.5 font-medium text-slate-700">
                  <span className="font-bold text-slate-800">{res.category}</span>
                  <span className="text-center font-extrabold text-indigo-650">{res.percentage}</span>
                  <span className="text-slate-500 text-[11px] leading-relaxed">{res.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Counseling Process Info */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Important Counseling Documents Needed
          </h2>
          <p className="text-slate-655 text-xs leading-relaxed">
            During document verification (DV) of BCECE joint counseling, ensure you have the original copies of:
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5 font-medium">
            <li>BCECE 2026 Admit Card and Rank Card.</li>
            <li>Class 10 and Class 12 Marksheet & Passing Certificates.</li>
            <li>Residential Certificate (Domicile of Bihar is mandatory for reservation benefits).</li>
            <li>Caste Certificate (issued by competent authority) for reserved categories.</li>
            <li>EWS/Income Certificate (if claiming EWS seat).</li>
            <li>Medical Fitness Certificate.</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
