'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetryWorker } from '@/hooks/useTelemetryWorker';
import { LiveKitGrid } from '@/components/video/LiveKitGrid';
import { AiTerminal } from '@/components/terminal/AiTerminal';
import { ProvisioningModal } from '@/components/modals/ProvisioningModal';
import { GlobalSettingsModal } from '@/components/modals/GlobalSettingsModal';
import { VodInterface } from '@/components/video/VodInterface';
import { TokenSpeedMonitor } from '@/components/terminal/TokenSpeedMonitor';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { useProvisionStore } from '@/store/useProvisionStore';
import { useVodStore } from '@/store/useVodStore';

// Dynamic imports to prevent SSR issues with Mapbox canvas
const TacticalMap = dynamic(
  () => import('@/components/map/TacticalMap').then((m) => m.TacticalMap),
  { ssr: false }
);

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

export default function AASCommandDashboard() {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const drones = useTelemetryStore((state) => state.drones);
  const isProvisioned = useProvisionStore((state) => state.isProvisioned);
  const addManualLog = useTelemetryStore((state) => state.addManualLog);
  const currentMode = useVodStore((state) => state.currentMode);
  const setMode = useVodStore((state) => state.setMode);

  const droneList = Object.values(drones);

  // Silences chrome-extension errors (such as WELLDONE Wallet) that trigger Next.js console/dev overlays
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Intercept console.error to ignore chrome-extension issues
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const isExtensionError = args.some((arg) => {
        if (!arg || typeof arg !== 'object' && typeof arg !== 'string') return false;
        const argStr = typeof arg === 'string' ? arg : ((arg as { message?: string }).message || '');
        const stackStr = (arg as { stack?: string }).stack || '';
        return (
          argStr.includes('WELLDONE') ||
          argStr.includes('chrome-extension://') ||
          stackStr.includes('chrome-extension://')
        );
      });

      if (isExtensionError) {
        return; // Suppress Next.js dev overlay trigger
      }

      originalConsoleError.apply(console, args);
    };

    // 2. Intercept window uncaught errors
    const handleError = (event: ErrorEvent) => {
      const isExtension =
        event.filename?.startsWith('chrome-extension://') ||
        event.message?.includes('WELLDONE') ||
        event.error?.stack?.includes('chrome-extension://');

      if (isExtension) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason) {
        const message = reason.message || '';
        const stack = reason.stack || '';
        if (message.includes('WELLDONE') || stack.includes('chrome-extension://')) {
          event.stopImmediatePropagation();
          event.preventDefault();
        }
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection, true);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection, true);
    };
  }, []);

  const showToast = (title: string, message: string, type: 'info' | 'warning' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSwarmCommand = (cmd: 'launch' | 'pause' | 'rtl') => {
    if (!isProvisioned) {
      showToast(
        'COMMAND DENIED',
        'Swarm must be provisioned and linked via ZeroTier first.',
        'error'
      );
      addManualLog('SECURE OVERRIDE REJECTED: Swarm nodes not provisioned.', true, 'SECURITY');
      return;
    }

    switch (cmd) {
      case 'launch':
        fetch('http://localhost:8080/v1/swarm/launch', { method: 'POST' }).catch(console.error);
        showToast(
          'SWARM TAKEOFF SEQUENCE',
          'MAVLink TAKEOFF command broadcast successful.',
          'info'
        );
        addManualLog('MAVLink Command Broadcast: TAKEOFF sequence initiated for all active swarm nodes.', false, 'SYSTEM');
        break;
      case 'pause':
        fetch('http://localhost:8080/v1/swarm/pause', { method: 'POST' }).catch(console.error);
        showToast(
          'SWARM MOTION HOLD',
          'Swarm loitering in current coordinates.',
          'warning'
        );
        addManualLog('MAVLink Command Broadcast: Swarm HOLD (loiter) command issued.', false, 'SYSTEM');
        break;
      case 'rtl':
        fetch('http://localhost:8080/v1/swarm/rtl', { method: 'POST' }).catch(console.error);
        showToast(
          'EMERGENCY RTL BROADCAST',
          'All drones returning to base coordinates.',
          'error'
        );
        addManualLog('EMERGENCY OVERRIDE: return-to-launch (RTL) command broadcast to all active swarm nodes.', true, 'SYSTEM');
        break;
    }
  };

  // Initialize Worker for non-blocking telemetry stream
  useTelemetryWorker(
    process.env.NEXT_PUBLIC_WSS_URL || 'ws://localhost:8080/v1/ui/stream'
  );

  return (
    <div suppressHydrationWarning className="w-screen h-screen bg-[#07090e] text-slate-100 flex flex-col overflow-hidden p-3 gap-3 font-sans select-none antialiased">
      {/* Top Navigation Header */}
      <header className="h-14 glass-panel rounded-xl px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-teal-400 glow-teal" />
          <h1 className="font-mono font-bold tracking-widest text-lg text-teal-400">
            AAS COMMAND CENTER
          </h1>
          <span className="text-xs font-mono text-slate-500 border-l border-slate-800 pl-3">
            ZeroTier Active (zt_net_a1b2c3d4e5f6)
          </span>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-700/50 text-[10px] font-mono font-bold">
          <button
            onClick={() => setMode('live')}
            className={`px-4 py-1.5 rounded transition-all cursor-pointer ${
              currentMode === 'live'
                ? 'bg-teal-500/20 text-teal-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            [ LIVE SWARM ]
          </button>
          <button
            onClick={() => setMode('vod')}
            className={`px-4 py-1.5 rounded transition-all cursor-pointer ${
              currentMode === 'vod'
                ? 'bg-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(255,85,0,0.2)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            [ VOD ANALYSIS ]
          </button>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all font-bold cursor-pointer flex items-center gap-2"
          >
            Settings
          </button>
          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/40 text-teal-300 hover:bg-teal-500/20 transition-all font-bold cursor-pointer"
          >
            + Claim New Device
          </button>
          <button
            onClick={() => handleSwarmCommand('pause')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all font-bold cursor-pointer"
          >
            Pause Swarm
          </button>
          <button
            onClick={() => handleSwarmCommand('launch')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/30 transition-all cursor-pointer"
          >
            Launch Swarm
          </button>
          <button
            onClick={() => handleSwarmCommand('rtl')}
            className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold hover:bg-orange-500/30 transition-all cursor-pointer"
          >
            Emergency RTL
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* Left Side: Fleet List & RAG Legend */}
        <aside className="col-span-3 flex flex-col gap-3">
          <div className="flex-1 glass-panel rounded-xl p-3 flex flex-col">
            <h2 className="text-xs font-mono font-bold text-slate-400 mb-3 tracking-wider">
              SWARM NODE FLEET
            </h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
              {droneList.length === 0 ? (
                <div className="text-center text-xs text-slate-500 font-mono py-8 animate-pulse">
                  Awaiting edge heartbeats...
                </div>
              ) : (
                droneList.map((drone) => {
                  const isAnomaly = drone.ai_status?.anomaly_detected || false;
                  return (
                    <div
                      key={drone.drone_id}
                      className={`p-3 rounded-lg border transition-all duration-300 ${
                        isAnomaly
                          ? 'bg-slate-900/60 border-orange-500/50 shadow-[0_0_10px_rgba(255,85,0,0.15)] animate-pulse'
                          : 'bg-slate-900/60 border-teal-500/10 hover:border-teal-500/35'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-mono font-bold text-teal-400">
                        <span className={isAnomaly ? 'text-orange-400' : 'text-teal-400'}>
                          {drone.drone_id}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAnomaly ? 'bg-orange-500 animate-ping' : 'bg-teal-400'
                          }`}
                        />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                        <span>BAT: {drone.battery || 100}%</span>
                        <span>ALT: {drone.gps.alt_rel_m.toFixed(1)}m</span>
                      </div>
                      {isAnomaly && (
                        <div className="mt-2 text-[10px] font-mono bg-orange-950/60 text-orange-300 p-1.5 rounded border border-orange-500/30 font-bold uppercase tracking-wider">
                          ANOMALY: {drone.ai_status.anomaly_type}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="h-40 glass-panel rounded-xl p-3 font-mono text-[10px] text-slate-400 flex flex-col justify-between">
            <span className="font-bold text-slate-300">GEOSPATIAL RAG PIPELINE</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span>Nominal Swarm Node</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>YOLOv10 Anomaly Detected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-lg bg-orange-500/50 border border-orange-500" />
              <span>High-Risk Census Volumetric</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-lg bg-emerald-500/50 border border-emerald-500" />
              <span>Safe Zone Volumetric</span>
            </div>
          </div>
        </aside>

        {/* Center: Tactical 3D Map or VOD Interface */}
        <main className="col-span-6 flex flex-col">
          {currentMode === 'live' ? <TacticalMap /> : <VodInterface />}
        </main>

        {/* Right Side: WebRTC Grid & Virtualized Terminal */}
        <aside className="col-span-3 flex flex-col gap-3">
          <div className="flex-1 min-h-0">
            {currentMode === 'live' ? (
              <LiveKitGrid />
            ) : (
              <div className="w-full h-full glass-panel rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-3">
                  <span className="text-teal-400 font-mono text-xl font-bold">i</span>
                </div>
                <h3 className="text-teal-400 font-mono font-bold tracking-wider mb-2">VOD METRICS</h3>
                <p className="text-xs font-mono text-slate-500">Live WebRTC grid is suspended during VOD Analysis.</p>
              </div>
            )}
          </div>
          <div className="h-64 min-h-0 flex flex-col gap-3">
            <TokenSpeedMonitor />
            <AiTerminal />
          </div>
        </aside>
      </div>

      <ProvisioningModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={(droneName) => {
          showToast('PROVISIONING COMPLETE', `Successfully Provisioned ${droneName}`, 'info');
        }}
      />

      <GlobalSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: 0, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl border font-mono text-[11px] w-80 shadow-2xl backdrop-blur-md flex flex-col gap-1 pointer-events-auto ${
                toast.type === 'error'
                  ? 'bg-red-950/80 border-red-500/40 text-red-200'
                  : toast.type === 'warning'
                  ? 'bg-orange-950/80 border-orange-500/40 text-orange-200'
                  : 'bg-teal-950/80 border-teal-500/40 text-teal-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="tracking-wider">{toast.title}</span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="hover:text-white opacity-60 hover:opacity-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <span className="opacity-95 leading-normal">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
