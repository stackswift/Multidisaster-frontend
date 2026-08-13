import { create } from 'zustand';
import { RawTelemetryPayload, GeoJSONFeature } from '@/workers/telemetry.worker';

export interface TerminalLog {
  id: string;
  timestamp: string;
  droneId: string;
  message: string;
  isAnomaly: boolean;
}

interface TelemetryStore {
  drones: Record<string, RawTelemetryPayload>;
  geoJsonFeatures: Record<string, GeoJSONFeature>;
  activeAnomalies: RawTelemetryPayload[];
  terminalLogs: TerminalLog[];
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  tokenSpeed: number | null;
  latencySec: number | null;
  
  processBatch: (rawBatch: RawTelemetryPayload[], geoJsonBatch: GeoJSONFeature[]) => void;
  setConnectionStatus: (status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR') => void;
  clearLogs: () => void;
  addManualLog: (message: string, isAnomaly?: boolean, droneId?: string) => void;
  processLLMDataChannel: (payload: Record<string, unknown>) => void;
  setLlmMetrics: (tps: number | null, latency: number | null) => void;
}

let logIdCounter = 0;

export const useTelemetryStore = create<TelemetryStore>((set) => ({
  drones: {},
  geoJsonFeatures: {},
  activeAnomalies: [],
  terminalLogs: [],
  connectionStatus: 'DISCONNECTED',
  tokenSpeed: null,
  latencySec: null,

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setLlmMetrics: (tps, latency) => set({ tokenSpeed: tps, latencySec: latency }),

  clearLogs: () => set({ terminalLogs: [] }),

  addManualLog: (message, isAnomaly = false, droneId = 'SYSTEM') =>
    set((state) => {
      const timeStr = new Date().toISOString().substring(11, 19);
      const newLog: TerminalLog = {
        id: `manual-${Date.now()}-${logIdCounter++}`,
        timestamp: timeStr,
        droneId,
        message,
        isAnomaly,
      };
      return {
        terminalLogs: [newLog, ...state.terminalLogs].slice(0, 200),
      };
    }),

  processBatch: (rawBatch, geoJsonBatch) =>
    set((state) => {
      const nextDrones = { ...state.drones };
      const nextGeoJson = { ...state.geoJsonFeatures };
      const newLogs: TerminalLog[] = [];

      rawBatch.forEach((item, index) => {
        // preserve the LLM data channel bboxes so they aren't wiped out by high-frequency telemetry
        const existingBboxes = nextDrones[item.drone_id]?.ai_status?.bboxes;
        
        nextDrones[item.drone_id] = item;
        
        if (existingBboxes && nextDrones[item.drone_id].ai_status) {
          nextDrones[item.drone_id].ai_status.bboxes = existingBboxes;
        }

        nextGeoJson[item.drone_id] = geoJsonBatch[index];

        const isAnomaly = item.ai_status?.anomaly_detected ?? false;
        const timeStr = new Date(item.timestamp * 1000).toISOString().substring(11, 19);

        newLogs.push({
          id: `${item.drone_id}-${item.timestamp}-${index}-${logIdCounter++}`,
          timestamp: timeStr,
          droneId: item.drone_id,
          message: isAnomaly
            ? `YOLO TRIGGER: Anomaly '${item.ai_status.anomaly_type}' [Conf: ${item.ai_status.confidence}]`
            : `MAVLink Telemetry frame ingested OK. Lat: ${item.gps.lat.toFixed(4)}, Lon: ${item.gps.lon.toFixed(4)}`,
          isAnomaly,
        });
      });

      const updatedAnomalies = Object.values(nextDrones).filter(
        (d) => d.ai_status && d.ai_status.anomaly_detected
      );

      // Keep max 200 logs to prevent memory pressure
      const mergedLogs = [...newLogs, ...state.terminalLogs].slice(0, 200);

      return {
        drones: nextDrones,
        geoJsonFeatures: nextGeoJson,
        activeAnomalies: updatedAnomalies,
        terminalLogs: mergedLogs,
      };
    }),

  processLLMDataChannel: (payload) => 
    set((state) => {
      const aiStatus = payload.ai_status as { anomaly_detected?: boolean; anomaly_type?: string; confidence?: number; yolo_detections?: string; bboxes?: Array<{label: string; conf: number; x1: number; y1: number; x2: number; y2: number}> } | undefined;
      const droneId = (payload.drone_id as string) || 'AI_AGENT';
      const isAnomaly = aiStatus?.anomaly_detected ?? false;
      const type = aiStatus?.anomaly_type || 'unknown';
      const conf = aiStatus?.confidence || 0.0;
      const yolo = aiStatus?.yolo_detections || '';
      const tps = (aiStatus as any)?.tokens_per_sec || (payload as any)?.tokens_per_sec || null;
      const latency = (aiStatus as any)?.latency_sec || (payload as any)?.latency_sec || null;
      
      const timeStr = new Date().toISOString().substring(11, 19);
      const newLog: TerminalLog = {
        id: `llm-${Date.now()}-${logIdCounter++}`,
        timestamp: timeStr,
        droneId: droneId,
        message: isAnomaly 
          ? `[Phi Commander] 🔥 FIRE DETECTED: ${type.toUpperCase()}. Confidence: ${(conf * 100).toFixed(0)}%. YOLO: ${yolo || 'scanning...'}`
          : yolo
            ? `[Phi Commander] Scan: ${yolo}`
            : `[Phi Commander] Scan Nominal.`,
        isAnomaly: isAnomaly,
      };

      // Also update the drone object so the UI border flashes red
      const nextDrones = { ...state.drones };
      if (nextDrones[droneId]) {
        nextDrones[droneId] = {
          ...nextDrones[droneId],
          ai_status: aiStatus as { anomaly_detected: boolean; anomaly_type: string; confidence: number; bboxes?: Array<{label: string; conf: number; x1: number; y1: number; x2: number; y2: number}> },
        };
      } else {
        // Create a placeholder drone entry for LLM-only events
        nextDrones[droneId] = {
          drone_id: droneId,
          timestamp: Date.now() / 1000,
          gps: { lat: 0, lon: 0, alt_rel_m: 0 },
          battery: 0,
          ai_status: aiStatus as { anomaly_detected: boolean; anomaly_type: string; confidence: number; bboxes?: Array<{label: string; conf: number; x1: number; y1: number; x2: number; y2: number}> },
        };
      }

      const updatedAnomalies = Object.values(nextDrones).filter(
        (d) => d.ai_status && d.ai_status.anomaly_detected
      );

      return {
        drones: nextDrones,
        activeAnomalies: updatedAnomalies,
        terminalLogs: [newLog, ...state.terminalLogs].slice(0, 200),
        ...(tps !== null && { tokenSpeed: tps }),
        ...(latency !== null && { latencySec: latency })
      };
    }),
}));
