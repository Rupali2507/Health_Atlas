import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar_III from "../Components/Navbar_III";
import { useHealthContext } from "../Context/HealthContext";
import { 
  Camera, Database, Zap, Shield, MapPin, Brain, 
  TrendingUp, CheckCircle, AlertTriangle, Activity,
  Sparkles, Award, Clock, Target, FileText, Globe,
  GitBranch, Layers, Code, Server
} from 'lucide-react';

/* ----------------- ULTIMATE DESIGN SYSTEM COMPONENTS ----------------- */

const Badge = ({ children, Dark }) => (
  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
    Dark 
      ? 'bg-slate-800/80 border-slate-700 text-slate-300' 
      : 'bg-white/80 border-slate-200 text-slate-600'
  } border shadow-sm backdrop-blur-sm`}>
    {children}
  </span>
);

const Node = ({ title, subtitle, accent = "gray", Dark }) => {
  const styles = Dark ? {
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    red: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    gray: "border-slate-700 bg-slate-800/50 text-slate-300",
  } : {
    blue: "border-blue-100 bg-blue-50/40 text-blue-900",
    green: "border-emerald-100 bg-emerald-50/40 text-emerald-900",
    red: "border-rose-100 bg-rose-50/40 text-rose-900",
    amber: "border-amber-100 bg-amber-50/40 text-amber-900",
    purple: "border-purple-100 bg-purple-50/40 text-purple-900",
    cyan: "border-cyan-100 bg-cyan-50/40 text-cyan-900",
    gray: "border-slate-200 bg-slate-50 text-slate-800",
  };

  return (
    <div className={`rounded-2xl p-5 border transition-all hover:-translate-y-1 hover:shadow-2xl backdrop-blur-sm ${styles[accent]} group`}>
      <div className={`font-bold text-[15px] mb-2 tracking-tight ${Dark ? 'text-white' : ''}`}>
        {title}
      </div>
      <div className={`text-xs leading-relaxed ${Dark ? 'text-slate-400' : 'text-slate-600'}`}>
        {subtitle}
      </div>
      
      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
        style={{
          background: `radial-gradient(circle at center, ${
            accent === 'blue' ? '#3b82f620' :
            accent === 'green' ? '#10b98120' :
            accent === 'red' ? '#f4434620' :
            accent === 'amber' ? '#f59e0b20' :
            accent === 'purple' ? '#a855f720' :
            accent === 'cyan' ? '#06b6d420' :
            '#64748b20'
          }, transparent 70%)`
        }}
      />
    </div>
  );
};

const Section = ({ step, title, children, Dark, icon: Icon }) => (
  <div className={`${
    Dark 
      ? 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50' 
      : 'bg-white/70 border-white/60'
  } backdrop-blur-xl border rounded-3xl p-8 shadow-2xl mb-10 hover:shadow-3xl transition-all duration-500`}>
    <div className="flex items-center gap-4 mb-8">
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${
        Dark ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-900'
      } text-white font-mono text-sm font-bold shadow-lg`}>
        {step}
      </div>
      
      {Icon && (
        <div className={`p-2 rounded-lg ${
          Dark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
        }`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      )}
      
      <h2 className={`text-xl md:text-2xl font-black tracking-tight ${
        Dark ? 'text-white' : 'text-slate-900'
      }`}>
        {title}
      </h2>
      
      <div className={`flex-1 h-px bg-gradient-to-r ${
        Dark ? 'from-slate-700 to-transparent' : 'from-slate-200 to-transparent'
      } ml-4`} />
    </div>
    {children}
  </div>
);

const Connector = ({ Dark }) => {
  const [pulse, setPulse] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center my-6">
      <div className={`h-16 w-px ${
        Dark 
          ? 'bg-gradient-to-b from-slate-700 via-indigo-500 to-slate-700' 
          : 'bg-gradient-to-b from-slate-200 via-indigo-200 to-slate-200'
      } relative`}>
        <div className={`absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 rounded-full transition-all duration-500 ${
          pulse ? 'scale-150 opacity-100' : 'scale-100 opacity-70'
        }`} />
        
        {/* Animated flow particles */}
        <div className={`absolute top-0 left-1/2 w-1 h-1 -translate-x-1/2 bg-cyan-400 rounded-full animate-flow-down`} />
      </div>
    </div>
  );
};

/* ----------------- MAIN COMPONENT ----------------- */

export default function FlowChart() {
  const { Dark } = useHealthContext();
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.3 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
      }

      draw(ctx) {
        ctx.fillStyle = Dark 
          ? `rgba(99, 102, 241, ${this.opacity})`
          : `rgba(59, 130, 246, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particleCount = 60;
    const particleArray = Array.from({ length: particleCount }, () => new Particle());

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections
      ctx.strokeStyle = Dark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(59, 130, 246, 0.05)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particleArray.length; i++) {
        for (let j = i + 1; j < particleArray.length; j++) {
          const dx = particleArray[i].x - particleArray[j].x;
          const dy = particleArray[i].y - particleArray[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particleArray[i].x, particleArray[i].y);
            ctx.lineTo(particleArray[j].x, particleArray[j].y);
            ctx.stroke();
          }
        }
      }

      particleArray.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [Dark]);

  const bgMain = Dark
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
    : "bg-[#f8fafc] text-slate-900";

  return (
    <div className={`flex min-h-screen ${bgMain} relative overflow-hidden`}>
      
      {/* Animated Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ filter: 'blur(0.5px)', opacity: 0.6 }}
      />

      {/* Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-20 left-20 w-96 h-96 ${Dark ? 'bg-violet-500/10' : 'bg-violet-200/20'} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-20 right-20 w-96 h-96 ${Dark ? 'bg-cyan-500/10' : 'bg-cyan-200/20'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${Dark ? 'bg-pink-500/10' : 'bg-pink-200/20'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '2s' }} />
      </div>
      
      <Sidebar />

      <div className="flex-1 lg:ml-[20vw] relative z-10">
        <Navbar_III />

        <div className="px-6 pt-24 pb-32">
          <div className="max-w-7xl mx-auto">

            {/* HEADER */}
            <header className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
              <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/30 rounded-full backdrop-blur-xl">
                <Activity className="w-6 h-6 text-violet-400 animate-pulse" />
                <span className="text-violet-300 font-semibold tracking-wider text-sm">AGENTIC ARCHITECTURE</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
                <span className={Dark ? 'text-white' : 'text-slate-900'}>
                  Provider Validation
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400">
                  Intelligence Pipeline
                </span>
              </h1>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <Badge Dark={Dark}>VLM-Powered</Badge>
                <Badge Dark={Dark}>Authority Weighted</Badge>
                <Badge Dark={Dark}>Fraud Aware</Badge>
                <Badge Dark={Dark}>HITL Enabled</Badge>
                <Badge Dark={Dark}>PostgreSQL Backed</Badge>
                <Badge Dark={Dark}>7-Stage Pipeline</Badge>
              </div>

              <p className={`text-xs font-mono ${Dark ? 'text-slate-500' : 'text-slate-500'}`}>
                Authority Hierarchy: 100 State Board • 90 NPPES • 85 OIG • 70 Address • 60 Website • 40 Upload
              </p>
            </header>

            {/* STAGE 00 - INPUT LAYER */}
            <Section step="00" title="Data Source & Input Authority Layer" Dark={Dark} icon={FileText}>
              <div className="grid md:grid-cols-3 gap-6">
                <Node title="CSV Upload" subtitle="Structured provider data • Authority 40 (Baseline)" Dark={Dark} accent="gray" />
                <Node title="PDF / Scanned Docs" subtitle="Unstructured documents requiring VLM extraction" Dark={Dark} accent="purple" />
                <Node title="JPG / PNG Images" subtitle="Image-based forms with OCR + vision parsing" Dark={Dark} accent="purple" />
              </div>
              <div className={`mt-6 text-center text-xs font-bold ${Dark ? 'text-slate-500' : 'text-slate-400'}`}>
                Initial Trust Baseline: Authority Score = 40
              </div>
            </Section>

            <Connector Dark={Dark} />

            {/* STAGE 01 - VLM EXTRACTION */}
            <Section step="01" title="Vision Intelligence Layer (Stage 0)" Dark={Dark} icon={Camera}>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Node title="🥇 Gemini Flash 2.0" subtitle="Primary VLM with high accuracy • 3–5s per page • FREE tier" Dark={Dark} accent="purple" />
                <Node title="🥈 GPT-4o-mini" subtitle="Fallback model for reliability and redundancy" Dark={Dark} accent="purple" />
                <Node title="pdf2image Converter" subtitle="High-quality 300 DPI conversion for optimal OCR" Dark={Dark} accent="purple" />
                <Node title="Schema Normalization" subtitle="NPI format validation + field structuring" Dark={Dark} accent="green" />
              </div>
              <div className={`mt-6 text-center text-xs ${Dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Output → Structured Provider Profile (Authority remains 40 until verified)
              </div>
            </Section>

            <Connector Dark={Dark} />

            {/* ORCHESTRATOR */}
            <Section step="DAG" title="LangGraph Orchestrator (Central DAG Engine)" Dark={Dark} icon={GitBranch}>
              <div className={`text-center font-mono text-sm p-6 rounded-xl ${
                Dark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'
              } border`}>
                <div className="flex flex-wrap justify-center gap-3 items-center">
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg font-bold text-xs">Parallel Fan-Out</span>
                  <span className={Dark ? 'text-slate-600' : 'text-slate-400'}>→</span>
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold text-xs">Data Merge</span>
                  <span className={Dark ? 'text-slate-600' : 'text-slate-400'}>→</span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold text-xs">QA Checks</span>
                  <span className={Dark ? 'text-slate-600' : 'text-slate-400'}>→</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg font-bold text-xs">AI Arbitration</span>
                  <span className={Dark ? 'text-slate-600' : 'text-slate-400'}>→</span>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold text-xs">Confidence Scoring</span>
                  <span className={Dark ? 'text-slate-600' : 'text-slate-400'}>→</span>
                  <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg font-bold text-xs">HITL Routing</span>
                </div>
              </div>
            </Section>

            <Connector Dark={Dark} />

            {/* STAGE 02 - PRIMARY VALIDATION */}
            <Section step="02" title="Primary Source Verification Agent (Stages 1-2)" Dark={Dark} icon={Database}>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Node title="NPPES API" subtitle="NPI identity verification + taxonomy codes + freshness • Authority 90" Dark={Dark} accent="blue" />
                <Node title="OIG LEIE" subtitle="Federal exclusion database screening (600MB CSV) • Authority 85" Dark={Dark} accent="red" />
                <Node title="State Medical Board" subtitle="License validation + disciplinary history • Authority 100 (Highest)" Dark={Dark} accent="green" />
                <Node title="USPS + Geoapify" subtitle="Address standardization + geocoding validation • Authority 70" Dark={Dark} accent="cyan" />
              </div>
            </Section>

            <Connector Dark={Dark} />

            {/* STAGE 02B - ENRICHMENT */}
            <Section step="02B" title="Information Enrichment Agent (Stages 3-4)" Dark={Dark} icon={Globe}>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Node title="Website Scraper" subtitle="Provider credential extraction from official sites • Authority 60" Dark={Dark} accent="purple" />
                <Node title="Google Scholar" subtitle="Recent publication history (≥2024) for zombie detection" Dark={Dark} accent="purple" />
                <Node title="Web Presence Scan" subtitle="Digital footprint analysis • Score ∈ [0,1]" Dark={Dark} accent="purple" />
                <Node title="LLM Extraction" subtitle="Education credentials + certifications parsing" Dark={Dark} accent="purple" />
              </div>
            </Section>

            <Connector Dark={Dark} />

            {/* STAGE 03 - QA */}
            <Section step="03" title="Quality Assurance Agent (Stage 5 - Surgical QA & Fraud Detection)" Dark={Dark} icon={Shield}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Node title="🔴 OIG Exclusion" subtitle="Critical blocker - auto-reject if excluded" Dark={Dark} accent="red" />
                <Node title="🔴 License Suspension" subtitle="Critical risk - suspended/revoked license" Dark={Dark} accent="red" />
                <Node title="🟡 Geo-Fraud Detection" subtitle="Warning: residential address or parking lot" Dark={Dark} accent="amber" />
                <Node title="🟡 Cross-Field Conflict" subtitle="Warning: CSV vs registry mismatch detected" Dark={Dark} accent="blue" />
                <Node title="🟡 State Alignment" subtitle="Warning: license state ≠ practice state" Dark={Dark} accent="amber" />
                <Node title="🔵 Digital Footprint" subtitle="Info: zombie provider detection (score <0.3)" Dark={Dark} accent="purple" />
                <Node title="🟢 Freshness Decay" subtitle="Info: <30d=1.0 • <90d=0.5 • >365d=0.1" Dark={Dark} accent="gray" />
                <Node title="🟢 Auto-Healing Logic" subtitle="Success: address reconciliation via NPPES (>85% similarity)" Dark={Dark} accent="green" />
              </div>
              <div className={`mt-6 text-center text-xs font-mono ${Dark ? 'text-amber-400' : 'text-amber-700'}`}>
                Risk Score = (CRITICAL × 10) + (WARNING × 3) + (Fraud Indicators × 5)
              </div>
            </Section>

            <Connector Dark={Dark} />

            {/* STAGE 04 - ARBITRATION */}
            <Section step="04" title="AI Arbitration & Golden Record Synthesis (Stage 6)" Dark={Dark} icon={Brain}>
              <div className="grid md:grid-cols-2 gap-6">
                <Node 
                  title="Authority Hierarchy Engine" 
                  subtitle="Weighted conflict resolution: State Board (100) > NPPES (90) > OIG (85) > Maps (70) > Web (60) > VLM (50) > CSV (40)" 
                  Dark={Dark} 
                  accent="purple" 
                />
                <Node 
                  title="Golden Record Builder" 
                  subtitle="Single source of truth with full data provenance and audit trail" 
                  Dark={Dark} 
                  accent="green" 
                />
              </div>
            </Section>

            <Connector Dark={Dark} />

            {/* STAGE 05 - CONFIDENCE */}
            <Section step="05" title="Weighted Confidence Scoring Engine (Stage 7)" Dark={Dark} icon={Target}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Node title="Primary Sources" subtitle="Identity Verification • 35% weight" Dark={Dark} accent="blue" />
                <Node title="Address Reliability" subtitle="Geo Validation • 20% weight" Dark={Dark} accent="cyan" />
                <Node title="Digital Footprint" subtitle="Web Presence • 15% weight" Dark={Dark} accent="purple" />
                <Node title="Completeness" subtitle="Field Coverage • 15% weight" Dark={Dark} accent="green" />
                <Node title="Freshness" subtitle="Data Recency • 10% weight" Dark={Dark} accent="green" />
                <Node title="Fraud Penalty" subtitle="Risk Deduction • 5% cap" Dark={Dark} accent="red" />
              </div>
              <div className={`mt-6 text-center text-xs font-mono ${Dark ? 'text-slate-400' : 'text-slate-600'}`}>
                Final Confidence Score ∈ [0, 1] → Tier Classification → HITL Router
              </div>
            </Section>

            <Connector Dark={Dark} />

            {/* STAGE 06 - ROUTING */}
            <Section step="06" title="Directory Management Agent (Routing + Output + Workflow)" Dark={Dark} icon={Layers}>
              <div className="grid md:grid-cols-3 gap-6">
                <Node 
                  title="🟢 HIGH CONFIDENCE ≥ 80%" 
                  subtitle="Auto-commit to validated_providers table • Majority of records" 
                  Dark={Dark} 
                  accent="green" 
                />
                <Node 
                  title="🟡 MEDIUM CONFIDENCE 60-79%" 
                  subtitle="Auto-approve with monitoring flags • Significant portion" 
                  Dark={Dark} 
                  accent="amber" 
                />
                <Node 
                  title="🔴 LOW CONFIDENCE <60%" 
                  subtitle="Human review required → review_queue table • Minority of records" 
                  Dark={Dark} 
                  accent="red" 
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <Node 
                  title="Directory Output Engine" 
                  subtitle="Multi-channel publishing: Web UI • Mobile App • PDF Reports" 
                  Dark={Dark} 
                  accent="cyan" 
                />
                <Node 
                  title="Alert & Reporting Engine" 
                  subtitle="Validation summaries + actionable insights + batch reports" 
                  Dark={Dark} 
                  accent="purple" 
                />
                <Node 
                  title="Workflow Queue Manager" 
                  subtitle="Prioritized HITL review tasks with assignment tracking" 
                  Dark={Dark} 
                  accent="gray" 
                />
              </div>
            </Section>

            <Connector Dark={Dark} />

            {/* STAGE 07 - DATABASE */}
            <Section step="07" title="Neon PostgreSQL Persistence Layer" Dark={Dark} icon={Server}>
              <div className="grid md:grid-cols-2 gap-6">
                <Node 
                  title="validated_providers Table" 
                  subtitle="Auto-approved entries with full confidence metadata, golden record, and provenance" 
                  Dark={Dark} 
                  accent="green" 
                />
                <Node 
                  title="review_queue Table" 
                  subtitle="Human-in-the-loop cases with execution snapshot, QA flags, and assignment status" 
                  Dark={Dark} 
                  accent="amber" 
                />
              </div>
              <div className={`mt-6 text-center text-xs font-mono ${Dark ? 'text-slate-500' : 'text-slate-500'}`}>
                All decisions stored with execution_metadata + full audit trail + version control
              </div>
            </Section>

            {/* FOOTER */}
            <div className={`mt-20 text-center ${Dark ? 'opacity-40' : 'opacity-40'} text-xs font-mono`}>
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckCircle size={16} className="text-emerald-400" />
                <span>End of DAG Execution Pipeline</span>
              </div>
              <div className="text-[10px]">
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes flow-down {
          0% { transform: translateY(0) translateX(-50%); opacity: 1; }
          100% { transform: translateY(64px) translateX(-50%); opacity: 0; }
        }
        .animate-flow-down {
          animation: flow-down 2s infinite;
        }
      `}</style>
    </div>
  );
}