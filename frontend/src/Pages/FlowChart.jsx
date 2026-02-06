import React from "react";

/* ----------------- DESIGN SYSTEM COMPONENTS ----------------- */

// 1. Elevated Badge with distinct definition
const Badge = ({ children }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/80 border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-slate-600 hover:scale-105 transition-transform cursor-default">
    {children}
  </span>
);

// 2. Ultra-Premium Node Card
const Node = ({ title, subtitle, accent = "gray" }) => {
  const styles = {
    blue:   { border: "border-blue-100",   bg: "bg-blue-50/30",   text: "text-blue-900",   glow: "group-hover:shadow-blue-500/10",   line: "bg-blue-500" },
    green:  { border: "border-emerald-100", bg: "bg-emerald-50/30", text: "text-emerald-900", glow: "group-hover:shadow-emerald-500/10", line: "bg-emerald-500" },
    red:    { border: "border-rose-100",    bg: "bg-rose-50/30",    text: "text-rose-900",    glow: "group-hover:shadow-rose-500/10",    line: "bg-rose-500" },
    amber:  { border: "border-amber-100",   bg: "bg-amber-50/30",   text: "text-amber-900",   glow: "group-hover:shadow-amber-500/10",   line: "bg-amber-500" },
    purple: { border: "border-purple-100",  bg: "bg-purple-50/30",  text: "text-purple-900",  glow: "group-hover:shadow-purple-500/10",  line: "bg-purple-500" },
    cyan:   { border: "border-cyan-100",    bg: "bg-cyan-50/30",    text: "text-cyan-900",    glow: "group-hover:shadow-cyan-500/10",    line: "bg-cyan-500" },
    gray:   { border: "border-slate-200",   bg: "bg-slate-50/50",   text: "text-slate-800",   glow: "group-hover:shadow-slate-500/10",   line: "bg-slate-400" },
  };

  const activeStyle = styles[accent];

  return (
    <div className={`group relative overflow-hidden backdrop-blur-xl rounded-2xl p-5 border transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-xl ${activeStyle.border} ${activeStyle.bg} ${activeStyle.glow}`}>
      {/* Accent Line Indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity ${activeStyle.line}`} />
      
      <div className="relative z-10 pl-2">
        <div className={`font-bold text-[15px] mb-1.5 tracking-tight ${activeStyle.text}`}>{title}</div>
        <div className="text-xs text-slate-500 font-medium leading-relaxed group-hover:text-slate-700 transition-colors">
          {subtitle}
        </div>
      </div>
      
      {/* Subtle Gradient Blob on Hover */}
      <div className="absolute -right-10 -top-10 w-20 h-20 bg-gradient-to-br from-current to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};

// 3. Glassmorphic Section Container
const Section = ({ step, title, children, color = "slate" }) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-white/40 rounded-[2.5rem] -z-10 translate-y-2 scale-[0.98] opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
    <div className="relative bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 transition-all hover:border-white/80">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold shadow-lg shadow-indigo-500/20">
          {step}
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
          {title}
        </h2>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-slate-200 via-slate-100 to-transparent ml-4" />
      </div>
      {children}
    </div>
  </div>
);

// 4. Animated Connector
const Connector = () => (
  <div className="flex justify-center -my-3 relative z-0">
    <div className="h-20 w-[1px] bg-gradient-to-b from-slate-200 via-indigo-200 to-slate-200">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse" />
    </div>
  </div>
);

/* ----------------- MAIN ARCHITECTURE ----------------- */

export default function FlowChart() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden pb-32">
      
      {/* Background Ambience (Fixed) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-100/30 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-purple-100/30 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-24 relative z-10">

        {/* HEADER */}
        <header className="text-center mb-24">
          <div className="inline-block mb-6">
            <span className="px-4 py-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 text-indigo-600 text-[11px] font-bold uppercase tracking-[0.2em] shadow-sm">
              System Architecture 
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-[1.1]">
            Agentic Provider <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500">
              Validation Architecture
            </span>
          </h1>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge>VLM-Powered</Badge>
            <Badge>Authority Weighted</Badge>
            <Badge>Fraud Aware</Badge>
            <Badge>HITL Enabled</Badge>
            <Badge>PostgreSQL Backed</Badge>
          </div>

          <p className="max-w-2xl mx-auto text-xs font-mono text-slate-400 bg-white/50 backdrop-blur rounded-lg py-2 px-4 border border-slate-100 inline-block">
            Authority Levels: 100 State Board • 90 NPPES • 85 OIG • 70 Address • 60 Website • 40 Upload
          </p>
        </header>

        {/* --- FLOW START --- */}

        {/* STAGE 0 */}
        <Section step="00" title="Data Source & Input Authority Layer">
          <div className="grid md:grid-cols-3 gap-6">
            <Node title="CSV Upload" subtitle="Structured • Authority 40 (Lowest)" accent="gray" />
            <Node title="PDF / Scanned Docs" subtitle="Unstructured → Requires VLM Extraction" accent="purple" />
            <Node title="JPG / PNG Images" subtitle="OCR + Vision Parsing Required" accent="purple" />
          </div>
          <div className="mt-6 flex justify-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
              Initial Trust Baseline: Authority 40
            </span>
          </div>
        </Section>

        <Connector />

        {/* STAGE 01 - VLM */}
        <Section step="01" title="Vision Intelligence Layer (Stage 0)">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Node title="Gemini Flash 2.0" subtitle="Primary VLM • 3–5s/page" accent="purple" />
            <Node title="GPT-4o-mini" subtitle="Fallback Model" accent="purple" />
            <Node title="pdf2image" subtitle="300 DPI Conversion" accent="purple" />
            <Node title="Schema Normalization" subtitle="NPI Format + Field Structuring" accent="green" />
          </div>
          <div className="mt-6 text-center text-xs font-medium text-slate-500">
            Output → Structured Provider Profile (Still Authority 40)
          </div>
        </Section>

        <Connector />

        {/* ORCHESTRATOR - HERO */}
        <div className="relative my-16 group perspective-1000">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
          <div className="relative bg-[#0F172A] rounded-[2rem] p-10 md:p-14 text-center border border-white/10 shadow-2xl overflow-hidden">
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-amber-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Central DAG Engine
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">LangGraph Orchestrator</h2>
              <div className="inline-block bg-white/5 border border-white/10 rounded-xl px-6 py-3">
                <p className="text-sm font-mono text-amber-100/90 tracking-wide">
                  Parallel Fan-Out → Merge → QA → Arbitration → Confidence → HITL Routing
                </p>
              </div>
            </div>
          </div>
        </div>

        <Connector />

        {/* STAGE 02 - VALIDATION */}
        <Section step="02" title="Data Validation Agent (Primary Sources)">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Node title="NPPES API" subtitle="Match Confidence + Taxonomy + Freshness • Auth 90" accent="blue" />
            <Node title="OIG LEIE" subtitle="Federal Exclusion Screening • Auth 85" accent="red" />
            <Node title="State Medical Board" subtitle="License + Disciplinary History • Auth 100" accent="green" />
            <Node title="USPS + Geo" subtitle="Address Validation + Facility Detection • Auth 70" accent="cyan" />
          </div>
        </Section>

        <Connector />

        {/* STAGE 02B - ENRICHMENT */}
        <Section step="02B" title="Information Enrichment Agent">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Node title="Website Scraper" subtitle="Credential Extraction • Auth 60" accent="purple" />
            <Node title="Google Scholar" subtitle="Recent Publications ≥ 2024" accent="purple" />
            <Node title="Web Presence Scan" subtitle="Digital Footprint Score ∈ [0,1]" accent="purple" />
            <Node title="LLM Extraction" subtitle="Education • Certifications • Insurance" accent="purple" />
          </div>
        </Section>

        <Connector />

        {/* STAGE 03 - QA */}
        <Section step="03" title="Surgical QA & Fraud Detection (8 Checks)">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Node title="OIG Exclusion" subtitle="Hard Blocker" accent="red" />
            <Node title="License Suspension" subtitle="Critical Risk" accent="red" />
            <Node title="Geo-Fraud Detection" subtitle="Residential / Shared Practice" accent="amber" />
            <Node title="Cross-Field Conflict" subtitle="CSV vs Registry Mismatch" accent="blue" />
            <Node title="State Alignment" subtitle="License vs Practice State" accent="amber" />
            <Node title="Digital Footprint Check" subtitle="Zombie Detection" accent="purple" />
            <Node title="Freshness Decay" subtitle="<30d=1.0 • <90d=0.5 • Decay" accent="gray" />
            <Node title="Address Auto-Healing" subtitle="Reconciliation via NPPES" accent="green" />
          </div>
          <div className="mt-8 flex justify-center">
            <div className="bg-amber-50/80 backdrop-blur border border-amber-200/60 px-6 py-3 rounded-xl text-xs font-mono font-bold text-amber-800 shadow-sm">
              Risk Score = (CRITICAL × 10) + (WARNING × 3) + (Fraud × 5)
            </div>
          </div>
        </Section>

        <Connector />

        {/* STAGE 04 - ARBITRATION */}
        <Section step="04" title="AI Arbitration & Golden Record Synthesis">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
              <h3 className="font-bold text-indigo-900 mb-2">Authority Hierarchy</h3>
              <p className="text-sm font-mono text-indigo-700">100 &gt; 90 &gt; 85 &gt; 70 &gt; 60 &gt; 40</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <h3 className="font-bold text-emerald-900 mb-2">Golden Record Builder</h3>
              <p className="text-sm text-emerald-700">Single Trusted Profile + Provenance Map</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <code className="text-[10px] md:text-xs text-slate-500 break-all">
              Fields: provider_name • npi • specialty • address • license_status • oig_status • digital_footprint_score • data_sources
            </code>
          </div>
        </Section>

        <Connector />

        {/* STAGE 05 - CONFIDENCE */}
        <Section step="05" title="Weighted Confidence Scoring Engine">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {[
               {t: "Primary Sources", v: "35%", c: "text-indigo-600"},
               {t: "Address", v: "20%", c: "text-blue-600"},
               {t: "Footprint", v: "15%", c: "text-purple-600"},
               {t: "Completeness", v: "15%", c: "text-cyan-600"},
               {t: "Freshness", v: "10%", c: "text-emerald-600"},
               {t: "Fraud Buffer", v: "5% Cap", c: "text-rose-600"},
             ].map((item, i) => (
                <div key={i} className="bg-white/80 p-4 rounded-xl border border-slate-100 text-center shadow-sm">
                   <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{item.t}</div>
                   <div className={`text-xl font-black ${item.c}`}>{item.v}</div>
                </div>
             ))}
          </div>
          <div className="mt-6 text-center text-xs font-mono text-slate-500">
            Final Score ∈ [0,1] → Tier Classification → HITL Router
          </div>
        </Section>

        <Connector />

        {/* STAGE 06 - ROUTING */}
        <div className="bg-white rounded-[3rem] p-3 shadow-2xl ring-1 ring-slate-900/5 mb-8">
           <div className="bg-slate-50/50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100">
             <div className="text-center mb-10">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Step 06</span>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">HITL Routing Decision Engine</h2>
             </div>
             
             <div className="grid md:grid-cols-3 gap-6">
                {/* Platinum */}
                <div className="group bg-gradient-to-b from-emerald-50 to-white border border-emerald-100 p-8 rounded-[2rem] text-center hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
                   <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🟢</div>
                   <div className="text-emerald-900 font-black text-xl mb-1">PLATINUM</div>
                   <div className="text-[11px] font-bold tracking-widest text-emerald-600/60 uppercase mb-4">≥ 0.90</div>
                   <div className="text-sm font-medium text-emerald-800">Auto Commit → validated_providers</div>
                </div>

                {/* Gold */}
                <div className="bg-gradient-to-b from-amber-50 to-white border border-amber-100 p-8 rounded-[2rem] text-center">
                   <div className="text-4xl mb-4">🟡</div>
                   <div className="text-amber-900 font-black text-xl mb-1">GOLD</div>
                   <div className="text-[11px] font-bold tracking-widest text-amber-600/60 uppercase mb-4">≥ 0.65</div>
                   <div className="text-sm font-medium text-amber-800">Auto + Monitoring</div>
                </div>

                {/* Red */}
                <div className="bg-gradient-to-b from-rose-50 to-white border border-rose-100 p-8 rounded-[2rem] text-center">
                   <div className="text-4xl mb-4">🔴</div>
                   <div className="text-rose-900 font-black text-xl mb-1">RED</div>
                   <div className="text-[11px] font-bold tracking-widest text-rose-600/60 uppercase mb-4">&lt; 0.65</div>
                   <div className="text-sm font-medium text-rose-800">Human Review → review_queue</div>
                </div>
             </div>
           </div>
        </div>

        <Connector />

        {/* STAGE 07 - DB */}
        <Section step="07" title="PostgreSQL Persistence Layer">
          <div className="grid md:grid-cols-2 gap-6">
            <Node title="validated_providers" subtitle="Approved Entries + Confidence Metadata" accent="green" />
            <Node title="review_queue" subtitle="HITL Cases + Execution Snapshot" accent="amber" />
          </div>
          <div className="mt-6 text-center text-xs font-mono text-slate-500 bg-slate-100/50 py-2 rounded-lg">
            All decisions stored with execution_metadata + audit trail
          </div>
        </Section>

        {/* FOOTER */}
        <div className="mt-20 text-center opacity-40">
           <div className="w-16 h-1 bg-slate-300 mx-auto rounded-full mb-4" />
           <div className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
             End of DAG Execution
           </div>
        </div>

      </div>
    </div>
  );
}