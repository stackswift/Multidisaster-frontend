export * from "./useTelemetryStore";
export * from "./useMapStore";
export * from "./useProvisionStore";

import { create } from "zustand";

export interface AlertMessage {
  id: string;
  timestamp: number;
  message: string;
  level: "info" | "warning" | "critical";
  drone_id?: string;
}

interface AlertStore {
  alerts: AlertMessage[];
  focusedDroneId: string | null;
  addAlert: (alert: Omit<AlertMessage, "id" | "timestamp">) => void;
  setFocusedDrone: (id: string | null) => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  focusedDroneId: null,
  addAlert: (alert) =>
    set((state) => ({
      alerts: [
        {
          ...alert,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
        },
        ...state.alerts,
      ].slice(0, 500), // Scaled log capacity for 20Hz streams
    })),
  setFocusedDrone: (id) => set({ focusedDroneId: id }),
  clearAlerts: () => set({ alerts: [] }),
}));

// Backwards compatibility re-export for useSwarmStore
import { useProvisionStore } from "./useProvisionStore";
export const useSwarmStore = useProvisionStore;
