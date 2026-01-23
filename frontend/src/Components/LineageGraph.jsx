import React, { useMemo, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle, 
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Database, 
  Globe, 
  BrainCircuit, 
  ShieldCheck, 
  FileText, 
  AlertTriangle,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  Activity,
  Eye,
  MapPin,
  TrendingUp,
  Award,
  BarChart3
} from 'lucide-react';

/* =========================
   CUSTOM NODE WITH ENHANCED METRICS
========================= */
const CustomNode = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative group px-5 py-4 min-w-[240px] rounded-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${data.nodeStyle}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Enhanced Glow */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl ${data.glowColor}`} />

      {/* Top Handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !border-2 !border-white !shadow-lg"
        style={{ background: data.handleColor || '#64748b' }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2.5 rounded-lg ${data.iconBg} ${data.iconColor} shadow-lg`}>
            {data.icon}
          </div>

          <div className="flex-1">
            <div className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${data.subLabelColor}`}>
              {data.status === 'active' && <Activity size={9} className="animate-pulse" />}
              {data.subLabel}
            </div>
            <div className={`text-sm font-bold ${data.labelColor}`}>
              {data.label}
            </div>
          </div>

          {data.statusIcon && (
            <div className={`p-1.5 rounded-full ${data.statusBg}`}>
              {data.statusIcon}
            </div>
          )}
        </div>

        {data.badge && (
          <div className={`mt-2.5 text-[10px] py-1.5 px-2.5 rounded-md font-semibold border ${data.badgeStyle} flex items-center gap-2`}>
            {data.badgeIcon}
            <span className="flex-1">{data.badge}</span>
            {data.metric && <span className="font-bold">{data.metric}</span>}
          </div>
        )}

        {/* Enhanced Hover Info */}
        {isHovered && data.hoverInfo && (
          <div className="mt-2.5 text-[10px] space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {data.hoverInfo.map((info, i) => (
              <div key={i} className={`flex justify-between px-2 py-1.5 rounded-md ${data.hoverBg} border border-slate-200/50`}>
                <span className={`${data.hoverLabelColor} font-medium`}>{info.label}</span>
                <span className={`font-bold ${data.hoverValueColor}`}>{info.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !border-2 !border-white !shadow-lg"
        style={{ background: data.handleColor || '#64748b' }}
      />

      {/* Corner Badge */}
      {data.cornerBadge && (
        <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full ${data.cornerBadgeBg} flex items-center justify-center shadow-lg border-2 border-white`}>
          {data.cornerBadge}
        </div>
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

/* =========================
   MAIN ENHANCED GRAPH
========================= */
const LineageGraph = ({ provider }) => {
  const { nodes, edges } = useMemo(() => {
    if (!provider) return { nodes: [], edges: [] };

    const initial = provider.original_data || {};
    const final = provider.final_profile || {};
    const flags = provider.qa_flags || [];
    const qualityMetrics = provider.quality_metrics || {};
    const execMetadata = provider.execution_metadata || {};
    
    // Extract enhanced metrics
    const isNpiFound = final.npi_match_found !== false;
    const isAutoHealed = flags.some(f => f.includes("AUTO-HEALED"));
    const isFallback = final.synthesis_status === "fallback";
    const confidence = (provider.confidence_score || 0) * 100;
    const isHighConfidence = confidence >= 80;
    
    const flagSeverity = qualityMetrics.flag_severity || {};
    const criticalCount = (flagSeverity.CRITICAL || []).length;
    const warningCount = (flagSeverity.WARNING || []).length;
    const infoCount = (flagSeverity.INFO || []).length;
    
    const scoreBreakdown = qualityMetrics.score_breakdown || {};
    const confidenceTier = qualityMetrics.confidence_tier || "UNKNOWN";
    const tierEmoji = qualityMetrics.tier_emoji || "📊";

    const nodes = [
      // INPUT NODE
      {
        id: 'input',
        type: 'custom',
        position: { x: 400, y: 0 },
        data: {
          label: 'Raw CSV Input',
          subLabel: 'DATA SOURCE',
          icon: <FileText size={20} />,
          nodeStyle: 'bg-white border-slate-300 shadow-xl',
          glowColor: 'bg-slate-300/60',
          iconBg: 'bg-slate-100',
          iconColor: 'text-slate-700',
          labelColor: 'text-slate-900',
          subLabelColor: 'text-slate-500',
          handleColor: '#64748b',
          badge: initial.full_name || 'Provider Record',
          badgeIcon: <Eye size={11} />,
          badgeStyle: 'border-slate-300 bg-slate-50 text-slate-700',
          hoverBg: 'bg-slate-100',
          hoverLabelColor: 'text-slate-600',
          hoverValueColor: 'text-slate-900',
          hoverInfo: [
            { label: 'Fields', value: Object.keys(initial).length },
            { label: 'Source', value: 'CSV Upload' }
          ]
        }
      },
      
      // STAGE 1: NPI VALIDATION
      {
        id: 'npi',
        type: 'custom',
        position: { x: 50, y: 180 },
        data: {
          label: isNpiFound ? 'NPI Verified ✓' : 'NPI Failed ✗',
          subLabel: 'STAGE 1: NPI REGISTRY',
          icon: isNpiFound ? <CheckCircle2 size={20} /> : <XCircle size={20} />,
          status: 'active',
          nodeStyle: isNpiFound
            ? 'bg-emerald-50 border-emerald-500 shadow-xl'
            : 'bg-red-50 border-red-500 shadow-xl',
          glowColor: isNpiFound ? 'bg-emerald-400/60' : 'bg-red-400/60',
          iconBg: isNpiFound ? 'bg-emerald-100' : 'bg-red-100',
          iconColor: isNpiFound ? 'text-emerald-700' : 'text-red-700',
          labelColor: isNpiFound ? 'text-emerald-900' : 'text-red-900',
          subLabelColor: isNpiFound ? 'text-emerald-600' : 'text-red-600',
          handleColor: isNpiFound ? '#10b981' : '#ef4444',
          badge: isNpiFound ? `NPI: ${final.npi}` : 'Invalid NPI',
          badgeIcon: <Database size={11} />,
          badgeStyle: isNpiFound
            ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
            : 'border-red-300 bg-red-100 text-red-800',
          metric: execMetadata.npi ? `${(execMetadata.npi.execution_time_seconds || 0).toFixed(2)}s` : null,
          hoverBg: isNpiFound ? 'bg-emerald-100' : 'bg-red-100',
          hoverLabelColor: isNpiFound ? 'text-emerald-700' : 'text-red-700',
          hoverValueColor: isNpiFound ? 'text-emerald-900' : 'text-red-900',
          hoverInfo: isNpiFound ? [
            { label: 'Match Confidence', value: `${((execMetadata.npi?.match_confidence || 0) * 100).toFixed(0)}%` },
            { label: 'Freshness', value: `${((execMetadata.npi?.freshness_score || 0) * 100).toFixed(0)}%` },
            { label: 'Execution Time', value: `${(execMetadata.npi?.execution_time_seconds || 0).toFixed(2)}s` }
          ] : [
            { label: 'Status', value: 'No Match' },
            { label: 'Action', value: 'Manual Review' }
          ],
          cornerBadge: isNpiFound ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-red-600" />,
          cornerBadgeBg: isNpiFound ? 'bg-emerald-200' : 'bg-red-200'
        }
      },
      
      // STAGE 2: ADDRESS VALIDATION
      {
        id: 'address',
        type: 'custom',
        position: { x: 350, y: 180 },
        data: {
          label: 'Address Validated',
          subLabel: 'STAGE 2: USPS VERIFY',
          icon: <MapPin size={20} />,
          status: 'active',
          nodeStyle: 'bg-blue-50 border-blue-500 shadow-xl',
          glowColor: 'bg-blue-400/60',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-700',
          labelColor: 'text-blue-900',
          subLabelColor: 'text-blue-600',
          handleColor: '#3b82f6',
          badge: final.address_validation?.verdict || 'Checked',
          badgeIcon: <MapPin size={11} />,
          badgeStyle: 'border-blue-300 bg-blue-100 text-blue-800',
          metric: execMetadata.address ? `${(execMetadata.address.execution_time_seconds || 0).toFixed(2)}s` : null,
          hoverBg: 'bg-blue-100',
          hoverLabelColor: 'text-blue-700',
          hoverValueColor: 'text-blue-900',
          hoverInfo: [
            { label: 'Confidence', value: `${((execMetadata.address?.confidence || 0) * 100).toFixed(0)}%` },
            { label: 'Verdict', value: execMetadata.address?.verdict || 'N/A' },
            { label: 'Execution Time', value: `${(execMetadata.address?.execution_time_seconds || 0).toFixed(2)}s` }
          ],
          cornerBadge: <CheckCircle2 size={14} className="text-blue-600" />,
          cornerBadgeBg: 'bg-blue-200'
        }
      },
      
      // STAGE 3: WEB ENRICHMENT
      {
        id: 'enrich',
        type: 'custom',
        position: { x: 650, y: 180 },
        data: {
          label: 'Web Intelligence',
          subLabel: 'STAGE 3: ENRICHMENT',
          icon: <Globe size={20} />,
          status: 'active',
          nodeStyle: 'bg-cyan-50 border-cyan-500 shadow-xl',
          glowColor: 'bg-cyan-400/60',
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-700',
          labelColor: 'text-cyan-900',
          subLabelColor: 'text-cyan-600',
          handleColor: '#06b6d4',
          badge: final.website ? 'Website Scraped' : 'No Website',
          badgeIcon: <Globe size={11} />,
          badgeStyle: 'border-cyan-300 bg-cyan-100 text-cyan-800',
          metric: execMetadata.enrichment ? `${(execMetadata.enrichment.execution_time_seconds || 0).toFixed(2)}s` : null,
          hoverBg: 'bg-cyan-100',
          hoverLabelColor: 'text-cyan-700',
          hoverValueColor: 'text-cyan-900',
          hoverInfo: [
            { label: 'Quality Score', value: `${((execMetadata.enrichment?.enrichment_score || 0) * 100).toFixed(0)}%` },
            { label: 'Items Extracted', value: execMetadata.enrichment?.items_extracted || 0 },
            { label: 'Execution Time', value: `${(execMetadata.enrichment?.execution_time_seconds || 0).toFixed(2)}s` }
          ],
          cornerBadge: <Award size={14} className="text-cyan-600" />,
          cornerBadgeBg: 'bg-cyan-200'
        }
      },
      
      // STAGE 4: QUALITY ASSURANCE
      {
        id: 'qa',
        type: 'custom',
        position: { x: 400, y: 360 },
        data: {
          label: isAutoHealed ? 'Auto-Healed ✨' : 'QA Verified',
          subLabel: 'STAGE 4: QUALITY CHECK',
          icon: isAutoHealed ? <Stethoscope size={20} /> : <ShieldCheck size={20} />,
          status: 'active',
          nodeStyle: 'bg-indigo-50 border-indigo-500 shadow-xl',
          glowColor: 'bg-indigo-400/60',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-700',
          labelColor: 'text-indigo-900',
          subLabelColor: 'text-indigo-600',
          handleColor: '#6366f1',
          badge: `${criticalCount}C • ${warningCount}W • ${infoCount}H`,
          badgeIcon: <AlertTriangle size={11} />,
          badgeStyle: 'border-indigo-300 bg-indigo-100 text-indigo-800',
          hoverBg: 'bg-indigo-100',
          hoverLabelColor: 'text-indigo-700',
          hoverValueColor: 'text-indigo-900',
          hoverInfo: [
            { label: 'Critical Flags', value: criticalCount },
            { label: 'Warnings', value: warningCount },
            { label: 'Auto-Healed', value: infoCount },
            { label: 'Risk Score', value: (qualityMetrics.risk_score || 0).toFixed(1) }
          ],
          cornerBadge: isAutoHealed ? <Sparkles size={14} className="text-indigo-600 animate-pulse" /> : <ShieldCheck size={14} className="text-indigo-600" />,
          cornerBadgeBg: 'bg-indigo-200'
        }
      },
      
      // STAGE 5: AI SYNTHESIS
      {
        id: 'synthesis',
        type: 'custom',
        position: { x: 400, y: 540 },
        data: {
          label: isFallback ? 'Fallback Mode ⚠' : 'AI Synthesis 🤖',
          subLabel: 'STAGE 5: DATA FUSION',
          icon: isFallback ? <AlertTriangle size={20} /> : <BrainCircuit size={20} />,
          status: 'active',
          nodeStyle: isFallback
            ? 'bg-orange-50 border-orange-500 shadow-xl'
            : 'bg-violet-50 border-violet-500 shadow-xl',
          glowColor: isFallback ? 'bg-orange-400/60' : 'bg-violet-400/60',
          iconBg: isFallback ? 'bg-orange-100' : 'bg-violet-100',
          iconColor: isFallback ? 'text-orange-700' : 'text-violet-700',
          labelColor: isFallback ? 'text-orange-900' : 'text-violet-900',
          subLabelColor: isFallback ? 'text-orange-600' : 'text-violet-600',
          handleColor: isFallback ? '#f97316' : '#8b5cf6',
          badge: isFallback ? 'Rule-Based' : 'LLM Powered',
          badgeIcon: isFallback ? <AlertTriangle size={11} /> : <BrainCircuit size={11} />,
          badgeStyle: isFallback 
            ? 'border-orange-300 bg-orange-100 text-orange-800' 
            : 'border-violet-300 bg-violet-100 text-violet-800',
          hoverBg: isFallback ? 'bg-orange-100' : 'bg-violet-100',
          hoverLabelColor: isFallback ? 'text-orange-700' : 'text-violet-700',
          hoverValueColor: isFallback ? 'text-orange-900' : 'text-violet-900',
          hoverInfo: [
            { label: 'Method', value: isFallback ? 'Fallback' : 'LLM' },
            { label: 'Model', value: isFallback ? 'Rules' : 'Llama 3.1' },
            { label: 'Sources Merged', value: '4' }
          ],
          cornerBadge: isFallback ? <AlertTriangle size={14} className="text-orange-600" /> : <BrainCircuit size={14} className="text-violet-600" />,
          cornerBadgeBg: isFallback ? 'bg-orange-200' : 'bg-violet-200'
        }
      },
      
      // STAGE 6: CONFIDENCE SCORING
      {
        id: 'scoring',
        type: 'custom',
        position: { x: 400, y: 720 },
        data: {
          label: `${confidenceTier} ${tierEmoji}`,
          subLabel: 'STAGE 6: CONFIDENCE',
          icon: <BarChart3 size={20} />,
          status: 'active',
          nodeStyle: isHighConfidence
            ? 'bg-teal-50 border-teal-500 shadow-xl'
            : 'bg-amber-50 border-amber-500 shadow-xl',
          glowColor: isHighConfidence ? 'bg-teal-400/70' : 'bg-amber-400/70',
          iconBg: isHighConfidence ? 'bg-teal-100' : 'bg-amber-100',
          iconColor: isHighConfidence ? 'text-teal-700' : 'text-amber-700',
          labelColor: isHighConfidence ? 'text-teal-900' : 'text-amber-900',
          subLabelColor: isHighConfidence ? 'text-teal-600' : 'text-amber-600',
          handleColor: isHighConfidence ? '#14b8a6' : '#f59e0b',
          badge: `${confidence.toFixed(1)}% Score`,
          badgeIcon: <TrendingUp size={11} />,
          badgeStyle: isHighConfidence 
            ? 'border-teal-300 bg-teal-100 text-teal-800' 
            : 'border-amber-300 bg-amber-100 text-amber-800',
          hoverBg: isHighConfidence ? 'bg-teal-100' : 'bg-amber-100',
          hoverLabelColor: isHighConfidence ? 'text-teal-700' : 'text-amber-700',
          hoverValueColor: isHighConfidence ? 'text-teal-900' : 'text-amber-900',
          hoverInfo: [
            { label: 'Identity', value: `${((scoreBreakdown.identity || 0) * 100).toFixed(0)}%` },
            { label: 'Address', value: `${((scoreBreakdown.address || 0) * 100).toFixed(0)}%` },
            { label: 'Completeness', value: `${((scoreBreakdown.completeness || 0) * 100).toFixed(0)}%` },
            { label: 'Freshness', value: `${((scoreBreakdown.freshness || 0) * 100).toFixed(0)}%` }
          ],
          cornerBadge: <BarChart3 size={14} className={isHighConfidence ? "text-teal-600" : "text-amber-600"} />,
          cornerBadgeBg: isHighConfidence ? 'bg-teal-200' : 'bg-amber-200'
        }
      },
      
      // FINAL OUTPUT
      {
        id: 'output',
        type: 'custom',
        position: { x: 400, y: 900 },
        data: {
          label: 'Gold Record ⭐',
          subLabel: 'FINAL OUTPUT',
          icon: <Database size={20} />,
          nodeStyle: isHighConfidence
            ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-500 shadow-2xl ring-2 ring-teal-300'
            : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-500 shadow-2xl ring-2 ring-amber-300',
          glowColor: isHighConfidence ? 'bg-teal-400/80' : 'bg-amber-400/80',
          iconBg: isHighConfidence ? 'bg-teal-100' : 'bg-amber-100',
          iconColor: isHighConfidence ? 'text-teal-700' : 'text-amber-700',
          labelColor: isHighConfidence ? 'text-teal-900' : 'text-amber-900',
          subLabelColor: isHighConfidence ? 'text-teal-600' : 'text-amber-600',
          handleColor: isHighConfidence ? '#14b8a6' : '#f59e0b',
          badge: final.provider_name || 'Verified Profile',
          badgeIcon: <Sparkles size={11} />,
          badgeStyle: isHighConfidence 
            ? 'border-teal-300 bg-teal-100 text-teal-800 font-bold' 
            : 'border-amber-300 bg-amber-100 text-amber-800 font-bold',
          metric: `${confidence.toFixed(0)}%`,
          hoverBg: isHighConfidence ? 'bg-teal-100' : 'bg-amber-100',
          hoverLabelColor: isHighConfidence ? 'text-teal-700' : 'text-amber-700',
          hoverValueColor: isHighConfidence ? 'text-teal-900' : 'text-amber-900',
          hoverInfo: [
            { label: 'NPI', value: final.npi || 'N/A' },
            { label: 'Specialty', value: final.specialty || 'N/A' },
            { label: 'Total Flags', value: flags.length },
            { label: 'Tier', value: confidenceTier }
          ],
          cornerBadge: <CheckCircle2 size={16} className={isHighConfidence ? "text-teal-600" : "text-amber-600"} />,
          cornerBadgeBg: isHighConfidence ? 'bg-teal-200' : 'bg-amber-200'
        }
      }
    ];

    const edges = [
      // Input to Stage 1, 2, 3
      { id: 'e1', source: 'input', target: 'npi', animated: true, style: { stroke: isNpiFound ? '#10b981' : '#ef4444', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: isNpiFound ? '#10b981' : '#ef4444' } },
      { id: 'e2', source: 'input', target: 'address', animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } },
      { id: 'e3', source: 'input', target: 'enrich', animated: true, style: { stroke: '#06b6d4', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' } },
      
      // Stage 1, 2, 3 to QA
      { id: 'e4', source: 'npi', target: 'qa', animated: true, style: { stroke: isNpiFound ? '#10b981' : '#ef4444', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: isNpiFound ? '#10b981' : '#ef4444' } },
      { id: 'e5', source: 'address', target: 'qa', animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } },
      { id: 'e6', source: 'enrich', target: 'qa', animated: true, style: { stroke: '#06b6d4', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' } },
      
      // QA to Synthesis
      { id: 'e7', source: 'qa', target: 'synthesis', animated: true, style: { stroke: '#6366f1', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' } },
      
      // Synthesis to Scoring
      { id: 'e8', source: 'synthesis', target: 'scoring', animated: true, style: { stroke: isFallback ? '#f97316' : '#8b5cf6', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: isFallback ? '#f97316' : '#8b5cf6' } },
      
      // Scoring to Output
      { id: 'e9', source: 'scoring', target: 'output', animated: true, style: { stroke: isHighConfidence ? '#14b8a6' : '#f59e0b', strokeWidth: 5 }, markerEnd: { type: MarkerType.ArrowClosed, color: isHighConfidence ? '#14b8a6' : '#f59e0b' } },
    ];

    return { nodes, edges };
  }, [provider]);

  return (
    <div className="relative h-[850px] w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-lg">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.4}
        maxZoom={1.2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
      >
        <Controls showInteractive={false} />
        <Background gap={32} size={1} color="rgba(100,116,139,0.1)" />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200">
        <div className="text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-wide">Pipeline Stages</div>
        <div className="flex gap-2 text-[9px] text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>NPI</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Address</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            <span>Enrich</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span>QA</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-violet-500"></div>
            <span>Synthesis</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            <span>Score</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineageGraph;