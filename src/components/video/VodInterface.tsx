import React, { useRef, useState } from 'react';
import { useVodStore } from '@/store/useVodStore';
import { UploadCloud, Loader2, AlertTriangle } from 'lucide-react';

export const VodInterface = () => {
  const {
    uploadProgress,
    processingState,
    videoUrl,
    setUploadProgress,
    setProcessingState,
    setVideoUrl,
    setVodLogs,
    resetVodState,
  } = useVodStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file.');
      return;
    }
    
    resetVodState();
    setProcessingState('uploading');

    const formData = new FormData();
    formData.append('video', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://127.0.0.1:8000/api/analyze', true);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
          if (percent === 100) {
            setProcessingState('processing');
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          setVideoUrl(res.video_url);
          if (res.logs && res.logs.length > 0) {
            // Convert api logs to TerminalLog format
            const mappedLogs = res.logs.map((l: { type: string; message: string; mavlink?: Record<string, unknown> }, i: number) => ({
              id: `vod-res-${Date.now()}-${i}`,
              timestamp: new Date().toISOString().substring(11, 19),
              droneId: 'VOD-ANALYSIS',
              message: l.type === 'anomaly' 
                ? `YOLO TRIGGER: ${l.message}` 
                : l.mavlink 
                  ? `[Commander] MAVLink Command Generated: \n${JSON.stringify(l.mavlink, null, 2)}`
                  : l.message,
              isAnomaly: l.type === 'anomaly'
            }));
            setVodLogs(mappedLogs);
          }
          setProcessingState('complete');
        } else {
          setProcessingState('error');
          console.error('Upload failed', xhr.responseText);
        }
      };

      xhr.onerror = () => {
        setProcessingState('error');
        console.error('Network Error during upload');
      };

      xhr.send(formData);
    } catch (error) {
      console.error(error);
      setProcessingState('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  if (processingState === 'complete' && videoUrl) {
    return (
      <div className="w-full h-full flex flex-col glass-panel rounded-xl overflow-hidden relative border-teal-500/30">
        <div className="absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-mono text-xs text-teal-400 font-bold tracking-widest">
              VOD ANALYSIS COMPLETE
            </span>
          </div>
          <button
            onClick={resetVodState}
            className="text-xs font-mono px-3 py-1 bg-slate-800/50 hover:bg-slate-700/80 rounded border border-slate-600 transition-colors"
          >
            New Analysis
          </button>
        </div>
        <video 
          src={videoUrl} 
          controls 
          autoPlay 
          className="w-full h-full object-contain bg-black"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full glass-panel rounded-xl flex items-center justify-center p-8 relative overflow-hidden bg-scanlines">
      {(processingState === 'idle' || processingState === 'error') && (
        <form
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onSubmit={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center w-full max-w-lg aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer bg-slate-900/40 backdrop-blur-sm
            ${dragActive ? 'border-teal-400 bg-teal-900/20 scale-105' : 'border-slate-700 hover:border-teal-500/50 hover:bg-slate-800/60'}`}
        >
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="video/*" 
            className="hidden" 
            onChange={handleChange} 
          />
          
          <UploadCloud className={`w-16 h-16 mb-4 ${dragActive ? 'text-teal-400 animate-bounce' : 'text-slate-500'}`} />
          
          <h3 className="text-xl font-mono font-bold text-slate-300 mb-2">
            INITIALIZE VOD PIPELINE
          </h3>
          <p className="text-sm font-mono text-slate-500 text-center max-w-xs">
            Drag & drop raw drone footage (.mp4, .webm) or click to browse.
          </p>

          {processingState === 'error' && (
            <div className="mt-6 flex items-center gap-2 text-orange-400 font-mono text-xs bg-orange-950/50 px-3 py-1.5 rounded border border-orange-500/30">
              <AlertTriangle className="w-4 h-4" />
              <span>Pipeline execution failed. Please check backend.</span>
            </div>
          )}
        </form>
      )}

      {(processingState === 'uploading' || processingState === 'processing') && (
        <div className="flex flex-col items-center justify-center w-full max-w-md">
          <Loader2 className="w-16 h-16 text-teal-400 animate-spin mb-6" />
          
          <h3 className="text-lg font-mono font-bold text-teal-400 tracking-widest mb-2 animate-pulse">
            {processingState === 'uploading' ? 'UPLOADING TO MAAS-LLM...' : 'RUNNING OPENVINO PIPELINE...'}
          </h3>
          
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-teal-500 transition-all duration-300 ease-out relative"
              style={{ width: `${processingState === 'processing' ? 100 : uploadProgress}%` }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
          
          <span className="mt-3 font-mono text-xs text-slate-400">
            {processingState === 'uploading' ? `${uploadProgress}% Complete` : 'Extracting Anomaly & Commander Context'}
          </span>
        </div>
      )}
    </div>
  );
};
