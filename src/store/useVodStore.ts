import { create } from 'zustand';
import { TerminalLog } from './useTelemetryStore';

interface VodStore {
  currentMode: 'live' | 'vod';
  uploadProgress: number;
  processingState: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  videoUrl: string | null;
  vodLogs: TerminalLog[];
  tokenSpeed: number | null;
  latencySec: number | null;
  
  setMode: (mode: 'live' | 'vod') => void;
  setUploadProgress: (progress: number) => void;
  setProcessingState: (state: 'idle' | 'uploading' | 'processing' | 'complete' | 'error') => void;
  setVideoUrl: (url: string | null) => void;
  setVodLogs: (logs: TerminalLog[]) => void;
  addVodLog: (log: Omit<TerminalLog, 'id' | 'timestamp'>) => void;
  setLlmMetrics: (tps: number | null, latency: number | null) => void;
  resetVodState: () => void;
}

let logIdCounter = 0;

export const useVodStore = create<VodStore>((set) => ({
  currentMode: 'live',
  uploadProgress: 0,
  processingState: 'idle',
  videoUrl: null,
  vodLogs: [],
  tokenSpeed: null,
  latencySec: null,

  setMode: (mode) => set({ currentMode: mode }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setProcessingState: (state) => set({ processingState: state }),
  setVideoUrl: (url) => set({ videoUrl: url }),
  setVodLogs: (logs) => set({ vodLogs: logs }),
  setLlmMetrics: (tps, latency) => set({ tokenSpeed: tps, latencySec: latency }),
  
  addVodLog: (log) =>
    set((state) => {
      const timeStr = new Date().toISOString().substring(11, 19);
      const newLog: TerminalLog = {
        id: `vod-${Date.now()}-${logIdCounter++}`,
        timestamp: timeStr,
        ...log,
      };
      return {
        vodLogs: [newLog, ...state.vodLogs],
      };
    }),
    
  resetVodState: () =>
    set({
      uploadProgress: 0,
      processingState: 'idle',
      videoUrl: null,
      vodLogs: [],
      tokenSpeed: null,
      latencySec: null,
    }),
}));
