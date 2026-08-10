import { create } from "zustand";

export interface ClaimDetails {
  organization_id: string;
  network_id: string;
  livekit_url: string;
  livekit_token: string;
}

interface ProvisionStore {
  isProvisioned: boolean;
  claimDetails: ClaimDetails | null;
  pairingCode: string;
  setProvisioned: (details: ClaimDetails) => void;
  setPairingCode: (code: string) => void;
  reset: () => void;
}

export const useProvisionStore = create<ProvisionStore>((set) => ({
  isProvisioned: false,
  claimDetails: null,
  pairingCode: "",
  setProvisioned: (details) => set({ isProvisioned: true, claimDetails: details }),
  setPairingCode: (code) => set({ pairingCode: code }),
  reset: () => set({ isProvisioned: false, claimDetails: null, pairingCode: "" }),
}));
