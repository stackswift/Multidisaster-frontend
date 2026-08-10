'use client';

import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { WorkerOutgoingMessage, WorkerIncomingMessage } from '@/workers/telemetry.worker';

export const useTelemetryWorker = (wssUrl: string) => {
  const workerRef = useRef<Worker | null>(null);
  const processBatch = useTelemetryStore((state) => state.processBatch);
  const setConnectionStatus = useTelemetryStore((state) => state.setConnectionStatus);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize Web Worker from static worker script
    const worker = new Worker(new URL('../workers/telemetry.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    let pendingRaw: RawTelemetryPayload[] = [];
    let pendingGeoJson: GeoJSONFeature[] = [];
    let rafId: number | null = null;

    worker.onmessage = (event: MessageEvent<WorkerOutgoingMessage>) => {
      const message = event.data;

      if (message.type === 'STATUS') {
        setConnectionStatus(message.data);
      } else if (message.type === 'TELEMETRY_BATCH') {
        pendingRaw.push(...message.raw);
        pendingGeoJson.push(...message.geoJson);

        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            processBatch(pendingRaw, pendingGeoJson);
            pendingRaw = [];
            pendingGeoJson = [];
            rafId = null;
          });
        }
      }
    };

    const connectMsg: WorkerIncomingMessage = {
      action: 'CONNECT',
      payload: { url: wssUrl },
    };
    worker.postMessage(connectMsg);

    return () => {
      const disconnectMsg: WorkerIncomingMessage = { action: 'DISCONNECT' };
      worker.postMessage(disconnectMsg);
      worker.terminate();
      workerRef.current = null;
    };
  }, [wssUrl, processBatch, setConnectionStatus]);

  return null;
};
