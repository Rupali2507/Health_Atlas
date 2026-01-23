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
  Eye
} from 'lucide-react';

// --- ULTRA-ENHANCED NODE COMPONENT ---
const CustomNode = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative group px-5 py-4 min-w-[220px] rounded-2xl border-2 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${data.nodeStyle}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Animated Glowing Border Effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${data.glowColor}`}></div>
      
      {/* Pulse Animation Ring for Critical Nodes */}
      {data.critical && (
        <div className={`absolute inset-0 rounded-2xl ${data.pulseColor} animate-ping opacity-20`}></div>
      )}

      {/* Top Handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-4 !h-4 !border-3 !border-white dark:!border-slate-900 !shadow-lg"
        style={{ background: data.handleColor || '#94a3b8' }}
      />
      
      {/* Node Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`relative p-3 rounded-xl shadow-lg ${data.iconBg} ${data.iconColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
            {data.icon}
            {/* Icon Glow */}
            <div className={`absolute inset-0 rounded-xl ${data.glowColor} opacity-50 blur-md`}></div>
          </div>
          
          <div className="flex-1">
            <div className="text-[9px] font-black uppercase tracking-[0.15em] opacity-60 mb-1 flex items-center gap-1">
              {data.status === 'active' && <Activity size={10} className="animate-pulse" />}
              {data.subLabel}
            </div>
            <div className="text-base font-black tracking-tight leading-tight">
              {data.label}
            </div>
          </div>
          
          {/* Status Indicator */}
          {data.statusIcon && (
            <div className={`p-1.5 rounded-full ${data.statusBg}`}>
              {data.statusIcon}
            </div>
          )}
        </div>
        
        {/* Badge Section - Enhanced */}
        {data.badge && (
          <div className={`mt-3 text-[10px] py-2 px-3 rounded-lg font-semibold border-2 ${data.badgeStyle} transition-all duration-300 group-hover:shadow-md flex items-center gap-2`}>
            {data.badgeIcon && <span>{data.badgeIcon}</span>}
            <span className="flex-1">{data.badge}</span>
            {data.metric && (
              <span className="font-black text-xs">{data.metric}</span>
            )}
          </div>
        )}

        {/* Detailed Info on Hover */}
        {isHovered && data.hoverInfo && (
          <div className="mt-3 text-[10px] space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
            {data.hoverInfo.map((info, i) => (
              <div key={i} className="flex items-center justify-between py-1 px-2 rounded bg-black/5 dark:bg-white/5">
                <span className="opacity-60">{info.label}:</span>
                <span className="font-bold">{info.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-4 !h-4 !border-3 !border-white dark:!border-slate-900 !shadow-lg"
        style={{ background: data.handleColor || '#94a3b8' }}
      />
      
      {/* Corner Badge for Special States */}
      {data.cornerBadge && (
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${data.cornerBadgeBg} flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 animate-bounce`}>
          {data.cornerBadge}
        </div>
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const LineageGraph = ({ provider }) => {
  const { nodes, edges } = useMemo(() => {
    if (!provider) return { nodes: [], edges: [] };

    const initial = provider.original_data || {};
    const final = provider.final_profile || {};
    const flags = provider.qa_flags || [];
    const isNpiFound = final.npi_match_found !== false;
    const isAutoHealed = flags.some(f => f.includes("AUTO-HEALED"));
    const isFallback = final.synthesis_status === "fallback";
    const confidence = (provider.confidence_score || 0) * 100;
    const isHighConfidence = confidence >= 80;

    // --- ULTRA-ENHANCED NODES ---
    const newNodes = [
      {
        id: 'input', 
        type: 'custom', 
        position: { x: 300, y: 0 },
        data: {
          label: 'Raw CSV Input',
          subLabel: 'Data Source',
          status: 'active',
          icon: <FileText size={22} strokeWidth={2.5} />,
          nodeStyle: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-700 shadow-xl',
          glowColor: 'bg-slate-400',
          iconBg: 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800',
          iconColor: 'text-slate-700 dark:text-slate-300',
          handleColor: '#94a3b8',
          badge: initial.full_name || 'Provider Data',
          badgeIcon: <Eye size={12} />,
          badgeStyle: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300',
          hoverInfo: [
            { label: 'Fields', value: Object.keys(initial).length },
            { label: 'Format', value: 'CSV' }
          ]
        }
      },
      {
        id: 'npi', 
        type: 'custom', 
        position: { x: 30, y: 200 },
        data: {
          label: isNpiFound ? 'NPI Verified ✓' : 'NPI Failed ✗',
          subLabel: 'Registry Validation',
          status: 'active',
          icon: isNpiFound ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <XCircle size={22} strokeWidth={2.5} />,
          nodeStyle: isNpiFound 
            ? 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-950 border-emerald-400 dark:border-emerald-700 shadow-2xl shadow-emerald-500/30' 
            : 'bg-gradient-to-br from-red-50 via-red-100 to-red-50 dark:from-red-950 dark:via-red-900 dark:to-red-950 border-red-400 dark:border-red-700 shadow-2xl shadow-red-500/30',
          glowColor: isNpiFound ? 'bg-emerald-500' : 'bg-red-500',
          pulseColor: !isNpiFound ? 'bg-red-500' : '',
          critical: !isNpiFound,
          iconBg: isNpiFound ? 'bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-800 dark:to-emerald-700' : 'bg-gradient-to-br from-red-200 to-red-300 dark:from-red-800 dark:to-red-700',
          iconColor: isNpiFound ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300',
          handleColor: isNpiFound ? '#10b981' : '#ef4444',
          statusIcon: isNpiFound ? <Zap size={14} className="text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />,
          statusBg: isNpiFound ? 'bg-emerald-200/50 dark:bg-emerald-900/50' : 'bg-red-200/50 dark:bg-red-900/50',
          badge: isNpiFound ? `NPI: ${final.npi}` : 'Invalid NPI',
          badgeIcon: isNpiFound ? <CheckCircle2 size={12} /> : <XCircle size={12} />,
          metric: isNpiFound ? '100%' : '0%',
          badgeStyle: isNpiFound 
            ? 'bg-emerald-100/80 dark:bg-emerald-900/50 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200' 
            : 'bg-red-100/80 dark:bg-red-900/50 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200',
          cornerBadge: isNpiFound ? <CheckCircle2 size={12} className="text-white" /> : null,
          cornerBadgeBg: isNpiFound ? 'bg-emerald-500' : '',
          hoverInfo: [
            { label: 'Source', value: 'CMS Registry' },
            { label: 'Status', value: isNpiFound ? 'Active' : 'Not Found' }
          ]
        }
      },
      {
        id: 'enrich', 
        type: 'custom', 
        position: { x: 570, y: 200 },
        data: {
          label: 'Web Intelligence',
          subLabel: 'Data Enrichment',
          status: 'active',
          icon: <Globe size={22} strokeWidth={2.5} />,
          nodeStyle: 'bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 dark:from-blue-950 dark:via-blue-900 dark:to-cyan-950 border-blue-400 dark:border-blue-700 shadow-2xl shadow-blue-500/30',
          glowColor: 'bg-blue-500',
          iconBg: 'bg-gradient-to-br from-blue-200 to-cyan-300 dark:from-blue-800 dark:to-cyan-700',
          iconColor: 'text-blue-700 dark:text-blue-300',
          handleColor: '#3b82f6',
          statusIcon: <Activity size={14} className="text-blue-600 dark:text-blue-400 animate-pulse" />,
          statusBg: 'bg-blue-200/50 dark:bg-blue-900/50',
          badge: final.website ? 'Digital Footprint Found' : 'No Website',
          badgeIcon: <Globe size={12} />,
          metric: final.website ? '✓' : '✗',
          badgeStyle: 'bg-blue-100/80 dark:bg-blue-900/50 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200',
          hoverInfo: [
            { label: 'Method', value: 'Selenium' },
            { label: 'Data Points', value: '12+' }
          ]
        }
      },
      {
        id: 'synthesis', 
        type: 'custom', 
        position: { x: 300, y: 400 },
        data: {
          label: isFallback ? 'Fallback Mode' : 'AI Synthesis',
          subLabel: 'Reasoning Engine',
          status: 'active',
          icon: isFallback ? <AlertTriangle size={22} strokeWidth={2.5} /> : <BrainCircuit size={22} strokeWidth={2.5} />,
          nodeStyle: isFallback 
            ? 'bg-gradient-to-br from-orange-50 via-orange-100 to-amber-50 dark:from-orange-950 dark:via-orange-900 dark:to-amber-950 border-orange-400 dark:border-orange-700 shadow-2xl shadow-orange-500/30' 
            : 'bg-gradient-to-br from-violet-50 via-purple-100 to-violet-50 dark:from-violet-950 dark:via-purple-900 dark:to-violet-950 border-violet-400 dark:border-violet-700 shadow-2xl shadow-violet-500/30',
          glowColor: isFallback ? 'bg-orange-500' : 'bg-violet-500',
          pulseColor: isFallback ? 'bg-orange-500' : '',
          critical: isFallback,
          iconBg: isFallback 
            ? 'bg-gradient-to-br from-orange-200 to-amber-300 dark:from-orange-800 dark:to-amber-700' 
            : 'bg-gradient-to-br from-violet-200 to-purple-300 dark:from-violet-800 dark:to-purple-700',
          iconColor: isFallback ? 'text-orange-700 dark:text-orange-300' : 'text-violet-700 dark:text-violet-300',
          handleColor: isFallback ? '#f97316' : '#8b5cf6',
          statusIcon: isFallback 
            ? <AlertTriangle size={14} className="text-orange-600 dark:text-orange-400" /> 
            : <BrainCircuit size={14} className="text-violet-600 dark:text-violet-400 animate-pulse" />,
          statusBg: isFallback ? 'bg-orange-200/50 dark:bg-orange-900/50' : 'bg-violet-200/50 dark:bg-violet-900/50',
          badge: isFallback ? 'Rule-Based Logic' : 'Llama 3.1 70B',
          badgeIcon: isFallback ? <ShieldCheck size={12} /> : <Sparkles size={12} className="animate-pulse" />,
          badgeStyle: isFallback 
            ? 'bg-orange-100/80 dark:bg-orange-900/50 border-orange-400 dark:border-orange-600 text-orange-800 dark:text-orange-200' 
            : 'bg-violet-100/80 dark:bg-violet-900/50 border-violet-400 dark:border-violet-600 text-violet-800 dark:text-violet-200',
          hoverInfo: [
            { label: 'Model', value: isFallback ? 'Deterministic' : 'Groq LLM' },
            { label: 'Tokens', value: isFallback ? 'N/A' : '~2.5K' }
          ]
        }
      },
      {
        id: 'qa', 
        type: 'custom', 
        position: { x: 300, y: 600 },
        data: {
          label: isAutoHealed ? 'Auto-Healed ⚡' : 'QA Verified',
          subLabel: 'Quality Assurance',
          status: 'active',
          icon: isAutoHealed ? <Stethoscope size={22} strokeWidth={2.5} /> : <ShieldCheck size={22} strokeWidth={2.5} />,
          nodeStyle: isAutoHealed 
            ? 'bg-gradient-to-br from-indigo-50 via-indigo-100 to-blue-50 dark:from-indigo-950 dark:via-indigo-900 dark:to-blue-950 border-indigo-400 dark:border-indigo-700 shadow-2xl shadow-indigo-500/30' 
            : 'bg-gradient-to-br from-gray-50 via-gray-100 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 border-gray-400 dark:border-gray-700 shadow-2xl shadow-gray-500/30',
          glowColor: isAutoHealed ? 'bg-indigo-500' : 'bg-gray-500',
          iconBg: isAutoHealed 
            ? 'bg-gradient-to-br from-indigo-200 to-blue-300 dark:from-indigo-800 dark:to-blue-700' 
            : 'bg-gradient-to-br from-gray-200 to-slate-300 dark:from-gray-700 dark:to-slate-700',
          iconColor: isAutoHealed ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300',
          handleColor: isAutoHealed ? '#6366f1' : '#6b7280',
          statusIcon: isAutoHealed 
            ? <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse" /> 
            : <ShieldCheck size={14} className="text-gray-600 dark:text-gray-400" />,
          statusBg: isAutoHealed ? 'bg-indigo-200/50 dark:bg-indigo-900/50' : 'bg-gray-200/50 dark:bg-gray-800/50',
          badge: isAutoHealed ? '⚡ Errors Corrected' : `${flags.length} Flags`,
          badgeIcon: isAutoHealed ? <Zap size={12} /> : <AlertTriangle size={12} />,
          metric: isAutoHealed ? flags.filter(f => f.includes('AUTO-HEALED')).length : flags.length,
          badgeStyle: isAutoHealed 
            ? 'bg-indigo-100/80 dark:bg-indigo-900/50 border-indigo-400 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200' 
            : 'bg-gray-100/80 dark:bg-gray-800/50 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-200',
          cornerBadge: isAutoHealed ? <Sparkles size={12} className="text-white" /> : null,
          cornerBadgeBg: isAutoHealed ? 'bg-indigo-500' : '',
          hoverInfo: [
            { label: 'Checks', value: '15+' },
            { label: 'Auto-Fixes', value: isAutoHealed ? 'Yes' : 'No' }
          ]
        }
      },
      {
        id: 'output', 
        type: 'custom', 
        position: { x: 300, y: 800 },
        data: {
          label: 'Gold Record',
          subLabel: 'Final Output',
          status: 'active',
          icon: <Database size={22} strokeWidth={2.5} />,
          nodeStyle: isHighConfidence
            ? 'bg-gradient-to-br from-teal-50 via-emerald-100 to-teal-50 dark:from-teal-950 dark:via-emerald-900 dark:to-teal-950 border-teal-400 dark:border-teal-700 shadow-2xl shadow-teal-500/40'
            : 'bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-50 dark:from-amber-950 dark:via-yellow-900 dark:to-amber-950 border-amber-400 dark:border-amber-700 shadow-2xl shadow-amber-500/40',
          glowColor: isHighConfidence ? 'bg-teal-500' : 'bg-amber-500',
          iconBg: isHighConfidence
            ? 'bg-gradient-to-br from-teal-200 to-emerald-300 dark:from-teal-800 dark:to-emerald-700'
            : 'bg-gradient-to-br from-amber-200 to-yellow-300 dark:from-amber-800 dark:to-yellow-700',
          iconColor: isHighConfidence ? 'text-teal-700 dark:text-teal-300' : 'text-amber-700 dark:text-amber-300',
          handleColor: isHighConfidence ? '#14b8a6' : '#f59e0b',
          statusIcon: isHighConfidence 
            ? <CheckCircle2 size={14} className="text-teal-600 dark:text-teal-400" /> 
            : <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />,
          statusBg: isHighConfidence ? 'bg-teal-200/50 dark:bg-teal-900/50' : 'bg-amber-200/50 dark:bg-amber-900/50',
          badge: isHighConfidence ? 'High Confidence' : 'Needs Review',
          badgeIcon: isHighConfidence ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />,
          metric: `${confidence.toFixed(0)}%`,
          badgeStyle: isHighConfidence
            ? 'bg-teal-100/80 dark:bg-teal-900/50 border-teal-400 dark:border-teal-600 text-teal-800 dark:text-teal-200'
            : 'bg-amber-100/80 dark:bg-amber-900/50 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200',
          cornerBadge: isHighConfidence ? <CheckCircle2 size={12} className="text-white" /> : null,
          cornerBadgeBg: isHighConfidence ? 'bg-teal-500' : '',
          hoverInfo: [
            { label: 'Confidence', value: `${confidence.toFixed(1)}%` },
            { label: 'Status', value: isHighConfidence ? 'Validated' : 'Flagged' }
          ]
        }
      }
    ];

    // --- ENHANCED EDGES WITH DYNAMIC STYLING ---
    const newEdges = [
      { 
        id: 'e1', 
        source: 'input', 
        target: 'npi', 
        animated: true, 
        style: { stroke: '#cbd5e1', strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1', width: 20, height: 20 }
      },
      { 
        id: 'e2', 
        source: 'input', 
        target: 'enrich', 
        animated: true, 
        style: { stroke: '#cbd5e1', strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1', width: 20, height: 20 }
      },
      { 
        id: 'e3', 
        source: 'npi', 
        target: 'synthesis', 
        animated: true, 
        style: { 
          stroke: isNpiFound ? '#10b981' : '#ef4444', 
          strokeWidth: 3.5,
          strokeDasharray: isNpiFound ? 0 : '10 5'
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: isNpiFound ? '#10b981' : '#ef4444', 
          width: 25, 
          height: 25 
        }
      },
      { 
        id: 'e4', 
        source: 'enrich', 
        target: 'synthesis', 
        animated: true, 
        style: { stroke: '#3b82f6', strokeWidth: 3.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6', width: 25, height: 25 }
      },
      { 
        id: 'e5', 
        source: 'synthesis', 
        target: 'qa', 
        animated: true, 
        style: { 
          stroke: isFallback ? '#f97316' : '#8b5cf6', 
          strokeWidth: 3.5,
          strokeDasharray: isFallback ? '10 5' : 0
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: isFallback ? '#f97316' : '#8b5cf6', 
          width: 25, 
          height: 25 
        }
      },
      { 
        id: 'e6', 
        source: 'qa', 
        target: 'output', 
        animated: true, 
        style: { 
          stroke: isAutoHealed ? '#6366f1' : (isHighConfidence ? '#14b8a6' : '#f59e0b'), 
          strokeWidth: isAutoHealed ? 4 : 3.5 
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: isAutoHealed ? '#6366f1' : (isHighConfidence ? '#14b8a6' : '#f59e0b'), 
          width: 28, 
          height: 28 
        }
      },
    ];

    return { nodes: newNodes, edges: newEdges };
  }, [provider]);

  return (
    <div className="relative h-[750px] w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px] opacity-40 dark:opacity-20"></div>
      
      {/* Corner Decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-500/10 to-cyan-500/10 dark:from-teal-500/20 dark:to-cyan-500/20 blur-3xl rounded-full"></div>
      
      {/* Legend Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Pipeline Status
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm animate-pulse"></div>
            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Auto-Healed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Failed/Fallback</span>
          </div>
        </div>
      </div>

      {/* ReactFlow */}
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes} 
        fitView 
        attributionPosition="bottom-right"
        className="relative z-10"
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Controls 
          showInteractive={false} 
          className="!bg-white/90 dark:!bg-slate-900/90 !backdrop-blur-xl !border-slate-200 dark:!border-slate-700 !shadow-xl !m-4 !rounded-xl"
        />
        <Background gap={20} size={1} color="#94a3b8" variant="dots" className="opacity-20" />
      </ReactFlow>
    </div>
  );
};

export default LineageGraph;