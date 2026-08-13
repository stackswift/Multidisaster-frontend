import React from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { useVodStore } from '@/store/useVodStore';

export const TokenSpeedMonitor = () => {
  const currentMode = useVodStore((state) => state.currentMode);
  
  const liveTps = useTelemetryStore((state) => state.tokenSpeed);
  const liveLatency = useTelemetryStore((state) => state.latencySec);
  
  const vodTps = useVodStore((state) => state.tokenSpeed);
  const vodLatency = useVodStore((state) => state.latencySec);

  const tps = currentMode === 'live' ? liveTps : vodTps;
  const latency = currentMode === 'live' ? liveLatency : vodLatency;

  return (
    <div className="w-full glass-panel rounded-xl p-3 flex items-center justify-between bg-slate-900/80 border border-teal-500/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tps !== null ? 'bg-teal-500/20 animate-pulse' : 'bg-slate-800'}`}>
          <span className={tps !== null ? 'text-teal-400' : 'text-slate-500'}>⚡</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest">
            LLM COMMANDER SPEED
          </span>
          <span className={`text-lg font-mono font-bold leading-tight ${tps !== null ? 'text-teal-400' : 'text-slate-500'}`}>
            {tps !== null ? tps.toFixed(2) : '---'} <span className={`text-sm ${tps !== null ? 'text-teal-400/60' : 'text-slate-600'}`}>TPS</span>
          </span>
        </div>
      </div>
      
      <div className="flex flex-col text-right">
        <span className="text-[10px] font-mono text-slate-500 tracking-wider">
          E2E LATENCY
        </span>
        <span className={`font-mono font-bold text-sm ${latency !== null ? 'text-orange-400' : 'text-slate-600'}`}>
          {latency !== null ? `${latency.toFixed(2)}s` : '---'}
        </span>
      </div>
    </div>
  );
};
