import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ChevronLeft, CheckCircle, AlertTriangle, History, 
  User, MapPin, Award, Activity, FileJson, Sparkles,
  BrainCircuit, Shield, Zap, TrendingUp, Database,
  Globe, Stethoscope, BarChart3, Eye, Layers,
  Clock, Target, XCircle, AlertCircle, ChevronDown,
  Building2, Phone, Mail, ExternalLink, Search,
  FileText, GraduationCap, Languages, CreditCard,
  Calendar, AlertOctagon, CheckSquare, Info,
  Network, Code, Server, Link as LinkIcon
} from "lucide-react";

const ProviderDetail = ({ selectedProvider: propProvider, Dark }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    breakdown: true,
    verification: true,
    enrichment: true,
    execution: false,
    flags: true,
    rawData: false
  });

  const selectedProvider = propProvider || location.state?.selectedProvider;

  if (!selectedProvider) {
    return (
      <div className={`flex items-center justify-center h-screen ${Dark ? 'bg-gradient-to-br from-slate-950 to-slate-900' : 'bg-gradient-to-br from-slate-50 to-white'}`}>
        <div className="text-center">
          <AlertCircle size={48} className={`mx-auto mb-4 ${Dark ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`mb-4 ${Dark ? 'text-slate-400' : 'text-slate-600'}`}>No provider selected</p>
          <button 
            onClick={() => navigate(-1)} 
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Extract ALL data
  const final = selectedProvider.final_profile || {};
  const initial = selectedProvider.original_data || {};
  const flags = selectedProvider.qa_flags || [];
  const fraudIndicators = selectedProvider.fraud_indicators || [];
  const qaCorrections = selectedProvider.qa_corrections || {};
  const qualityMetrics = selectedProvider.quality_metrics || {};
  const execMetadata = selectedProvider.execution_metadata || {};
  const verificationStatus = selectedProvider.verification_status || {};
  
  // NPI Data
  const npiResult = selectedProvider.npi_result || {};
  const npiResults = npiResult.results || [];
  const npiProvider = npiResults[0] || {};
  const npiBasic = npiProvider.basic || {};
  const npiAddresses = npiProvider.addresses || [];
  const npiTaxonomies = npiProvider.taxonomies || [];
  const npiIdentifiers = npiProvider.identifiers || [];
  
  // OIG Data
  const oigResult = selectedProvider.oig_leie_result || {};
  const oigDetails = oigResult.details || {};
  
  // State Board Data
  const stateBoardResult = selectedProvider.state_board_result || {};
  const disciplinaryActions = stateBoardResult.disciplinary_actions || [];
  
  // Address Data
  const addressResult = selectedProvider.address_result || {};
  
  // Web Enrichment
  const webEnrichment = selectedProvider.web_enrichment_data || {};
  const digitalFootprint = selectedProvider.digital_footprint_score || 0;
  
  const score = selectedProvider.confidence_score || 0;
  const scorePercent = (score * 100).toFixed(1);
  const confidenceTier = qualityMetrics.confidence_tier || "UNKNOWN";
  const tierEmoji = qualityMetrics.tier_emoji || "📊";
  const tierDesc = qualityMetrics.tier_description || "No description";
  
  const scoreBreakdown = qualityMetrics.score_breakdown || {};
  const dimensionPercentages = qualityMetrics.dimension_percentages || {};
  const flagSeverity = qualityMetrics.flag_severity || {};

  // Styling based on Dark mode
  const bgMain = Dark 
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" 
    : "bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900";
  
  const cardBg = Dark 
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50" 
    : "bg-white/80 border-slate-200 shadow-lg";
  
  const glowRing = Dark
    ? "hover:ring-2 hover:ring-indigo-500/30 transition-all duration-300"
    : "hover:ring-2 hover:ring-indigo-300/50 transition-all duration-300";
  
  const textPrimary = Dark ? "text-white" : "text-slate-900";
  const textSecondary = Dark ? "text-slate-400" : "text-slate-600";
  const textMuted = Dark ? "text-slate-500" : "text-slate-500";
  
  const scoreColor = score >= 0.8 ? "emerald" : score >= 0.6 ? "amber" : "red";

  // --- DIMENSION CARD ---
  const DimensionCard = ({ dimension, score, percentage, icon: Icon, color }) => {
    const colorMap = {
      emerald: { 
        bg: Dark ? "bg-emerald-500/10" : "bg-emerald-50", 
        text: Dark ? "text-emerald-400" : "text-emerald-600", 
        border: Dark ? "border-emerald-500/30" : "border-emerald-200",
        barBg: Dark ? "bg-slate-800" : "bg-slate-200"
      },
      blue: { 
        bg: Dark ? "bg-blue-500/10" : "bg-blue-50", 
        text: Dark ? "text-blue-400" : "text-blue-600", 
        border: Dark ? "border-blue-500/30" : "border-blue-200",
        barBg: Dark ? "bg-slate-800" : "bg-slate-200"
      },
      violet: { 
        bg: Dark ? "bg-violet-500/10" : "bg-violet-50", 
        text: Dark ? "text-violet-400" : "text-violet-600", 
        border: Dark ? "border-violet-500/30" : "border-violet-200",
        barBg: Dark ? "bg-slate-800" : "bg-slate-200"
      },
      amber: { 
        bg: Dark ? "bg-amber-500/10" : "bg-amber-50", 
        text: Dark ? "text-amber-400" : "text-amber-600", 
        border: Dark ? "border-amber-500/30" : "border-amber-200",
        barBg: Dark ? "bg-slate-800" : "bg-slate-200"
      },
      cyan: { 
        bg: Dark ? "bg-cyan-500/10" : "bg-cyan-50", 
        text: Dark ? "text-cyan-400" : "text-cyan-600", 
        border: Dark ? "border-cyan-500/30" : "border-cyan-200",
        barBg: Dark ? "bg-slate-800" : "bg-slate-200"
      },
      red: { 
        bg: Dark ? "bg-red-500/10" : "bg-red-50", 
        text: Dark ? "text-red-400" : "text-red-600", 
        border: Dark ? "border-red-500/30" : "border-red-200",
        barBg: Dark ? "bg-slate-800" : "bg-slate-200"
      }
    };
    
    const colors = colorMap[color] || colorMap.blue;
    const scoreValue = typeof score === 'number' ? (score * 100).toFixed(0) : "0";
    
    return (
      <div className={`p-5 rounded-xl border ${colors.border} ${colors.bg} hover:scale-105 transition-all duration-300 shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.bg} ring-1 ${colors.border}`}>
              <Icon size={20} className={colors.text} strokeWidth={2.5} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
              {dimension}
            </span>
          </div>
          <span className={`text-2xl font-black ${colors.text}`}>
            {scoreValue}%
          </span>
        </div>
        
        <div className={`relative w-full h-3 ${colors.barBg} rounded-full overflow-hidden`}>
          <div 
            className={`h-full ${colors.bg} transition-all duration-1000 ease-out`}
            style={{ width: `${scoreValue}%` }}
          >
            <div className={`h-full w-full bg-gradient-to-r from-transparent ${Dark ? 'via-white/20' : 'via-white/40'} to-transparent animate-shimmer`}></div>
          </div>
        </div>
        
        <div className={`mt-3 text-[11px] ${textMuted} flex items-center justify-between`}>
          <span>Raw Score</span>
          <span className="font-mono">{percentage || `${scoreValue}%`}</span>
        </div>
      </div>
    );
  };

  // --- AUDIT FIELD ---
  const AuditField = ({ fieldKey, value, originalData, qaFlags }) => {
    const isHealed = qaFlags?.some(
      (flag) => flag.includes("AUTO-HEALED") && flag.toLowerCase().includes(fieldKey.toLowerCase())
    );

    if (!isHealed) return <span className="break-words">{String(value)}</span>;

    return (
      <div className="group relative inline-block cursor-help">
        <div className={`flex items-center font-bold ${Dark ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-400/10 text-emerald-400' : 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700'} px-3 py-1.5 rounded-lg border ${Dark ? 'border-emerald-500/30' : 'border-emerald-200'}`}>
          <Sparkles size={14} className="mr-2 animate-pulse" />
          {value}
          <CheckCircle size={12} className="ml-2" />
        </div>
        
        <div className={`absolute z-50 hidden group-hover:block bottom-full left-0 mb-3 w-80 ${Dark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-white to-slate-50'} text-xs rounded-xl shadow-2xl border ${Dark ? 'border-slate-700' : 'border-slate-200'} ring-2 ${Dark ? 'ring-emerald-500/20' : 'ring-emerald-300/50'} animate-in fade-in slide-in-from-bottom-2`}>
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-3 text-white">
            <span className="font-bold flex items-center">
              <History size={14} className="mr-2" /> AUTO-HEALING LOG
            </span>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 items-center text-center mb-3">
              <div>
                <div className={`text-[10px] ${textMuted} mb-1`}>ORIGINAL</div>
                <div className={`line-through font-mono px-2 py-1 rounded ${Dark ? 'text-red-400 bg-red-500/10' : 'text-red-600 bg-red-50'}`}>
                  {originalData[fieldKey] || "N/A"}
                </div>
              </div>
              
              <TrendingUp size={16} className="text-emerald-400 mx-auto" />
              
              <div>
                <div className={`text-[10px] ${textMuted} mb-1`}>CORRECTED</div>
                <div className={`font-bold font-mono px-2 py-1 rounded ${Dark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50'}`}>
                  {value}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- SECTION HEADER ---
  const SectionHeader = ({ icon: Icon, title, subtitle, isExpanded, onToggle, badge, badgeColor = "indigo" }) => {
    const badgeColors = {
      indigo: Dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-700",
      emerald: Dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700",
      red: Dark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700",
      amber: Dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"
    };

    return (
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-4 hover:opacity-70 transition-opacity group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${badgeColors[badgeColor]}`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <h2 className={`font-bold text-lg ${textPrimary}`}>{title}</h2>
            {subtitle && <p className={`text-xs ${textMuted}`}>{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge && (
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${badgeColors[badgeColor]}`}>
              {badge}
            </span>
          )}
          <ChevronDown 
            size={20} 
            className={`${textSecondary} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
    );
  };

  // --- DATA FIELD ---
  const DataField = ({ label, value, icon: Icon, monospace = false }) => {
    if (!value) return null;
    
    return (
      <div className={`group ${Dark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'} p-3 rounded-lg transition-colors`}>
        <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${textSecondary} flex items-center gap-2`}>
          {Icon && <Icon size={12} />}
          {label}
        </div>
        <div className={`font-medium ${monospace ? 'font-mono text-sm' : ''} ${textPrimary}`}>
          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bgMain} relative overflow-hidden p-8`}>
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 right-20 w-96 h-96 ${Dark ? 'bg-indigo-500/5' : 'bg-indigo-200/20'} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-20 left-20 w-96 h-96 ${Dark ? 'bg-purple-500/5' : 'bg-purple-200/20'} rounded-full blur-3xl animate-pulse`} style={{animationDelay: "1s"}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className={`flex items-center gap-2 ${textSecondary} hover:${textPrimary} transition-all mb-8 group`}
        >
          <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" /> 
          <span className="font-semibold">Back to Dashboard</span>
        </button>

        {/* HERO CARD */}
        <div className={`${cardBg} border backdrop-blur-xl rounded-3xl p-8 mb-8 shadow-2xl ${glowRing}`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            {/* Provider Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ${Dark ? 'shadow-indigo-500/30' : 'shadow-indigo-300/50'}`}>
                  <User size={32} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className={`text-4xl font-black tracking-tight mb-2 bg-gradient-to-r ${Dark ? 'from-indigo-400 to-purple-400' : 'from-indigo-600 to-purple-600'} bg-clip-text text-transparent`}>
                    {final.provider_name || npiBasic.first_name + ' ' + npiBasic.last_name || "Provider Detail"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className={`font-mono font-bold ${Dark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'} px-3 py-1.5 rounded-lg border`}>
                      NPI: {final.npi || initial.NPI || "N/A"}
                    </span>
                    <span className={textMuted}>•</span>
                    <span className={`${textSecondary} flex items-center gap-2`}>
                      <Stethoscope size={16} />
                      {final.specialty || initial.specialty || npiTaxonomies[0]?.desc || "N/A"}
                    </span>
                    {npiBasic.enumeration_type && (
                      <>
                        <span className={textMuted}>•</span>
                        <span className={`text-xs ${Dark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200'} px-2 py-1 rounded border`}>
                          {npiBasic.enumeration_type}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                {(final.address || npiAddresses[0]?.address_1) && (
                  <div className={`flex items-start gap-3 text-sm ${textSecondary}`}>
                    <MapPin size={16} className={`mt-0.5 ${Dark ? 'text-indigo-400' : 'text-indigo-600'} flex-shrink-0`} />
                    <span>
                      {final.address || npiAddresses[0]?.address_1}
                      {(final.city || npiAddresses[0]?.city) && `, ${final.city || npiAddresses[0]?.city}`}
                      {(final.state || npiAddresses[0]?.state) && ` ${final.state || npiAddresses[0]?.state}`}
                      {(final.zip_code || npiAddresses[0]?.postal_code) && ` ${final.zip_code || npiAddresses[0]?.postal_code}`}
                    </span>
                  </div>
                )}
                {(final.phone || npiAddresses[0]?.telephone_number) && (
                  <div className={`flex items-center gap-3 text-sm ${textSecondary}`}>
                    <Phone size={16} className={Dark ? 'text-indigo-400' : 'text-indigo-600'} />
                    <span>{final.phone || npiAddresses[0]?.telephone_number}</span>
                  </div>
                )}
                {npiBasic.credential && (
                  <div className={`flex items-center gap-3 text-sm ${textSecondary}`}>
                    <Award size={16} className={Dark ? 'text-indigo-400' : 'text-indigo-600'} />
                    <span>{npiBasic.credential}</span>
                  </div>
                )}
                {npiBasic.last_updated && (
                  <div className={`flex items-center gap-3 text-sm ${textSecondary}`}>
                    <Calendar size={16} className={Dark ? 'text-indigo-400' : 'text-indigo-600'} />
                    <span>Updated: {new Date(npiBasic.last_updated).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* SCORE DISPLAY */}
            <div className={`flex items-center gap-6 ${Dark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} p-6 rounded-2xl border shadow-2xl`}>
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={Dark ? "#334155" : "#e2e8f0"}
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={score >= 0.8 ? "#10b981" : score >= 0.6 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${score * 351.86} 351.86`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-black ${score >= 0.8 ? 'text-emerald-500' : score >= 0.6 ? 'text-amber-500' : 'text-red-500'}`}>
                      {scorePercent}
                    </div>
                    <div className={`text-[10px] ${textMuted} uppercase`}>Score</div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${textSecondary} mb-2`}>
                  AI Confidence
                </div>
                <div className={`text-xl font-bold mb-1 flex items-center gap-2 ${score >= 0.8 ? 'text-emerald-500' : score >= 0.6 ? 'text-amber-500' : 'text-red-500'}`}>
                  <span className="text-2xl">{tierEmoji}</span> {confidenceTier}
                </div>
                <div className={`text-xs ${textMuted} max-w-xs`}>
                  {tierDesc}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONFIDENCE BREAKDOWN */}
        <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-xl ${glowRing}`}>
          <SectionHeader 
            icon={BarChart3}
            title="Multi-Dimensional Confidence Analysis"
            subtitle="6-Factor Weighted Scoring System"
            isExpanded={expandedSections.breakdown}
            onToggle={() => toggleSection('breakdown')}
            badgeColor="indigo"
          />
          
          {expandedSections.breakdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
              <DimensionCard dimension="Identity" score={scoreBreakdown.identity || 0} percentage={dimensionPercentages.identity} icon={User} color="emerald" />
              <DimensionCard dimension="Address" score={scoreBreakdown.address || 0} percentage={dimensionPercentages.address} icon={MapPin} color="blue" />
              <DimensionCard dimension="Completeness" score={scoreBreakdown.completeness || 0} percentage={dimensionPercentages.completeness} icon={Layers} color="violet" />
              <DimensionCard dimension="Freshness" score={scoreBreakdown.freshness || 0} percentage={dimensionPercentages.freshness} icon={Clock} color="cyan" />
              <DimensionCard dimension="Enrichment" score={scoreBreakdown.enrichment || 0} percentage={dimensionPercentages.enrichment} icon={Globe} color="amber" />
              <DimensionCard dimension="Risk Penalty" score={scoreBreakdown.risk || 0} percentage={dimensionPercentages.risk_penalty} icon={Shield} color="red" />
            </div>
          )}
        </div>

        {/* PRIMARY SOURCE VERIFICATION */}
        <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-xl ${glowRing}`}>
          <SectionHeader 
            icon={Database}
            title="Primary Source Verification"
            subtitle="NPPES, OIG LEIE, State Medical Board"
            isExpanded={expandedSections.verification}
            onToggle={() => toggleSection('verification')}
            badge={verificationStatus.nppes_verified && verificationStatus.oig_clear && verificationStatus.license_active ? "ALL CLEAR" : "REVIEW"}
            badgeColor={verificationStatus.nppes_verified && verificationStatus.oig_clear && verificationStatus.license_active ? "emerald" : "red"}
          />
          
          {expandedSections.verification && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              {/* NPPES Data */}
              <div className={`p-5 rounded-xl ${Dark ? 'bg-slate-800/50' : 'bg-slate-50'} border ${Dark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold flex items-center gap-2 ${textPrimary}`}>
                    <Database size={18} className={Dark ? 'text-emerald-400' : 'text-emerald-600'} />
                    NPPES Registry
                  </h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${verificationStatus.nppes_verified ? (Dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (Dark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')}`}>
                    {verificationStatus.nppes_verified ? 'VERIFIED' : 'NOT FOUND'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DataField label="Enumeration Type" value={npiBasic.enumeration_type} icon={Info} />
                  <DataField label="Gender" value={npiBasic.gender} icon={User} />
                  <DataField label="Sole Proprietor" value={npiBasic.sole_proprietor} icon={Building2} />
                  <DataField label="Organization Name" value={npiBasic.organization_name} icon={Building2} />
                  <DataField label="Last Updated" value={npiBasic.last_updated ? new Date(npiBasic.last_updated).toLocaleDateString() : null} icon={Calendar} />
                  <DataField label="Status" value={npiBasic.status} icon={Activity} />
                </div>
                
                {/* Taxonomies */}
                {npiTaxonomies.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                    <h4 className={`text-sm font-bold mb-3 ${textSecondary} flex items-center gap-2`}>
                      <Award size={14} />
                      Taxonomies ({npiTaxonomies.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {npiTaxonomies.map((tax, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${Dark ? 'bg-slate-700/50' : 'bg-white'} border ${Dark ? 'border-slate-600' : 'border-slate-200'}`}>
                          <div className={`text-xs ${textMuted} mb-1`}>Code: {tax.code}</div>
                          <div className={`font-medium text-sm ${textPrimary}`}>{tax.desc}</div>
                          {tax.primary && <span className={`text-[10px] ${Dark ? 'text-emerald-400' : 'text-emerald-600'}`}>PRIMARY</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Identifiers */}
                {npiIdentifiers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                    <h4 className={`text-sm font-bold mb-3 ${textSecondary} flex items-center gap-2`}>
                      <FileText size={14} />
                      Other Identifiers ({npiIdentifiers.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {npiIdentifiers.map((id, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${Dark ? 'bg-slate-700/50' : 'bg-white'} border ${Dark ? 'border-slate-600' : 'border-slate-200'}`}>
                          <div className={`text-xs ${textMuted} mb-1`}>{id.desc || 'Other ID'}</div>
                          <div className={`font-mono text-sm ${textPrimary}`}>{id.identifier}</div>
                          {id.state && <div className={`text-xs ${textMuted}`}>State: {id.state}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* OIG LEIE */}
              <div className={`p-5 rounded-xl ${Dark ? 'bg-slate-800/50' : 'bg-slate-50'} border ${oigResult.is_excluded ? (Dark ? 'border-red-500/50' : 'border-red-300') : (Dark ? 'border-slate-700' : 'border-slate-200')}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold flex items-center gap-2 ${textPrimary}`}>
                    <Shield size={18} className={oigResult.is_excluded ? 'text-red-500' : (Dark ? 'text-emerald-400' : 'text-emerald-600')} />
                    OIG Exclusion List
                  </h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${oigResult.is_excluded ? (Dark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700') : (Dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')}`}>
                    {oigResult.is_excluded ? 'EXCLUDED' : 'CLEAR'}
                  </span>
                </div>
                
                {oigResult.is_excluded && oigDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DataField label="Exclusion Type" value={oigDetails.exclusion_type} icon={AlertOctagon} />
                    <DataField label="Exclusion Date" value={oigDetails.exclusion_date} icon={Calendar} />
                    <DataField label="Reinstatement Date" value={oigDetails.reinstatement_date || "N/A"} icon={Calendar} />
                    <DataField label="Waiver State" value={oigDetails.waiver_state || "None"} icon={MapPin} />
                  </div>
                )}
                
                {!oigResult.is_excluded && (
                  <p className={`text-sm ${textSecondary}`}>✓ No exclusions found in OIG LEIE database</p>
                )}
              </div>

              {/* State Medical Board */}
              <div className={`p-5 rounded-xl ${Dark ? 'bg-slate-800/50' : 'bg-slate-50'} border ${Dark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold flex items-center gap-2 ${textPrimary}`}>
                    <Award size={18} className={verificationStatus.license_active ? (Dark ? 'text-emerald-400' : 'text-emerald-600') : 'text-amber-500'} />
                    State Medical Board
                  </h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${verificationStatus.license_active ? (Dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (Dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')}`}>
                    {stateBoardResult.status || 'UNKNOWN'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DataField label="License Number" value={initial.license_number} icon={FileText} monospace />
                  <DataField label="State" value={initial.state} icon={MapPin} />
                  <DataField label="Expiration Date" value={stateBoardResult.expiration_date} icon={Calendar} />
                  <DataField label="Status" value={stateBoardResult.status} icon={Activity} />
                </div>
                
                {disciplinaryActions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                    <h4 className={`text-sm font-bold mb-3 ${Dark ? 'text-red-400' : 'text-red-600'} flex items-center gap-2`}>
                      <AlertTriangle size={14} />
                      Disciplinary Actions ({disciplinaryActions.length})
                    </h4>
                    <div className="space-y-2">
                      {disciplinaryActions.map((action, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${Dark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'} border`}>
                          <div className={`font-medium ${Dark ? 'text-red-400' : 'text-red-700'}`}>{action.action_type}</div>
                          <div className={`text-xs ${textMuted} mt-1`}>Date: {action.effective_date}</div>
                          {action.reason && <div className={`text-xs ${textSecondary} mt-1`}>{action.reason}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* WEB ENRICHMENT */}
        <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-xl ${glowRing}`}>
          <SectionHeader 
            icon={Globe}
            title="Web Enrichment & Digital Footprint"
            subtitle={`Digital Presence Score: ${(digitalFootprint * 100).toFixed(0)}%`}
            isExpanded={expandedSections.enrichment}
            onToggle={() => toggleSection('enrichment')}
            badgeColor="cyan"
          />
          
          {expandedSections.enrichment && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              {/* Address Validation */}
              <div className={`p-5 rounded-xl ${Dark ? 'bg-slate-800/50' : 'bg-slate-50'} border ${Dark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold flex items-center gap-2 ${textPrimary}`}>
                    <MapPin size={18} className={Dark ? 'text-blue-400' : 'text-blue-600'} />
                    Address Validation
                  </h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${verificationStatus.address_validated ? (Dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (Dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')}`}>
                    {addressResult.verdict || 'UNKNOWN'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DataField label="Is Medical Facility" value={addressResult.is_medical_facility} icon={Building2} />
                  <DataField label="Facility Type" value={addressResult.facility_type} icon={Stethoscope} />
                  <DataField label="USPS Validation" value={addressResult.verdict} icon={CheckCircle} />
                  <DataField label="Formatted Address" value={addressResult.formatted_address} icon={MapPin} />
                </div>
                
                {addressResult.coordinates && (
                  <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                    <h4 className={`text-sm font-bold mb-2 ${textSecondary}`}>Coordinates</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <DataField label="Latitude" value={addressResult.coordinates.lat} monospace />
                      <DataField label="Longitude" value={addressResult.coordinates.lng} monospace />
                    </div>
                  </div>
                )}
              </div>

              {/* Credentials & Education */}
              {(webEnrichment.education?.length > 0 || webEnrichment.certifications?.length > 0 || webEnrichment.languages?.length > 0) && (
                <div className={`p-5 rounded-xl ${Dark ? 'bg-slate-800/50' : 'bg-slate-50'} border ${Dark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h3 className={`font-bold flex items-center gap-2 mb-4 ${textPrimary}`}>
                    <GraduationCap size={18} className={Dark ? 'text-purple-400' : 'text-purple-600'} />
                    Credentials & Education
                  </h3>
                  
                  <div className="space-y-4">
                    {webEnrichment.education?.length > 0 && (
                      <div>
                        <h4 className={`text-sm font-bold mb-2 ${textSecondary} flex items-center gap-2`}>
                          <GraduationCap size={14} />
                          Education
                        </h4>
                        <div className="space-y-2">
                          {webEnrichment.education.map((edu, idx) => (
                            <div key={idx} className={`p-2 rounded ${Dark ? 'bg-slate-700/50' : 'bg-white'} border ${Dark ? 'border-slate-600' : 'border-slate-200'}`}>
                              <span className={`text-sm ${textPrimary}`}>{edu}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {webEnrichment.certifications?.length > 0 && (
                      <div>
                        <h4 className={`text-sm font-bold mb-2 ${textSecondary} flex items-center gap-2`}>
                          <Award size={14} />
                          Certifications
                        </h4>
                        <div className="space-y-2">
                          {webEnrichment.certifications.map((cert, idx) => (
                            <div key={idx} className={`p-2 rounded ${Dark ? 'bg-slate-700/50' : 'bg-white'} border ${Dark ? 'border-slate-600' : 'border-slate-200'}`}>
                              <span className={`text-sm ${textPrimary}`}>{cert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {webEnrichment.languages?.length > 0 && (
                      <div>
                        <h4 className={`text-sm font-bold mb-2 ${textSecondary} flex items-center gap-2`}>
                          <Languages size={14} />
                          Languages
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {webEnrichment.languages.map((lang, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded-full text-xs ${Dark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {webEnrichment.insurance_accepted?.length > 0 && (
                      <div>
                        <h4 className={`text-sm font-bold mb-2 ${textSecondary} flex items-center gap-2`}>
                          <CreditCard size={14} />
                          Insurance Accepted
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {webEnrichment.insurance_accepted.map((ins, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded-full text-xs ${Dark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                              {ins}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QA FLAGS */}
        {flags.length > 0 && (
          <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-xl ${Dark ? 'border-amber-500/30' : 'border-amber-300'}`}>
            <SectionHeader 
              icon={AlertTriangle}
              title="Quality Assurance Flags"
              subtitle={`${(flagSeverity.CRITICAL || []).length} Critical • ${(flagSeverity.WARNING || []).length} Warnings • ${(flagSeverity.INFO || []).length} Healed`}
              isExpanded={expandedSections.flags}
              onToggle={() => toggleSection('flags')}
              badgeColor="amber"
            />
            
            {expandedSections.flags && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                {flags.map((flag, i) => {
                  const isCritical = (flagSeverity.CRITICAL || []).includes(flag);
                  const isWarning = (flagSeverity.WARNING || []).includes(flag);
                  
                  return (
                    <div 
                      key={i} 
                      className={`text-sm font-medium p-4 rounded-lg border transform hover:scale-105 transition-transform ${
                        isCritical
                          ? `${Dark ? 'bg-red-900/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200'} shadow-lg`
                          : isWarning
                          ? `${Dark ? 'bg-amber-900/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'} shadow-lg`
                          : `${Dark ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} shadow-lg`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isCritical ? (
                          <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                        ) : isWarning ? (
                          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        ) : (
                          <Sparkles size={16} className="mt-0.5 flex-shrink-0 animate-pulse" />
                        )}
                        <span>{flag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FRAUD INDICATORS */}
        {fraudIndicators.length > 0 && (
          <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-xl ${Dark ? 'border-red-500/50' : 'border-red-300'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${Dark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                <Shield size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className={`font-bold text-lg ${textPrimary}`}>Fraud Indicators Detected</h2>
                <p className={`text-xs ${textMuted}`}>{fraudIndicators.length} potential issues found</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {fraudIndicators.map((indicator, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${Dark ? 'bg-red-900/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200'} border flex items-center gap-2`}>
                  <AlertOctagon size={16} className="flex-shrink-0" />
                  <span className="text-sm font-medium">{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXECUTION METADATA */}
        <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-xl ${glowRing}`}>
          <SectionHeader 
            icon={Zap}
            title="Pipeline Performance Metrics"
            subtitle="Execution times for each verification stage"
            isExpanded={expandedSections.execution}
            onToggle={() => toggleSection('execution')}
            badgeColor="indigo"
          />
          
          {expandedSections.execution && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
              {Object.entries(execMetadata).map(([stage, data]) => {
                if (!data || typeof data !== 'object') return null;
                
                const time = (data.execution_time_seconds || 0).toFixed(3);
                const icons = {
                  nppes: Database,
                  oig_leie: Shield,
                  state_board: Award,
                  address: MapPin,
                  web_enrichment: Globe,
                  arbitration: BrainCircuit
                };
                const Icon = icons[stage] || Server;
                
                return (
                  <div key={stage} className={`p-4 rounded-lg ${Dark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} border`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon size={18} className={Dark ? 'text-indigo-400' : 'text-indigo-600'} />
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${textPrimary} capitalize`}>
                          {stage.replace(/_/g, ' ')}
                        </div>
                        <div className={`text-[10px] ${textMuted}`}>Execution Time</div>
                      </div>
                    </div>
                    <div className={`text-2xl font-black ${Dark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {time}s
                    </div>
                    {data.source_authority && (
                      <div className={`text-xs ${textMuted} mt-2`}>
                        Authority: {data.source_authority}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DATA COMPARISON */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Verified Profile */}
          <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 shadow-xl ring-2 ${Dark ? 'ring-indigo-500/30' : 'ring-indigo-300/50'}`}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b ${Dark ? 'border-slate-700/50' : 'border-slate-200'}">
              <div className={`p-2.5 rounded-xl ${Dark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                <CheckCircle size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-sm uppercase tracking-wider ${textPrimary}`}>Verified Profile</h3>
              </div>
              <span className={`text-[10px] font-bold bg-indigo-500 text-white px-2.5 py-1 rounded-full animate-pulse`}>
                VERIFIED
              </span>
            </div>
            
            <div className="space-y-4">
              {Object.entries(final).map(([key, value]) => {
                if (typeof value === 'object' || !value) return null;
                
                return (
                  <div key={key} className={`group ${Dark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'} p-2 rounded-lg transition-colors`}>
                    <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${textSecondary} flex items-center gap-1`}>
                      <div className={`w-1 h-1 rounded-full ${Dark ? 'bg-slate-400' : 'bg-slate-500'}`}></div>
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="font-medium text-lg">
                      <AuditField fieldKey={key} value={value} originalData={initial} qaFlags={flags} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Original Input */}
          <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 shadow-xl`}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b ${Dark ? 'border-slate-700/50' : 'border-slate-200'}">
              <div className={`p-2.5 rounded-xl ${Dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                <FileJson size={20} strokeWidth={2.5} />
              </div>
              <h3 className={`font-bold text-sm uppercase tracking-wider ${textPrimary}`}>Original Input</h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(initial).map(([key, value]) => {
                if (typeof value === 'object' || !value) return null;
                
                return (
                  <div key={key} className={`group ${Dark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'} p-2 rounded-lg transition-colors`}>
                    <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${textSecondary} flex items-center gap-1`}>
                      <div className={`w-1 h-1 rounded-full ${Dark ? 'bg-slate-400' : 'bg-slate-500'}`}></div>
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className={`font-medium ${textPrimary} break-words`}>
                      {String(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RAW JSON DATA (Collapsible for developers) */}
        <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-xl ${glowRing}`}>
          <SectionHeader 
            icon={Code}
            title="Raw JSON Data"
            subtitle="Complete backend response (for developers)"
            isExpanded={expandedSections.rawData}
            onToggle={() => toggleSection('rawData')}
            badgeColor="indigo"
          />
          
          {expandedSections.rawData && (
            <div className={`${Dark ? 'bg-slate-900' : 'bg-slate-50'} p-4 rounded-lg overflow-x-auto animate-in fade-in slide-in-from-top-2`}>
              <pre className={`text-xs ${Dark ? 'text-slate-300' : 'text-slate-700'} font-mono`}>
                {JSON.stringify(selectedProvider, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* SUMMARY FOOTER */}
        <div className={`${cardBg} border backdrop-blur-xl rounded-2xl p-6 shadow-xl`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl ${Dark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
              <Target size={20} strokeWidth={2.5} />
            </div>
            <h2 className={`font-bold text-lg ${textPrimary}`}>Processing Summary</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-black ${Dark ? 'text-indigo-400' : 'text-indigo-600'} mb-2`}>{flags.length}</div>
              <div className={`text-xs ${textMuted} uppercase tracking-wide`}>Total Flags</div>
            </div>
            
            <div className="text-center">
              <div className={`text-4xl font-black ${Dark ? 'text-emerald-400' : 'text-emerald-600'} mb-2`}>
                {(flagSeverity.INFO || []).length}
              </div>
              <div className={`text-xs ${textMuted} uppercase tracking-wide`}>Auto-Healed</div>
            </div>
            
            <div className="text-center">
              <div className={`text-4xl font-black ${Dark ? 'text-teal-400' : 'text-teal-600'} mb-2`}>{scorePercent}%</div>
              <div className={`text-xs ${textMuted} uppercase tracking-wide`}>Confidence</div>
            </div>
            
            <div className="text-center">
              <div className={`text-4xl font-black ${Dark ? 'text-purple-400' : 'text-purple-600'} mb-2`}>6</div>
              <div className={`text-xs ${textMuted} uppercase tracking-wide`}>Pipeline Stages</div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ProviderDetail;