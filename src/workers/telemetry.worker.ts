export interface RawTelemetryPayload {
  drone_id: string;
  timestamp: number;
  gps: {
    lat: number;
    lon: number;
    alt_rel_m: number;
  };
  ai_status: {
    anomaly_detected: boolean;
    anomaly_type: string;
    confidence: number;
    sit_rep?: string;
  };
  battery?: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number, number];
  };
  properties: {
    drone_id: string;
    anomaly: boolean;
    anomaly_type: string;
    confidence: number;
    timestamp: number;
  };
}

export type WorkerIncomingMessage =
  | { action: 'CONNECT'; payload: { url: string } }
  | { action: 'DISCONNECT' };

export type WorkerOutgoingMessage =
  | { type: 'STATUS'; data: 'CONNECTED' | 'DISCONNECTED' | 'ERROR'; error?: string }
  | { type: 'TELEMETRY_BATCH'; raw: RawTelemetryPayload[]; geoJson: GeoJSONFeature[] };

let socket: WebSocket | null = null;
let rawBuffer: RawTelemetryPayload[] = [];
let geoJsonBuffer: GeoJSONFeature[] = [];
let flushInterval: ReturnType<typeof setInterval> | null = null;

ctxOnMessage();

function ctxOnMessage() {
  self.onmessage = (e: MessageEvent<WorkerIncomingMessage>) => {
    const { action } = e.data;

    if (action === 'CONNECT') {
      const { url } = e.data.payload;
      initWebSocket(url);
    } else if (action === 'DISCONNECT') {
      closeWebSocket();
    }
  };
}

function initWebSocket(url: string) {
  closeWebSocket();

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      postStatus('CONNECTED');
      startBatchFlushing();
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const data: RawTelemetryPayload = JSON.parse(event.data);

        const feature: GeoJSONFeature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [data.gps.lon, data.gps.lat, data.gps.alt_rel_m],
          },
          properties: {
            drone_id: data.drone_id,
            anomaly: data.ai_status?.anomaly_detected ?? false,
            anomaly_type: data.ai_status?.anomaly_type ?? 'none',
            confidence: data.ai_status?.confidence ?? 0,
            timestamp: data.timestamp,
          },
        };

        rawBuffer.push(data);
        geoJsonBuffer.push(feature);
      } catch {
        // Drop invalid frames gracefully without disrupting stream
      }
    };

    socket.onerror = () => {
      postStatus('ERROR', 'WebSocket connection error encountered');
    };

    socket.onclose = () => {
      postStatus('DISCONNECTED');
      stopBatchFlushing();
    };
  } catch (err) {
    postStatus('ERROR', err instanceof Error ? err.message : 'Failed to initialize WebSocket');
  }
}

function closeWebSocket() {
  stopBatchFlushing();
  if (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

function startBatchFlushing() {
  stopBatchFlushing();
  // Batch updates every 50ms (20 FPS tick rate) to decouple UI thread from WSS frequency
  flushInterval = setInterval(() => {
    if (rawBuffer.length > 0) {
      const outgoing: WorkerOutgoingMessage = {
        type: 'TELEMETRY_BATCH',
        raw: [...rawBuffer],
        geoJson: [...geoJsonBuffer],
      };
      self.postMessage(outgoing);
      rawBuffer = [];
      geoJsonBuffer = [];
    }
  }, 50);
}

function stopBatchFlushing() {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

function postStatus(status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR', error?: string) {
  const message: WorkerOutgoingMessage = { type: 'STATUS', data: status, error };
  self.postMessage(message);
}
