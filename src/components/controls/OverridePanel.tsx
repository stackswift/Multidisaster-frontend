"use client";

import React, { useState } from "react";
import { useSwarmStore, useAlertStore } from "@/store";
import { PlaneTakeoff, ShieldAlert, PauseOctagon, Radio } from "lucide-react";

export function OverridePanel() {
  const isProvisioned = useSwarmStore((state) => state.isProvisioned);
  const addAlert = useAlertStore((state) => state.addAlert);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);

  const handleCommand = (cmd: string) => {
    setActiveCommand(cmd);
    
    let message = "";
    let level: "info" | "warning" | "critical" = "info";

    switch(cmd) {
      case 'pause':
        message = "MAVLink Override: Swarm HOLD command issued.";
        level = "warning";
        break;
      case 'launch':
        message = "MAVLink Override: Swarm TAKEOFF sequence initiated.";
        level = "info";
        break;
      case 'rtl':
        message = "MAVLink Override: EMERGENCY RETURN TO LAUNCH.";
        level = "critical";
        break;
    }

    addAlert({ message, level });

    setTimeout(() => {
      setActiveCommand(null);
    }, 1500);
  };

  return (
    <div className="w-full h-full flex items-center gap-4 px-2">
      <div className="flex-1 flex items-center gap-3">
        <h1 className="text-xl lg:text-2xl font-outfit font-bold tracking-wider uppercase">
          AAS Command <span className="text-ai-cyan">Center</span>
        </h1>
        {isProvisioned && (
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/50 rounded-full flex items-center gap-2">
            <Radio size={14} className="text-emerald-400" />
            <span className="text-xs font-mono font-bold text-emerald-400">ZeroTier Linked</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-3">
        <button 
          disabled={!isProvisioned || activeCommand !== null}
          onClick={() => handleCommand('pause')}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg border border-slate-600 transition-colors"
        >
          <PauseOctagon size={18} />
          <span className="font-semibold text-sm">Pause Grid</span>
        </button>
        
        <button 
          disabled={!isProvisioned || activeCommand !== null}
          onClick={() => handleCommand('launch')}
          className="flex items-center gap-2 bg-success-green hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 px-6 py-2 rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <PlaneTakeoff size={18} />
          <span>Launch Swarm</span>
        </button>

        <button 
          disabled={!isProvisioned || activeCommand !== null}
          onClick={() => handleCommand('rtl')}
          className="flex items-center gap-2 bg-emergency-red hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]"
        >
          <ShieldAlert size={18} />
          <span>Emergency RTL</span>
        </button>
      </div>
    </div>
  );
}
