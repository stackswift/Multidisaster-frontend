'use client';

import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { useVodStore } from '@/store/useVodStore';

export const AiTerminal: React.FC = () => {
  const telemetryLogs = useTelemetryStore((state) => state.terminalLogs);
  const currentMode = useVodStore((state) => state.currentMode);
  const vodLogs = useVodStore((state) => state.vodLogs);
  
  const logs = currentMode === 'live' ? telemetryLogs : vodLogs;
  
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Increased from 24 to 36 to account for line height + padding
    overscan: 5,
  });

  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  return (
    <div className="w-full h-full glass-panel rounded-xl p-3 flex flex-col font-mono text-xs overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-teal-400">&gt;</span>
          <span className="font-bold text-slate-200 tracking-wider">
            {currentMode === 'live' ? 'FLEET COMMANDER SIT-REP TERMINAL' : 'VOD ANALYSIS LOGS'}
          </span>
        </div>
        <span className="text-[10px] text-teal-400/80 bg-teal-950/60 border border-teal-500/30 px-2 py-0.5 rounded">
          {currentMode === 'live' ? '20Hz INGEST' : 'POST-PROCESS'}
        </span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto pr-1">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const log = logs[virtualRow.index];
            return (
              <div
                key={log.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`flex items-center gap-2 px-2 py-1 my-0.5 rounded font-mono text-[11px] leading-relaxed ${
                  log.isAnomaly
                    ? 'bg-orange-950/40 text-orange-400 border-l-2 border-orange-500 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900/40'
                }`}
              >
                <span className="text-slate-500 text-[10px] shrink-0">[{log.timestamp}]</span>
                <span className="text-teal-400 font-bold shrink-0">[{log.droneId}]</span>
                <span className="truncate whitespace-pre-wrap">{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

