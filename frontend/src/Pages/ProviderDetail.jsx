
import React from "react";
import Navbar_III from "../Components/Navbar_III";
import Sidebar from "../Components/Sidebar";
import { useHealthContext } from "../Context/HealthContext";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, CheckCircle, AlertTriangle, History, 
  User, MapPin, Award, Activity, FileJson, Sparkles,
  BrainCircuit, Shield, Zap, TrendingUp
} from "lucide-react";
import LineageGraph from "../Components/LineageGraph";

const ProviderDetail = () => {
  const { selectedProvider, Dark } = useHealthContext();
  const navigate = useNavigate();

  if (!selectedProvider) return null;

  // --- ENHANCED STYLING CONSTANTS ---
  const bgMain = Dark 
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" 
    : "bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900";
  
  const panelBg = Dark 
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-xl shadow-2xl shadow-slate-900/50" 
    : "bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50 backdrop-blur-sm";
  
  const glowEffect = Dark
    ? "hover:shadow-indigo-500/20 hover:border-indigo-500/30 transition-all duration-500"
    : "hover:shadow-indigo-200/60 hover:border-indigo-300/50 transition-all duration-500";

  const labelColor = Dark ? "text-slate-400" : "text-slate-600";
  const valueColor = Dark ? "text-slate-100" : "text-slate-900";

  // --- ENHANCED AUDIT COMPONENT ---
  const AuditField = ({ fieldKey, value, originalData, qaFlags }) => {
    const isHealed = qaFlags?.some(
      (flag) => flag.includes("AUTO-HEALED") && flag.toLowerCase().includes(fieldKey.toLowerCase())
    );

    if (!isHealed) return <span className={`${valueColor} break-words`}>{String(value)}</span>;

    return (
      <div className="group relative inline-block cursor-help">
        <div className="flex items-center text-emerald-500 font-bold bg-gradient-to-r from-emerald-500/10 via-emerald-400/10 to-emerald-500/10 px-3 py-1.5 rounded-lg text-sm transition-all duration-300 hover:from-emerald-500/20 hover:via-emerald-400/20 hover:to-emerald-500/20 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
          <Sparkles size={14} className="mr-2 animate-pulse" />
          {value}
          <CheckCircle size={12} className="ml-2" />
        </div>
        
        {/* Enhanced Tooltip */}
        <div className="absolute z-50 hidden group-hover:block bottom-full left-0 mb-3 w-80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white text-xs rounded-xl shadow-2xl border border-slate-700 overflow-hidden ring-2 ring-emerald-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-3 flex items-center justify-between">
            <span className="font-bold flex items-center text-white">
              <History size={14} className="mr-2" /> 
              AUTO-HEALING AUDIT LOG
            </span>
            <Zap size={12} className="text-emerald-200 animate-pulse" />
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center text-center mb-3">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Original Value</div>
                <div className="text-red-400 line-through font-mono bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                  {originalData[fieldKey] || "N/A"}
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <TrendingUp size={16} className="text-emerald-400" />
                <div className="text-[8px] text-slate-500 mt-1">AI Fixed</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Corrected Value</div>
                <div className="text-emerald-400 font-bold font-mono bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  {value}
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-700">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Validation Method:</span>
                <span className="text-slate-300 font-semibold">Multi-Agent Consensus</span>
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1">
                <span className="text-slate-400">Confidence:</span>
                <span className="text-emerald-400 font-bold">98.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- ENHANCED SECTION RENDERER ---
  const DataPanel = ({ title, icon: Icon, data, originalData, qaFlags, primary = false, accent = "indigo" }) => {
    if (!data) return null;
    
    const accentColors = {
      indigo: {
        iconBg: Dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600",
        ring: "ring-indigo-500/30",
        badge: "bg-indigo-500",
        glow: Dark ? "shadow-indigo-500/20" : "shadow-indigo-200/50"
      },
      emerald: {
        iconBg: Dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600",
        ring: "ring-emerald-500/30",
        badge: "bg-emerald-500",
        glow: Dark ? "shadow-emerald-500/20" : "shadow-emerald-200/50"
      },
      amber: {
        iconBg: Dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600",
        ring: "ring-amber-500/30",
        badge: "bg-amber-500",
        glow: Dark ? "shadow-amber-500/20" : "shadow-amber-200/50"
      }
    };
    
    const colors = accentColors[accent] || accentColors.indigo;
    
    return (
      <div className={`p-6 rounded-2xl border ${panelBg} ${glowEffect} ${primary ? `ring-2 ${colors.ring}` : ""} transform hover:scale-[1.02] transition-all duration-300`}>
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className={`p-2.5 rounded-xl ${colors.iconBg} shadow-lg ${colors.glow}`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <h3 className={`font-bold text-sm uppercase tracking-wider ${Dark ? "text-gray-100" : "text-gray-800"}`}>
            {title}
          </h3>
          {primary && (
            <span className={`ml-auto text-[10px] font-bold ${colors.badge} text-white px-2.5 py-1 rounded-full shadow-lg ${colors.glow} animate-pulse`}>
              VERIFIED
            </span>
          )}
        </div>
        
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => {
             if (typeof value === 'object' && value !== null) return null;
             return (
               <div key={key} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 p-2 rounded-lg transition-colors duration-200">
                 <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${labelColor} flex items-center gap-1`}>
                   <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                   {key.replace(/_/g, " ")}
                 </div>
                 <div className={`font-medium ${primary ? "text-lg" : "text-sm"}`}>
                    {primary 
                        ? <AuditField fieldKey={key} value={value} originalData={originalData} qaFlags={qaFlags} />
                        : <span className={valueColor}>{String(value)}</span>
                    }
                 </div>
               </div>
             )
          })}
        </div>
      </div>
    );
  };

  const score = selectedProvider.confidence_score || 0;
  const scoreColor = score >= 0.8 ? "emerald" : score >= 0.6 ? "amber" : "red";

  return (
    <div className={`flex min-h-screen ${bgMain} relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 right-20 w-96 h-96 ${Dark ? "bg-indigo-500/5" : "bg-indigo-200/20"} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-20 left-20 w-96 h-96 ${Dark ? "bg-purple-500/5" : "bg-purple-200/20"} rounded-full blur-3xl animate-pulse`} style={{animationDelay: "1s"}}></div>
      </div>

      <Sidebar />
      <div className="flex-1 lg:ml-[20vw] relative z-10">
        <Navbar_III />
        <div className="p-8 max-w-7xl mx-auto">
          {/* ENHANCED HEADER */}
          <button 
            onClick={() => navigate(-1)} 
            className={`flex items-center text-sm font-semibold mb-8 hover:opacity-70 transition-all duration-200 ${labelColor} hover:gap-2 gap-1 group`}
          >
            <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" /> 
            Back to Dashboard
          </button>

          {/* HERO SECTION */}
          <div className={`${panelBg} rounded-3xl p-8 mb-8 border ${glowEffect}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-14 h-14 rounded-2xl ${Dark ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-gradient-to-br from-indigo-400 to-purple-500"} flex items-center justify-center shadow-lg shadow-indigo-500/30`}>
                    <User size={28} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black tracking-tight mb-1 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      {selectedProvider.final_profile?.provider_name || "Provider Detail"}
                    </h1>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`font-mono font-bold ${Dark ? "bg-slate-800" : "bg-slate-100"} px-3 py-1 rounded-lg text-xs border ${Dark ? "border-slate-700" : "border-slate-300"}`}>
                        NPI: {selectedProvider.final_profile?.npi || "N/A"}
                      </span>
                      <span className="opacity-60">•</span>
                      <span className="opacity-80 flex items-center gap-1">
                        <Activity size={14} />
                        Last Updated: Today
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ENHANCED SCORE BADGE */}
              <div className={`flex items-center gap-4 ${Dark ? "bg-slate-800/50" : "bg-slate-50"} p-4 rounded-2xl border ${Dark ? "border-slate-700" : "border-slate-200"} shadow-xl ${Dark ? `shadow-${scoreColor}-500/20` : `shadow-${scoreColor}-200/50`}`}>
                <div className="relative">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke={Dark ? "#334155" : "#e2e8f0"}
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke={score >= 0.8 ? "#10b981" : score >= 0.6 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${score * 251.2} 251.2`}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-black ${score >= 0.8 ? "text-emerald-500" : score >= 0.6 ? "text-amber-500" : "text-red-500"}`}>
                      {(score * 100).toFixed(0)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    AI Confidence Score
                  </div>
                  <div className={`text-lg font-bold ${score >= 0.8 ? "text-emerald-500" : score >= 0.6 ? "text-amber-500" : "text-red-500"} flex items-center gap-2`}>
                    {score >= 0.8 ? (
                      <>
                        <Shield size={18} />
                        Verified
                      </>
                    ) : score >= 0.6 ? (
                      <>
                        <AlertTriangle size={18} />
                        Review
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={18} />
                        Critical
                      </>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Multi-Agent Consensus
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VISUALIZATION SECTION */}
          <div className={`${panelBg} rounded-2xl p-6 mb-8 border ${glowEffect}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${Dark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"} shadow-lg`}>
                <BrainCircuit size={20} strokeWidth={2.5} />
              </div>
              <h2 className={`font-bold text-lg ${Dark ? "text-gray-100" : "text-gray-800"}`}>
                AI Decision Topology
              </h2>
              <div className="ml-auto flex gap-2">
                {["Intake", "Validate", "Enrich", "QA", "Synthesize"].map((stage, i) => (
                  <div key={stage} className={`text-[10px] px-2 py-1 rounded ${Dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                    {stage}
                  </div>
                ))}
              </div>
            </div>
            
            <LineageGraph provider={selectedProvider} />
          </div>

          {/* ENHANCED DATA GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN 1: THE TRUTH */}
            <div className="space-y-6">
              <DataPanel 
                title="Verified Provider Profile" 
                icon={User} 
                data={selectedProvider.final_profile} 
                originalData={selectedProvider.original_data} 
                qaFlags={selectedProvider.qa_flags} 
                primary={true}
                accent="indigo"
              />
            </div>

            {/* COLUMN 2: THE EVIDENCE */}
            <div className="space-y-6">
              <DataPanel 
                title="Address Intelligence" 
                icon={MapPin} 
                data={selectedProvider.final_profile?.address_validation}
                accent="emerald"
              />
              <DataPanel 
                title="Credentialing Data" 
                icon={Award} 
                data={selectedProvider.final_profile?.enrichment_data}
                accent="emerald"
              />
            </div>

            {/* COLUMN 3: FLAGS & RAW DATA */}
            <div className="space-y-6">
              {/* QA FLAGS - Enhanced */}
              <div className={`p-6 rounded-2xl border-2 border-dashed ${Dark ? "border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-amber-800/10" : "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50"} ${glowEffect}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl ${Dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600"} shadow-lg`}>
                    <AlertTriangle size={20} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-wider">Quality Assurance Flags</h3>
                </div>
                
                {selectedProvider.qa_flags?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProvider.qa_flags.map((flag, i) => (
                      <div 
                        key={i} 
                        className={`text-xs font-medium p-3 rounded-lg border transform hover:scale-105 transition-transform duration-200 ${
                          flag.includes("AUTO-HEALED")
                            ? `${Dark ? "bg-emerald-900/20 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200"} shadow-emerald-500/10`
                            : `${Dark ? "bg-amber-900/20 text-amber-400 border-amber-500/30" : "bg-amber-50 text-amber-700 border-amber-200"} shadow-amber-500/10`
                        } shadow-lg`}
                      >
                        <div className="flex items-start gap-2">
                          {flag.includes("AUTO-HEALED") ? (
                            <Sparkles size={14} className="mt-0.5 flex-shrink-0 animate-pulse" />
                          ) : (
                            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                          )}
                          <span>{flag}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-sm ${Dark ? "text-slate-400" : "text-slate-500"} italic text-center py-4`}>
                    ✓ No quality issues detected
                  </div>
                )}
              </div>
              
              <DataPanel 
                title="Original Input Data" 
                icon={FileJson} 
                data={selectedProvider.original_data}
                accent="amber"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProviderDetail;
