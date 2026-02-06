import React from "react";
import Sidebar from "../Components/Sidebar";
import Navbar_III from "../Components/Navbar_III";
import { useHealthContext } from "../Context/HealthContext";

/* ----------------- DESIGN SYSTEM COMPONENTS ----------------- */

const Badge = ({ children }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/80 border border-slate-200 shadow-sm text-slate-600">
    {children}
  </span>
);

const Node = ({ title, subtitle, accent = "gray" }) => {
  const styles = {
    blue: "border-blue-100 bg-blue-50/40 text-blue-900",
    green: "border-emerald-100 bg-emerald-50/40 text-emerald-900",
    red: "border-rose-100 bg-rose-50/40 text-rose-900",
    amber: "border-amber-100 bg-amber-50/40 text-amber-900",
    purple: "border-purple-100 bg-purple-50/40 text-purple-900",
    cyan: "border-cyan-100 bg-cyan-50/40 text-cyan-900",
    gray: "border-slate-200 bg-slate-50 text-slate-800",
  };

  return (
    <div className={`rounded-2xl p-5 border transition-all hover:-translate-y-1 hover:shadow-lg ${styles[accent]}`}>
      <div className="font-bold text-[15px] mb-2 tracking-tight">{title}</div>
      <div className="text-xs text-slate-600 leading-relaxed">{subtitle}</div>
    </div>
  );
};

const Section = ({ step, title, children }) => (
  <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-sm mb-10">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-xs font-bold">
        {step}
      </div>
      <h2 className="text-xl md:text-2xl font-black tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent ml-4" />
    </div>
    {children}
  </div>
);

const Connector = () => (
  <div className="flex justify-center my-6">
    <div className="h-16 w-px bg-gradient-to-b from-slate-200 via-indigo-200 to-slate-200 relative">
      <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 rounded-full animate-pulse" />
    </div>
  </div>
);

/* ----------------- MAIN COMPONENT ----------------- */

export default function FlowChart() {
  const { Dark } = useHealthContext();

  const bgMain = Dark
    ? "bg-gray-900 text-white"
    : "bg-[#f8fafc] text-slate-900";

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      
      <Sidebar />

      <div className="flex-1 lg:ml-[20vw]">
        <Navbar_III />

        <div className="px-6 pt-24 pb-32">
          <div className="max-w-7xl mx-auto">

            {/* HEADER */}
            <header className="text-center mb-20">
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                Agentic Provider <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500">
                  Validation Architecture
                </span>
              </h1>

              <div className="flex flex-wrap justify-center gap-3">
                <Badge>VLM-Powered</Badge>
                <Badge>Authority Weighted</Badge>
                <Badge>Fraud Aware</Badge>
                <Badge>HITL Enabled</Badge>
                <Badge>PostgreSQL Backed</Badge>
              </div>

              <p className="mt-6 text-xs font-mono text-slate-500">
                Authority: 100 State Board • 90 NPPES • 85 OIG • 70 Address • 60 Website • 40 Upload
              </p>
            </header>

            {/* STAGE 00 */}
            <Section step="00" title="Data Source & Input Authority Layer">
              <div className="grid md:grid-cols-3 gap-6">
                <Node title="CSV Upload" subtitle="Structured • Authority 40 (Lowest)" />
                <Node title="PDF / Scanned Docs" subtitle="Unstructured → Requires VLM Extraction" accent="purple" />
                <Node title="JPG / PNG Images" subtitle="OCR + Vision Parsing Required" accent="purple" />
              </div>
              <div className="mt-6 text-center text-xs font-bold text-slate-400">
                Initial Trust Baseline: Authority 40
              </div>
            </Section>

            <Connector />

            {/* STAGE 01 */}
            <Section step="01" title="Vision Intelligence Layer (Stage 0)">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Node title="Gemini Flash 2.0" subtitle="Primary VLM • 3–5s per page" accent="purple" />
                <Node title="GPT-4o-mini" subtitle="Fallback Model" accent="purple" />
                <Node title="pdf2image" subtitle="300 DPI Conversion" accent="purple" />
                <Node title="Schema Normalization" subtitle="NPI Format + Structuring" accent="green" />
              </div>
              <div className="mt-6 text-center text-xs text-slate-500">
                Output → Structured Provider Profile (Authority 40)
              </div>
            </Section>

            <Connector />

            {/* ORCHESTRATOR */}
            <Section step="DAG" title="LangGraph Orchestrator (Central DAG Engine)">
              <div className="text-center font-mono text-sm">
                Parallel Fan-Out → Merge → QA → Arbitration → Confidence → HITL Routing
              </div>
            </Section>

            <Connector />

            {/* VALIDATION AGENT */}
            <Section step="02" title="Data Validation Agent (Primary Sources)">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Node title="NPPES API" subtitle="Match + Taxonomy + Freshness • Auth 90" accent="blue" />
                <Node title="OIG LEIE" subtitle="Federal Exclusion Screening • Auth 85" accent="red" />
                <Node title="State Board" subtitle="License + Disciplinary • Auth 100" accent="green" />
                <Node title="USPS + Geo" subtitle="Address Validation • Auth 70" accent="cyan" />
              </div>
            </Section>

            <Connector />

            {/* ENRICHMENT AGENT */}
            <Section step="02B" title="Information Enrichment Agent">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Node title="Website Scraper" subtitle="Credential Extraction • Auth 60" accent="purple" />
                <Node title="Google Scholar" subtitle="Recent Publications ≥ 2024" accent="purple" />
                <Node title="Web Presence Scan" subtitle="Digital Footprint Score ∈ [0,1]" accent="purple" />
                <Node title="LLM Extraction" subtitle="Education • Certifications" accent="purple" />
              </div>
            </Section>

            <Connector />

            {/* QUALITY ASSURANCE AGENT (ADDED LABEL ONLY) */}
            <Section step="03" title="Quality Assurance Agent (Surgical QA & Fraud Detection)">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Node title="OIG Exclusion" subtitle="Hard Blocker" accent="red" />
                <Node title="License Suspension" subtitle="Critical Risk" accent="red" />
                <Node title="Geo-Fraud Detection" subtitle="Residential / Shared Practice" accent="amber" />
                <Node title="Cross-Field Conflict" subtitle="CSV vs Registry Mismatch" accent="blue" />
                <Node title="State Alignment" subtitle="License vs Practice State" accent="amber" />
                <Node title="Digital Footprint" subtitle="Zombie Detection" accent="purple" />
                <Node title="Freshness Decay" subtitle="<30d=1.0 • <90d=0.5" accent="gray" />
                <Node title="Address Auto-Healing" subtitle="Reconciliation via NPPES" accent="green" />
              </div>
              <div className="mt-6 text-center text-xs font-mono text-amber-700">
                Risk Score = (CRITICAL × 10) + (WARNING × 3) + (Fraud × 5)
              </div>
            </Section>

            <Connector />

            {/* ARBITRATION */}
            <Section step="04" title="AI Arbitration & Golden Record Synthesis">
              <div className="grid md:grid-cols-2 gap-6">
                <Node title="Authority Hierarchy" subtitle="100 > 90 > 85 > 70 > 60 > 40" accent="purple" />
                <Node title="Golden Record Builder" subtitle="Single Trusted Profile + Provenance" accent="green" />
              </div>
            </Section>

            <Connector />

            {/* CONFIDENCE */}
            <Section step="05" title="Weighted Confidence Scoring Engine">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Node title="Primary Sources" subtitle="35%" accent="blue" />
                <Node title="Address" subtitle="20%" accent="cyan" />
                <Node title="Footprint" subtitle="15%" accent="purple" />
                <Node title="Completeness" subtitle="15%" accent="green" />
                <Node title="Freshness" subtitle="10%" accent="green" />
                <Node title="Fraud Buffer" subtitle="5% Cap" accent="red" />
              </div>
              <div className="mt-6 text-center text-xs font-mono">
                Final Score ∈ [0,1] → Tier Classification → HITL Router
              </div>
            </Section>

            <Connector />

            {/* DIRECTORY MANAGEMENT AGENT (ADDED HERE) */}
            <Section step="06" title="Directory Management Agent (Routing + Output + Workflow)">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <Node title="PLATINUM ≥ 0.82" subtitle="Auto Commit → validated_providers" accent="green" />
                <Node title="GOLD ≥ 0.65" subtitle="Auto + Monitoring" accent="amber" />
                <Node title="RED < 0.65" subtitle="Human Review → review_queue" accent="red" />
                <Node title="Directory Output Engine" subtitle="Web • Mobile • PDF Generation" accent="cyan" />
                <Node title="Alert & Reporting Engine" subtitle="Validation Reports + Actionable Insights" accent="purple" />
                <Node title="Workflow Queue Manager" subtitle="Prioritized HITL Review Tasks" accent="gray" />
              </div>
            </Section>

            <Connector />

            {/* DATABASE */}
            <Section step="07" title="PostgreSQL Persistence Layer">
              <div className="grid md:grid-cols-2 gap-6">
                <Node title="validated_providers" subtitle="Approved Entries + Confidence Metadata" accent="green" />
                <Node title="review_queue" subtitle="HITL Cases + Execution Snapshot" accent="amber" />
              </div>
              <div className="mt-6 text-center text-xs font-mono text-slate-500">
                All decisions stored with execution_metadata + audit trail
              </div>
            </Section>

            <div className="mt-20 text-center opacity-40 text-xs font-mono">
              End of DAG Execution
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
