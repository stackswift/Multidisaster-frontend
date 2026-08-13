"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useProvisionStore } from "@/store";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ShieldCheck, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (droneName: string) => void;
}

export function ProvisioningModal({ isOpen, onClose, onSuccess }: ProvisioningModalProps) {
  const setProvisioned = useProvisionStore((state) => state.setProvisioned);
  const setPairingCode = useProvisionStore((state) => state.setPairingCode);

  // Read LiveKit config from the persistent settings store — not hardcoded values.
  // This is why updating credentials in GlobalSettingsModal now actually takes effect.
  const livekitUrl = useSettingsStore((state) => state.livekitUrl);
  const livekitKey = useSettingsStore((state) => state.livekitKey);
  const livekitSecret = useSettingsStore((state) => state.livekitSecret);
  const zeroTierNetworkId = useSettingsStore((state) => state.zeroTierNetworkId);

  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    // Auto-advance focus to next input box
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newPin = Array(6).fill("");
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleClaim = () => {
    const code = pin.join("");
    if (code.length < 6) return;

    setLoading(true);
    setPairingCode(code);

    // POST /v1/swarm/claim with credentials from the persistent settings store
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    fetch(`${API_URL}/v1/swarm/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submitted_pair_code: code,
        organization_id: "fire_dept_04",
        // These come from useSettingsStore — updated via GlobalSettingsModal and persisted to localStorage
        livekit_url: livekitUrl,
        livekit_key: livekitKey,
        livekit_secret: livekitSecret,
        zerotier_network_id: zeroTierNetworkId,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("HTTP error " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === "success" || data.status === "claimed successfully") {
          // Bug fix: the backend returns { status, drone: { assigned_name, ... } }
          // Previously this read data.assigned_name (undefined) — now correctly reads data.drone.assigned_name
          const assignedName: string = data.drone?.assigned_name || "Unknown Drone";

          setProvisioned({
            organization_id: "fire_dept_04",
            network_id: data.drone?.zero_tier_ip || zeroTierNetworkId,
            // Use the URL from settings — not hardcoded localhost
            livekit_url: livekitUrl,
            livekit_token: "", // Token is generated server-side and passed to the edge device via beacon
          });
          onSuccess(assignedName);
          onClose();
        } else {
          alert("Claim failed: " + (data.error || "unknown error"));
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Error executing zero-trust claim handshake.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-panel p-8 rounded-2xl max-w-md w-full relative overflow-hidden border border-teal-500/20"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Tactical Teal Glow effect behind the modal */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-ai-cyan/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-2 relative z-10">
              <ShieldCheck className="text-ai-cyan" size={28} />
              <h2 className="text-2xl font-outfit font-bold text-white tracking-wide">Claim Swarm Drone</h2>
            </div>

            <p className="text-slate-400 mb-6 text-sm leading-relaxed relative z-10 font-mono">
              Enter the 6-digit pair PIN displayed on the edge device captive portal to establish a SaaS Zero-Trust handshake.
            </p>

            {/* Show which LiveKit server will be used */}
            <div className="mb-6 relative z-10 text-[10px] font-mono bg-slate-900/60 border border-slate-700/40 rounded-lg px-3 py-2 text-slate-400">
              <span className="text-slate-500">LiveKit Target: </span>
              <span className="text-teal-400">{livekitUrl}</span>
            </div>

            <div className="flex gap-2.5 mb-8 justify-center relative z-10">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-mono bg-slate-950/80 border border-slate-700/50 rounded-xl focus:border-ai-cyan focus:ring-1 focus:ring-ai-cyan outline-none text-white transition-all shadow-inner focus:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                />
              ))}
            </div>

            <button
              onClick={handleClaim}
              disabled={loading || pin.join("").length < 6}
              className="w-full flex justify-center items-center gap-2 bg-ai-cyan/90 hover:bg-ai-cyan disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] relative z-10 cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-slate-950" size={20} />
                  <span>Executing Cryptographic Handshake...</span>
                </>
              ) : (
                <span>Secure Connection</span>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
