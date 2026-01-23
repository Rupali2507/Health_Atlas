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

/* =========================
   CUSTOM NODE (NO LOGIC CHANGE)
========================= */
const CustomNode = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative group px-5 py-4 min-w-[220px] rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${data.nodeStyle}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg ${data.glowColor}`} />

      {/* Top Handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !border-2 !border-white !shadow-md"
        style={{ background: data.handleColor || '#64748b' }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2.5 rounded-lg ${data.iconBg} ${data.iconColor}`}>
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

        {isHovered && data.hoverInfo && (
          <div className="mt-2.5 text-[10px] space-y-1">
            {data.hoverInfo.map((info, i) => (
              <div key={i} className={`flex justify-between px-2 py-1 rounded ${data.hoverBg}`}>
                <span className={data.hoverLabelColor}>{info.label}</span>
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
        className="!w-3 !h-3 !border-2 !border-white !shadow-md"
        style={{ background: data.handleColor || '#64748b' }}
      />

      {data.cornerBadge && (
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${data.cornerBadgeBg} flex items-center justify-center shadow-md`}>
          {data.cornerBadge}
        </div>
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

/* =========================
   MAIN GRAPH
========================= */
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

    const nodes = [
      {
        id: 'input',
        type: 'custom',
        position: { x: 300, y: 0 },
        data: {
          label: 'Raw CSV Input',
          subLabel: 'DATA SOURCE',
          icon: <FileText size={20} />,
          nodeStyle: 'bg-white border-slate-300 shadow-md',
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
          hoverValueColor: 'text-slate-900'
        }
      },
      {
        id: 'npi',
        type: 'custom',
        position: { x: 30, y: 200 },
        data: {
          label: isNpiFound ? 'NPI Verified' : 'NPI Failed',
          subLabel: 'REGISTRY',
          icon: isNpiFound ? <CheckCircle2 size={20} /> : <XCircle size={20} />,
          nodeStyle: isNpiFound
            ? 'bg-emerald-50 border-emerald-500 shadow-md'
            : 'bg-red-50 border-red-500 shadow-md',
          glowColor: isNpiFound ? 'bg-emerald-400/50' : 'bg-red-400/50',
          iconBg: isNpiFound ? 'bg-emerald-100' : 'bg-red-100',
          iconColor: isNpiFound ? 'text-emerald-700' : 'text-red-700',
          labelColor: isNpiFound ? 'text-emerald-900' : 'text-red-900',
          subLabelColor: isNpiFound ? 'text-emerald-600' : 'text-red-600',
          handleColor: isNpiFound ? '#10b981' : '#ef4444',
          badge: isNpiFound ? `NPI: ${final.npi}` : 'Invalid NPI',
          badgeStyle: isNpiFound
            ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
            : 'border-red-300 bg-red-100 text-red-800',
          hoverBg: isNpiFound ? 'bg-emerald-100' : 'bg-red-100',
          hoverLabelColor: isNpiFound ? 'text-emerald-700' : 'text-red-700',
          hoverValueColor: isNpiFound ? 'text-emerald-900' : 'text-red-900'
        }
      },
      {
        id: 'enrich',
        type: 'custom',
        position: { x: 570, y: 200 },
        data: {
          label: 'Web Intelligence',
          subLabel: 'ENRICHMENT',
          icon: <Globe size={20} />,
          nodeStyle: 'bg-blue-50 border-blue-500 shadow-md',
          glowColor: 'bg-blue-400/50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-700',
          labelColor: 'text-blue-900',
          subLabelColor: 'text-blue-600',
          handleColor: '#3b82f6',
          badge: final.website ? 'Website Found' : 'No Website',
          badgeStyle: 'border-blue-300 bg-blue-100 text-blue-800',
          hoverBg: 'bg-blue-100',
          hoverLabelColor: 'text-blue-700',
          hoverValueColor: 'text-blue-900'
        }
      },
      {
        id: 'synthesis',
        type: 'custom',
        position: { x: 300, y: 400 },
        data: {
          label: isFallback ? 'Fallback Mode' : 'AI Synthesis',
          subLabel: 'REASONING',
          icon: isFallback ? <AlertTriangle size={20} /> : <BrainCircuit size={20} />,
          nodeStyle: isFallback
            ? 'bg-orange-50 border-orange-500 shadow-md'
            : 'bg-violet-50 border-violet-500 shadow-md',
          glowColor: isFallback ? 'bg-orange-400/60' : 'bg-violet-400/60',
          iconBg: isFallback ? 'bg-orange-100' : 'bg-violet-100',
          iconColor: isFallback ? 'text-orange-700' : 'text-violet-700',
          labelColor: isFallback ? 'text-orange-900' : 'text-violet-900',
          subLabelColor: isFallback ? 'text-orange-600' : 'text-violet-600',
          handleColor: isFallback ? '#f97316' : '#8b5cf6',
          badge: isFallback ? 'Rule-Based' : 'LLM Active',
          badgeStyle: isFallback 
            ? 'border-orange-300 bg-orange-100 text-orange-800' 
            : 'border-violet-300 bg-violet-100 text-violet-800',
          hoverBg: isFallback ? 'bg-orange-100' : 'bg-violet-100',
          hoverLabelColor: isFallback ? 'text-orange-700' : 'text-violet-700',
          hoverValueColor: isFallback ? 'text-orange-900' : 'text-violet-900'
        }
      },
      {
        id: 'qa',
        type: 'custom',
        position: { x: 300, y: 600 },
        data: {
          label: isAutoHealed ? 'Auto-Healed' : 'QA Verified',
          subLabel: 'QUALITY CHECK',
          icon: isAutoHealed ? <Stethoscope size={20} /> : <ShieldCheck size={20} />,
          nodeStyle: 'bg-indigo-50 border-indigo-500 shadow-md',
          glowColor: 'bg-indigo-400/50',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-700',
          labelColor: 'text-indigo-900',
          subLabelColor: 'text-indigo-600',
          handleColor: '#6366f1',
          badge: `${flags.length} Flags`,
          badgeStyle: 'border-indigo-300 bg-indigo-100 text-indigo-800',
          hoverBg: 'bg-indigo-100',
          hoverLabelColor: 'text-indigo-700',
          hoverValueColor: 'text-indigo-900'
        }
      },
      {
        id: 'output',
        type: 'custom',
        position: { x: 300, y: 800 },
        data: {
          label: 'Gold Record',
          subLabel: 'FINAL OUTPUT',
          icon: <Database size={20} />,
          nodeStyle: isHighConfidence
            ? 'bg-teal-50 border-teal-500 shadow-lg'
            : 'bg-amber-50 border-amber-500 shadow-lg',
          glowColor: isHighConfidence ? 'bg-teal-400/70' : 'bg-amber-400/70',
          iconBg: isHighConfidence ? 'bg-teal-100' : 'bg-amber-100',
          iconColor: isHighConfidence ? 'text-teal-700' : 'text-amber-700',
          labelColor: isHighConfidence ? 'text-teal-900' : 'text-amber-900',
          subLabelColor: isHighConfidence ? 'text-teal-600' : 'text-amber-600',
          handleColor: isHighConfidence ? '#14b8a6' : '#f59e0b',
          badge: `${confidence.toFixed(0)}% Confidence`,
          badgeStyle: isHighConfidence 
            ? 'border-teal-300 bg-teal-100 text-teal-800' 
            : 'border-amber-300 bg-amber-100 text-amber-800',
          hoverBg: isHighConfidence ? 'bg-teal-100' : 'bg-amber-100',
          hoverLabelColor: isHighConfidence ? 'text-teal-700' : 'text-amber-700',
          hoverValueColor: isHighConfidence ? 'text-teal-900' : 'text-amber-900'
        }
      }
    ];

    const edges = [
      { id: 'e1', source: 'input', target: 'npi', style: { stroke: '#94a3b8', strokeWidth: 2 } },
      { id: 'e2', source: 'input', target: 'enrich', style: { stroke: '#94a3b8', strokeWidth: 2 } },
      { id: 'e3', source: 'npi', target: 'synthesis', style: { stroke: isNpiFound ? '#10b981' : '#ef4444', strokeWidth: 3 } },
      { id: 'e4', source: 'enrich', target: 'synthesis', style: { stroke: '#3b82f6', strokeWidth: 3 } },
      { id: 'e5', source: 'synthesis', target: 'qa', style: { stroke: isFallback ? '#f97316' : '#8b5cf6', strokeWidth: 3 } },
      { id: 'e6', source: 'qa', target: 'output', style: { stroke: isHighConfidence ? '#14b8a6' : '#f59e0b', strokeWidth: 3 } },
    ];

    return { nodes, edges };
  }, [provider]);

  return (
    <div className="relative h-[750px] w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-lg">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Controls showInteractive={false} />
        <Background gap={32} size={1} color="rgba(100,116,139,0.1)" />
      </ReactFlow>
    </div>
  );
};

export default LineageGraph;