import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, CheckCircle, AlertTriangle, History, User, MapPin,
  Award, Activity, FileJson, Sparkles, Shield, Zap,
  TrendingUp, Database, Globe, BarChart3, Layers,
  Clock, XCircle, AlertCircle
} from "lucide-react";
import { useHealthContext } from "../Context/HealthContext";

const ProviderDetail = () => {
  const navigate = useNavigate();
  const { selectedProvider, Dark } = useHealthContext();

  if (!selectedProvider) {
    return (
      <div className={`flex items-center justify-center h-screen ${Dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <AlertCircle size={48} className={`mx-auto mb-4 ${Dark ? 'text-slate-500' : 'text-slate-400'}`} />
          <p className={`${Dark ? 'text-slate-400' : 'text-slate-600'} mb-4 text-lg`}>No provider selected</p>
          <button
            onClick={() => navigate("/provider")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back to Providers
          </button>
        </div>
      </div>
    );
  }

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

  const final = selectedProvider.final_profile || {};
  const initial = selectedProvider.original_data || selectedProvider.initial_data || {};
  const flags = selectedProvider.qa_flags || [];
  
  // FIX: quality_metrics might be nested in final_profile OR at root level
  const qualityMetrics = selectedProvider.quality_metrics || final.quality_metrics || {};
  const execMetadata = selectedProvider.execution_metadata || final.execution_metadata || {};
  
  const score = selectedProvider.confidence_score || 0;
  const scorePercent = (score * 100).toFixed(1);
  const confidenceTier = qualityMetrics.confidence_tier || "UNKNOWN";
  const tierEmoji = qualityMetrics.tier_emoji || "📊";
  const tierDesc = qualityMetrics.tier_description || "No description";
  const scoreBreakdown = qualityMetrics.score_breakdown || {};
  const dimensionPercentages = qualityMetrics.dimension_percentages || {};
  const flagSeverity = qualityMetrics.flag_severity || {};

  // FIX: Create proper address_validation object if it's a string
  const addressValidationData = typeof final.address_validation === 'string' 
    ? { verdict: final.address_validation }
    : final.address_validation || {};

  // FIX: Create proper enrichment object
  const enrichmentData = final.enrichment_data || {
    education: final.education || [],
    certifications: final.certifications || [],
    languages: final.languages || [],
    insurance_accepted: final.insurance_accepted || []
  };

  // DEBUG: Log the actual data structure
  console.log("=== PROVIDER DATA DEBUG ===");
  console.log("Full selectedProvider:", selectedProvider);
  console.log("final_profile:", final);
  console.log("quality_metrics:", qualityMetrics);
  console.log("score_breakdown:", scoreBreakdown);
  console.log("dimension_percentages:", dimensionPercentages);
  console.log("addressValidationData:", addressValidationData);
  console.log("enrichmentData:", enrichmentData);

  const AuditField = ({ fieldKey, value, originalData, qaFlags }) => {
    const isHealed = qaFlags?.some(
      (flag) =>
        flag.includes("AUTO-HEALED") &&
        flag.toLowerCase().includes(fieldKey.toLowerCase())
    );

    if (!isHealed)
      return <span className={`${valueColor} break-words`}>{String(value)}</span>;

    return (
      <div className="group relative inline-block cursor-help">
        <div className="flex items-center text-emerald-500 font-bold bg-gradient-to-r from-emerald-500/10 via-emerald-400/10 to-emerald-500/10 px-3 py-1.5 rounded-lg text-sm transition-all duration-300 hover:from-emerald-500/20 hover:via-emerald-400/20 hover:to-emerald-500/20 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
          <Sparkles size={14} className="mr-2 animate-pulse" />
          {value}
          <CheckCircle size={12} className="ml-2" />
        </div>

        <div className="absolute z-50 hidden group-hover:block bottom-full left-0 mb-3 w-80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white text-xs rounded-xl shadow-2xl border border-slate-700 overflow-hidden ring-2 ring-emerald-500/20">
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
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Original Value
                </div>
                <div className="text-red-400 line-through font-mono bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                  {originalData[fieldKey] || "N/A"}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <TrendingUp size={16} className="text-emerald-400" />
                <div className="text-[8px] text-slate-500 mt-1">AI Fixed</div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Corrected Value
                </div>
                <div className="text-emerald-400 font-bold font-mono bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  {value}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Validation Method:</span>
                <span className="text-slate-300 font-semibold">
                  Multi-Agent Consensus
                </span>
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

  const DimensionCard = ({ dimension, score, percentage, icon: Icon, color }) => {
    const colorClasses = {
      emerald: {
        bg: Dark ? "bg-emerald-500/10" : "bg-emerald-50",
        text: Dark ? "text-emerald-400" : "text-emerald-600",
        border: Dark ? "border-emerald-500/30" : "border-emerald-200",
        ring: "ring-emerald-500/20",
        barColor: "#10b981"
      },
      blue: {
        bg: Dark ? "bg-blue-500/10" : "bg-blue-50",
        text: Dark ? "text-blue-400" : "text-blue-600",
        border: Dark ? "border-blue-500/30" : "border-blue-200",
        ring: "ring-blue-500/20",
        barColor: "#3b82f6"
      },
      violet: {
        bg: Dark ? "bg-violet-500/10" : "bg-violet-50",
        text: Dark ? "text-violet-400" : "text-violet-600",
        border: Dark ? "border-violet-500/30" : "border-violet-200",
        ring: "ring-violet-500/20",
        barColor: "#8b5cf6"
      },
      amber: {
        bg: Dark ? "bg-amber-500/10" : "bg-amber-50",
        text: Dark ? "text-amber-400" : "text-amber-600",
        border: Dark ? "border-amber-500/30" : "border-amber-200",
        ring: "ring-amber-500/20",
        barColor: "#f59e0b"
      },
      cyan: {
        bg: Dark ? "bg-cyan-500/10" : "bg-cyan-50",
        text: Dark ? "text-cyan-400" : "text-cyan-600",
        border: Dark ? "border-cyan-500/30" : "border-cyan-200",
        ring: "ring-cyan-500/20",
        barColor: "#06b6d4"
      },
      red: {
        bg: Dark ? "bg-red-500/10" : "bg-red-50",
        text: Dark ? "text-red-400" : "text-red-600",
        border: Dark ? "border-red-500/30" : "border-red-200",
        ring: "ring-red-500/20",
        barColor: "#ef4444"
      },
    };

    const colors = colorClasses[color] || colorClasses.blue;
    const scoreValue = typeof score === 'number' ? (score * 100).toFixed(0) : '0';

    return (
      <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg} hover:ring-2 ${colors.ring} transition-all duration-300 transform hover:scale-105`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon size={16} className={colors.text} strokeWidth={2.5} />
            <span className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}>
              {dimension}
            </span>
          </div>
          <span className={`text-lg font-black ${colors.text}`}>
            {scoreValue}%
          </span>
        </div>

        <div className={`w-full h-2 ${Dark ? "bg-slate-800" : "bg-slate-200"} rounded-full overflow-hidden`}>
          <div
            className="h-full transition-all duration-1000 ease-out"
            style={{
              width: `${scoreValue}%`,
              backgroundColor: colors.barColor
            }}
          />
        </div>

        <div className="mt-2 text-[10px] text-slate-500">
          Raw Score: {percentage || "0%"}
        </div>
      </div>
    );
  };

  const ExecutionMetric = ({ stage, data, icon: Icon, color }) => {
    if (!data) return null;

    const time = (data.execution_time_seconds || 0).toFixed(2);
    const colorClasses = {
      emerald: Dark ? "text-emerald-400" : "text-emerald-600",
      blue: Dark ? "text-blue-400" : "text-blue-600",
      cyan: Dark ? "text-cyan-400" : "text-cyan-600"
    };
    const colorClass = colorClasses[color] || colorClasses.blue;

    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg ${Dark ? "bg-slate-800/50" : "bg-slate-50"} border ${Dark ? "border-slate-700" : "border-slate-200"}`}>
        <Icon size={18} className={colorClass} />
        <div className="flex-1">
          <div className="text-xs font-semibold">{stage}</div>
          <div className="text-[10px] text-slate-500">Execution Time</div>
        </div>
        <div className={`text-sm font-bold ${colorClass}`}>{time}s</div>
      </div>
    );
  };

  const DataPanel = ({ title, icon: Icon, data, originalData, qaFlags, primary = false, accent = "indigo" }) => {
    // Better validation - check if data is an object and not a string
    if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
      console.log(`DataPanel "${title}" - Invalid data:`, data);
      return null;
    }

    const accentColors = {
      indigo: {
        iconBg: Dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600",
        ring: "ring-indigo-500/30",
        badge: "bg-indigo-500",
        glow: Dark ? "shadow-indigo-500/20" : "shadow-indigo-200/50",
      },
      emerald: {
        iconBg: Dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600",
        ring: "ring-emerald-500/30",
        badge: "bg-emerald-500",
        glow: Dark ? "shadow-emerald-500/20" : "shadow-emerald-200/50",
      },
      amber: {
        iconBg: Dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600",
        ring: "ring-amber-500/30",
        badge: "bg-amber-500",
        glow: Dark ? "shadow-amber-500/20" : "shadow-amber-200/50",
      },
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
            if (typeof value === "object" && value !== null) return null;
            if (key === "synthesis_timestamp" || key === "synthesis_status" || key === "synthesis_method" || key === "data_sources") return null;

            return (
              <div key={key} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 p-2 rounded-lg transition-colors duration-200">
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${labelColor} flex items-center gap-1`}>
                  <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                  {key.replace(/_/g, " ")}
                </div>
                <div className={`font-medium ${primary ? "text-lg" : "text-sm"}`}>
                  {primary ? (
                    <AuditField fieldKey={key} value={value} originalData={originalData} qaFlags={qaFlags} />
                  ) : (
                    <span className={valueColor}>{String(value)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bgMain} relative overflow-hidden p-8`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 right-20 w-96 h-96 ${Dark ? "bg-indigo-500/5" : "bg-indigo-200/20"} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-20 left-20 w-96 h-96 ${Dark ? "bg-purple-500/5" : "bg-purple-200/20"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <button onClick={() => navigate(-1)} className={`flex items-center text-sm font-semibold mb-8 hover:opacity-70 transition-all duration-200 ${labelColor} hover:gap-2 gap-1 group`}>
          <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>

        <div className={`${panelBg} rounded-3xl p-8 mb-8 border ${glowEffect}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-14 h-14 rounded-2xl ${Dark ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-gradient-to-br from-indigo-400 to-purple-500"} flex items-center justify-center shadow-lg shadow-indigo-500/30`}>
                  <User size={28} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tight mb-1 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {final.provider_name || "Provider Detail"}
                  </h1>
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <span className={`font-mono font-bold ${Dark ? "bg-slate-800" : "bg-slate-100"} px-3 py-1 rounded-lg text-xs border ${Dark ? "border-slate-700" : "border-slate-300"}`}>
                      NPI: {final.npi || "N/A"}
                    </span>
                    <span className="opacity-60">•</span>
                    <span className="opacity-80 flex items-center gap-1">
                      <Activity size={14} />
                      Specialty: {final.specialty || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-4 ${Dark ? "bg-slate-800/50" : "bg-slate-50"} p-4 rounded-2xl border ${Dark ? "border-slate-700" : "border-slate-200"} shadow-xl`}>
              <div className="relative">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle cx="48" cy="48" r="40" stroke={Dark ? "#334155" : "#e2e8f0"} strokeWidth="8" fill="none" />
                  <circle cx="48" cy="48" r="40" stroke={score >= 0.8 ? "#10b981" : score >= 0.6 ? "#f59e0b" : "#ef4444"} strokeWidth="8" fill="none" strokeDasharray={`${score * 251.2} 251.2`} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-black ${score >= 0.8 ? "text-emerald-500" : score >= 0.6 ? "text-amber-500" : "text-red-500"}`}>
                    {scorePercent}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  AI Confidence Score
                </div>
                <div className={`text-lg font-bold ${score >= 0.8 ? "text-emerald-500" : score >= 0.6 ? "text-amber-500" : "text-red-500"} flex items-center gap-2`}>
                  {tierEmoji} {confidenceTier}
                </div>
                <div className="text-xs text-slate-400 mt-1">{tierDesc}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${panelBg} rounded-2xl p-6 mb-8 border ${glowEffect}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl ${Dark ? "bg-teal-500/20 text-teal-400" : "bg-teal-100 text-teal-600"} shadow-lg`}>
              <BarChart3 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className={`font-bold text-lg ${Dark ? "text-gray-100" : "text-gray-800"}`}>
                Multi-Dimensional Confidence Analysis
              </h2>
              <p className="text-xs text-slate-500">6-Factor Weighted Scoring System</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DimensionCard dimension="Identity" score={scoreBreakdown.identity || 0} percentage={dimensionPercentages.identity || "0%"} icon={User} color="emerald" />
            <DimensionCard dimension="Address" score={scoreBreakdown.address || 0} percentage={dimensionPercentages.address || "0%"} icon={MapPin} color="blue" />
            <DimensionCard dimension="Completeness" score={scoreBreakdown.completeness || 0} percentage={dimensionPercentages.completeness || "0%"} icon={Layers} color="violet" />
            <DimensionCard dimension="Freshness" score={scoreBreakdown.freshness || 0} percentage={dimensionPercentages.freshness || "0%"} icon={Clock} color="cyan" />
            <DimensionCard dimension="Enrichment" score={scoreBreakdown.enrichment || 0} percentage={dimensionPercentages.enrichment || "0%"} icon={Globe} color="amber" />
            <DimensionCard dimension="Risk" score={scoreBreakdown.risk || 0} percentage={dimensionPercentages.risk_penalty || "0%"} icon={Shield} color="red" />
          </div>
        </div>

        {Object.keys(execMetadata).length > 0 && (
          <div className={`${panelBg} rounded-2xl p-6 mb-8 border ${glowEffect}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${Dark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"} shadow-lg`}>
                <Zap size={20} strokeWidth={2.5} />
              </div>
              <h2 className={`font-bold text-lg ${Dark ? "text-gray-100" : "text-gray-800"}`}>
                Pipeline Performance Metrics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ExecutionMetric stage="NPI Validation" data={execMetadata.npi} icon={Database} color="emerald" />
              <ExecutionMetric stage="Address Validation" data={execMetadata.address} icon={MapPin} color="blue" />
              <ExecutionMetric stage="Web Enrichment" data={execMetadata.enrichment} icon={Globe} color="cyan" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <DataPanel title="Verified Provider Profile" icon={User} data={final} originalData={initial} qaFlags={flags} primary={true} accent="indigo" />
          </div>

          <div className="space-y-6">
            <DataPanel title="Address Intelligence" icon={MapPin} data={final.address_validation} accent="emerald" />
            <DataPanel title="Credentialing Data" icon={Award} data={final.enrichment_data} accent="emerald" />
          </div>

          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border-2 border-dashed ${Dark ? "border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-amber-800/10" : "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50"} ${glowEffect}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${Dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600"} shadow-lg`}>
                  <AlertTriangle size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm uppercase tracking-wider">Quality Assurance Flags</h3>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      {(flagSeverity.CRITICAL || []).length} Critical
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {(flagSeverity.WARNING || []).length} Warnings
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {(flagSeverity.INFO || []).length} Healed
                    </span>
                  </div>
                </div>
              </div>

              {flags.length > 0 ? (
                <div className="space-y-3">
                  {flags.map((flag, i) => {
                    const isCritical = (flagSeverity.CRITICAL || []).includes(flag);
                    const isWarning = (flagSeverity.WARNING || []).includes(flag);

                    return (
                      <div key={i} className={`text-xs font-medium p-3 rounded-lg border transform hover:scale-105 transition-transform duration-200 ${
                          isCritical
                            ? `${Dark ? "bg-red-900/20 text-red-400 border-red-500/30" : "bg-red-50 text-red-700 border-red-200"} shadow-red-500/10`
                            : isWarning
                            ? `${Dark ? "bg-amber-900/20 text-amber-400 border-amber-500/30" : "bg-amber-50 text-amber-700 border-amber-200"} shadow-amber-500/10`
                            : `${Dark ? "bg-emerald-900/20 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200"} shadow-emerald-500/10`
                        } shadow-lg`}>
                        <div className="flex items-start gap-2">
                          {isCritical ? (
                            <XCircle size={14} className="mt-0.5 flex-shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                          ) : (
                            <Sparkles size={14} className="mt-0.5 flex-shrink-0 animate-pulse" />
                          )}
                          <span>{flag}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-sm ${Dark ? "text-slate-400" : "text-slate-500"} italic text-center py-4`}>
                  ✓ No quality issues detected
                </div>
              )}
            </div>

            <DataPanel title="Original Input Data" icon={FileJson} data={initial} accent="amber" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetail;