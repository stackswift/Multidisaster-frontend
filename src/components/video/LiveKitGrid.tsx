'use client';

import React, { useEffect, useState, memo } from 'react';
import {
  LiveKitRoom,
  ParticipantTile,
  useTracks,
  useDataChannel,
  RoomAudioRenderer,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, Room, RoomEvent, ConnectionState } from 'livekit-client';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { useProvisionStore } from '@/store/useProvisionStore';

interface LiveKitGridProps {
  serverUrl?: string;
  roomName?: string;
}


import { RawTelemetryPayload } from '@/workers/telemetry.worker';
import { TrackReferenceOrPlaceholder } from '@livekit/components-react';

const MockDroneFeed = ({ drone }: { drone: RawTelemetryPayload }) => {
  const isAnomaly = drone.ai_status?.anomaly_detected ?? false;
  
  return (
    <div
      className={`relative rounded-xl overflow-hidden border bg-slate-950/90 flex flex-col transition-all duration-300 ${
        isAnomaly
          ? 'border-orange-500/80 shadow-[0_0_20px_rgba(255,85,0,0.2)]'
          : 'border-teal-500/20 hover:border-teal-500/40'
      }`}
      style={{ height: '180px' }}
    >
      {/* Simulation Screen */}
      <div className="flex-1 relative overflow-hidden bg-black/95 flex items-center justify-center">
        {/* Animated Scan Lines */}
        <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-15 animate-scanline"></div>
        
        {/* Camera HUD Grid */}
        <div className="absolute inset-2 pointer-events-none border border-teal-500/10 flex items-center justify-center">
          {/* Crosshair */}
          <div className="w-6 h-6 border border-teal-500/20 rounded-full relative">
            <div className="absolute top-1/2 left-0 w-6 h-[1px] bg-teal-500/20 -translate-y-1/2"></div>
            <div className="absolute left-1/2 top-0 w-[1px] h-6 bg-teal-500/20 -translate-x-1/2"></div>
          </div>
          
          {/* Artificial Horizon / Pitch Indicator */}
          <div className="absolute inset-x-6 flex justify-between items-center text-teal-500/20 text-[8px] font-mono">
            <span>-10</span>
            <div className="w-12 h-[1px] bg-teal-500/10"></div>
            <span>-10</span>
          </div>
        </div>

        {/* Static noise effect */}
        <div className="absolute inset-0 opacity-5 mix-blend-overlay bg-noise"></div>

        {/* Video simulation or details */}
        {isAnomaly ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-950/10">
            {/* Target acquisition box */}
            <div className="w-28 h-20 border-2 border-dashed border-orange-500/60 rounded relative flex flex-col items-center justify-center gap-0.5 p-1 animate-pulse">
              <span className="text-[7px] font-mono text-orange-400 font-bold bg-slate-950 px-1 border border-orange-500/20 absolute -top-2">
                TARGET_LOCK
              </span>
              <span className="text-[9px] font-mono text-orange-400 font-bold tracking-wider text-center">
                {drone.ai_status.anomaly_type.toUpperCase()}
              </span>
              <span className="text-[8px] font-mono text-orange-400">
                CONF: {(drone.ai_status.confidence * 100).toFixed(0)}%
              </span>
            </div>
            
            {/* Flashing alert overlay */}
            <div className="absolute top-2 right-2 bg-orange-600/90 border border-orange-400 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded animate-flash shrink-0 z-10 shadow-lg">
              WARN: ANOMALY
            </div>
          </div>
        ) : (
          <div className="text-teal-500/30 font-mono text-[9px] flex flex-col items-center gap-0.5 select-none">
            <span className="tracking-widest">FEED_ACTIVE</span>
            <span className="text-[8px] opacity-75">SURVEILLANCE_OK</span>
          </div>
        )}

        {/* Bottom Status bar overlay */}
        <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between items-end font-mono text-[8px] text-teal-400/80 z-10 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/30">
          <div className="flex flex-col">
            <span>LAT: {drone.gps.lat.toFixed(5)}</span>
            <span>LON: {drone.gps.lon.toFixed(5)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span>ALT: {drone.gps.alt_rel_m.toFixed(1)}m</span>
            <span>BAT: {drone.battery ?? 88}%</span>
          </div>
        </div>

        {/* Top telemetry status bar */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start font-mono text-[8px] z-10">
          <div className="flex items-center gap-1.5 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800 shadow-md">
            <span className={`w-1.5 h-1.5 rounded-full ${isAnomaly ? 'bg-orange-500 animate-ping' : 'bg-teal-400'}`} />
            <span className="text-slate-200 font-bold">{drone.drone_id}</span>
          </div>
          <div className="bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800 shadow-md text-slate-300">
            HDG: {((drone.gps.lat + drone.gps.lon) * 10000 % 360).toFixed(0)}°
          </div>
        </div>
      </div>
    </div>
  );
};

const MockVideoTracksGrid = () => {
  const drones = useTelemetryStore((state) => state.drones);
  const droneList = Object.values(drones);

  if (droneList.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center">
          <span className="text-slate-600 font-mono text-lg font-bold">!</span>
        </div>
        <span className="text-slate-500 font-mono text-[10px] animate-pulse tracking-wider">AWAITING EDGE VIDEO FEEDS</span>
        <span className="text-slate-700 font-mono text-[9px]">Provision a drone to begin streaming</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 h-full w-full overflow-y-auto custom-scrollbar pr-1">
      {droneList.map((drone) => (
        <MockDroneFeed key={drone.drone_id} drone={drone} />
      ))}
    </div>
  );
};

interface BBox {
  label: string;
  conf: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const MemoizedParticipantTile = memo(({ trackRef, hasAnomaly, bboxes }: { trackRef: TrackReferenceOrPlaceholder; hasAnomaly: boolean; bboxes?: BBox[] }) => {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border transition-all duration-300 flex items-center justify-center bg-black ${
        hasAnomaly
          ? 'border-orange-500 shadow-[0_0_20px_rgba(255,85,0,0.4)] animate-pulse'
          : 'border-teal-500/20 hover:border-teal-500/40'
      }`}
      style={{ contain: 'strict' }}
    >
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 [&>div]:h-full [&>div]:w-full [&>div>video]:object-cover">
          <ParticipantTile trackRef={trackRef} />
        </div>

        {/* Custom Placeholder Overlay for VOD Loading State */}
        {(!trackRef.publication) && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md border border-teal-500/20">
            <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mb-3"></div>
            <span className="text-teal-400 font-mono font-bold tracking-widest text-[10px] animate-pulse">PROCESSING VIDEO UPLOAD...</span>
            <span className="text-teal-500/50 font-mono text-[8px] mt-1">ENCODING & RE-ESTABLISHING FEED</span>
          </div>
        )}
        
        {/* YOLO Bounding Boxes Overlay */}
        {bboxes && bboxes.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-20">
          {bboxes.map((box, i) => (
            <div
              key={i}
              className={`absolute border-2 transition-all duration-75 ${
                box.label.toLowerCase() === 'fire' 
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_10px_rgba(255,85,0,0.3)]' 
                  : 'border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(0,122,255,0.3)]'
              }`}
              style={{
                left: `${box.x1 * 100}%`,
                top: `${box.y1 * 100}%`,
                width: `${(box.x2 - box.x1) * 100}%`,
                height: `${(box.y2 - box.y1) * 100}%`
              }}
            >
              <span className={`absolute -top-4 left-[-2px] text-white font-mono font-bold text-[9px] px-1 whitespace-nowrap z-30 ${
                box.label.toLowerCase() === 'fire' ? 'bg-orange-500' : 'bg-blue-500'
              }`}>
                {box.label.toUpperCase()} {(box.conf * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
      </div>

      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded border border-slate-800 text-[10px] font-mono">
        <span className={`w-2 h-2 rounded-full ${hasAnomaly ? 'bg-orange-500 animate-ping' : 'bg-teal-400'}`} />
        <span className="text-slate-200 font-semibold">
          {trackRef.participant.identity || 'Drone_Feed'}
        </span>
        <span className="text-slate-400">640x360@15fps</span>
      </div>
    </div>
  );
});

MemoizedParticipantTile.displayName = 'MemoizedParticipantTile';

const VideoTracksGrid = () => {
  const processLLMDataChannel = useTelemetryStore((state) => state.processLLMDataChannel);
  
  const participants = useParticipants();
  useEffect(() => {
    console.log('[LiveKit Debug] Participants in room:', participants.length, participants.map(p => p.identity));
  }, [participants]);
  
  useDataChannel(
    'telemetry',
    (msg) => {
      try {
        const payloadStr = new TextDecoder().decode(msg.payload);
        const payload = JSON.parse(payloadStr) as { ai_status?: unknown };
        if (payload.ai_status) {
          processLLMDataChannel(payload as Record<string, unknown>);
        }
      } catch {
        console.error('Failed to parse datachannel msg');
      }
    }
  );

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Unknown, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { onlySubscribed: false } // Change to false to get ALL tracks even if not explicitly subscribed
  );

  useEffect(() => {
    console.log('[LiveKit Debug] Received tracks:', tracks.length, tracks.map(t => ({ sid: t.publication?.trackSid, source: t.source, kind: t.publication?.kind })));
  }, [tracks]);

  const activeAnomalies = useTelemetryStore((state) => state.activeAnomalies);
  const drones = useTelemetryStore((state) => state.drones);
  const anomalyIds = new Set(activeAnomalies.map((a) => a.drone_id));

  // Fallback to emulated mock drone feeds if no real remote camera feeds are publishing
  if (tracks.length === 0) {
    return <MockVideoTracksGrid />;
  }

  // DE-DUPLICATE TRACKS: Ensure only ONE tile is rendered per drone!
  // If the edge daemon has ghost tracks, placeholders, or concurrent publishes, we group by identity
  // and prioritize active publications over placeholders.
  const uniqueTracksMap = new Map<string, TrackReferenceOrPlaceholder>();
  
  tracks.forEach(trackRef => {
    const id = trackRef.participant.identity;
    
    // Find a matching drone regardless of case differences
    const matchedDroneId = Object.keys(drones).find(
      key => key.toLowerCase() === id.toLowerCase()
    );

    // Ignore ghost LiveKit participants from previous tests!
    if (!matchedDroneId) return;

    if (!uniqueTracksMap.has(id)) {
      uniqueTracksMap.set(id, trackRef);
    } else {
      const existing = uniqueTracksMap.get(id)!;
      // If we currently have a placeholder, but we found an actual video track, swap it!
      if (!existing.publication && trackRef.publication) {
        uniqueTracksMap.set(id, trackRef);
      }
    }
  });

  const uniqueTracks = Array.from(uniqueTracksMap.values());

  return (
    <div className="grid grid-cols-1 gap-3 h-full w-full overflow-y-auto custom-scrollbar">
      {uniqueTracks.map((trackRef, index) => {
        const droneId = trackRef.participant.identity;
        const hasAnomaly = anomalyIds.has(droneId);
        const drone = drones[droneId];
        const bboxes = drone?.ai_status?.bboxes;

        return (
          <MemoizedParticipantTile
            key={`${droneId}_${index}`}
            trackRef={trackRef}
            hasAnomaly={hasAnomaly}
            bboxes={bboxes}
          />
        );
      })}
    </div>
  );
};

export const LiveKitGrid: React.FC<LiveKitGridProps> = ({
  serverUrl: _serverUrl,
  roomName = 'swarm-command-room',
}) => {
  const claimDetails = useProvisionStore((state) => state.claimDetails);
  const serverUrl = claimDetails?.livekit_url || _serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://127.0.0.1:7880';
  
  const [token, setToken] = useState<string>(claimDetails?.livekit_token || '');
  const [error, setError] = useState<string | null>(null);
  const [connectFailed, setConnectFailed] = useState(false);
  const [room] = useState(() => new Room());

  // Synchronize derived token if claimDetails updates
  const activeToken = claimDetails?.livekit_token || token;

  useEffect(() => {
    // Automatically use the token granted from the secure Zero-Trust handshake
    if (claimDetails?.livekit_token) {
      // Avoid calling setState() directly within an effect if derived from props
      return;
    } else {
      // Fallback for isolated frontend testing without full backend provision
      let isMounted = true;
      async function fetchToken() {
        try {
          const res = await fetch(`/api/livekit/token?room=${encodeURIComponent(roomName)}`);
          const data = await res.json();
          if (isMounted) {
            if (data.token) {
              setToken(data.token);
            } else {
              setError(data.error || 'Token creation failed');
            }
          }
        } catch {
          if (isMounted) setError('Network error requesting token');
        }
      }
      fetchToken();
      return () => { isMounted = false; };
    }
  }, [claimDetails, roomName]);

  useEffect(() => {
    if (!activeToken) return;

    const handleStateChange = (state: ConnectionState) => {
      if (state === ConnectionState.Connected) {
        setConnectFailed(false);
      } else if (state === ConnectionState.Disconnected) {
        setConnectFailed(true);
      }
    };

    room.on(RoomEvent.ConnectionStateChanged, handleStateChange);

    // Set a connection timeout of 10 seconds to allow slow WebRTC handshakes
    const timeoutId = setTimeout(() => {
      if (room.state !== ConnectionState.Connected) {
        setConnectFailed(true);
        // Forcefully disconnect room to abort retries and clean up sockets
        room.disconnect();
      }
    }, 10000);

    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleStateChange);
      clearTimeout(timeoutId);
    };
  }, [room, activeToken]);

  if (error) {
    return (
      <div className="w-full h-full glass-panel flex flex-col items-center justify-center p-4 text-center font-mono">
        <span className="text-orange-500 text-xs font-bold mb-1">LIVEKIT CONNECTION ERROR</span>
        <span className="text-slate-400 text-[10px]">{error}</span>
      </div>
    );
  }

  if (!activeToken) {
    return (
      <div className="w-full h-full glass-panel flex items-center justify-center font-mono text-xs text-teal-400/70">
        <span className="animate-pulse">INITIALIZING WEBRTC STREAMS...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full glass-panel rounded-xl p-2 overflow-hidden flex flex-col animate-fadeIn">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 px-2">
        <span className="text-xs font-mono font-bold text-teal-400 tracking-wider">
          LIVEKIT MULTI-STREAM GRID
        </span>
        {connectFailed ? (
          <span className="text-[10px] font-mono text-orange-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            HUD EMULATION
          </span>
        ) : (
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LOW-LATENCY WEBRTC
          </span>
        )}
      </div>
      <div className="flex-1 relative min-h-0">
        {connectFailed ? (
          <MockVideoTracksGrid />
        ) : (
          <LiveKitRoom
            room={room}
            video={false}
            audio={false}
            token={activeToken}
            serverUrl={serverUrl}
            data-lk-theme="default"
            style={{ height: '100%' }}
            connect={true}
          >
            <VideoTracksGrid />
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
};
