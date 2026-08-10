import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  livekitUrl: string;
  livekitKey: string;
  livekitSecret: string;
  zeroTierNetworkId: string;
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default to the active cloud LiveKit instance — can be overridden via GlobalSettingsModal
      livekitUrl: "wss://maas-oa7qe4cw.livekit.cloud",
      livekitKey: "APIVKkdqFpXgYjP",
      livekitSecret: "RZarlBA7Ue9cLgZM1kHff2ge3wVZPapzJnYHzPq0RMCA",
      zeroTierNetworkId: "zt_net_default123",
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: "maas-settings", // localStorage key — persists across page refreshes
    }
  )
);
