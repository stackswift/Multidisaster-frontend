"use client";

import React, { useState } from "react";
import { Settings, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/store/useSettingsStore";

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
  const { livekitUrl, livekitKey, livekitSecret, zeroTierNetworkId, setSettings } = useSettingsStore();

  const [localUrl, setLocalUrl] = useState(livekitUrl);
  const [localKey, setLocalKey] = useState(livekitKey);
  const [localSecret, setLocalSecret] = useState(livekitSecret);
  const [localZt, setLocalZt] = useState(zeroTierNetworkId);

  const handleSave = () => {
    setSettings({
      livekitUrl: localUrl,
      livekitKey: localKey,
      livekitSecret: localSecret,
      zeroTierNetworkId: localZt,
    });
    onClose();
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
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Settings className="text-teal-400" size={24} />
              <h2 className="text-xl font-mono font-bold text-white tracking-wide">Global Config</h2>
            </div>

            <div className="space-y-4 relative z-10 font-mono text-sm">
              <div>
                <label className="block text-slate-400 text-xs mb-1">LiveKit Server URL</label>
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="e.g. wss://your-livekit-server"
                />
              </div>
              
              <div>
                <label className="block text-slate-400 text-xs mb-1">LiveKit API Key</label>
                <input
                  type="text"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="e.g. devkey"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">LiveKit API Secret</label>
                <input
                  type="password"
                  value={localSecret}
                  onChange={(e) => setLocalSecret(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="e.g. secret"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">ZeroTier Network ID</label>
                <input
                  type="text"
                  value={localZt}
                  onChange={(e) => setLocalZt(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="e.g. a1b2c3d4e5f6g7h8"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="mt-8 w-full flex justify-center items-center gap-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] relative z-10 font-mono text-sm cursor-pointer"
            >
              <Save size={16} />
              Save Settings
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
