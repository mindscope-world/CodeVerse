import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Sparkles, BrainCircuit, Check } from 'lucide-react';
import { GeminiLiveClient } from '../services/geminiService';
import { AvatarConfig, AvatarEmotion } from '../types';
import { DEFAULT_AVATAR_CONFIG } from '../constants';

interface AvatarInterfaceProps {
  config?: AvatarConfig;
  emotion?: AvatarEmotion;
}

const AvatarInterface: React.FC<AvatarInterfaceProps> = ({ config = DEFAULT_AVATAR_CONFIG, emotion = 'neutral' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // Avatar State
  const [mouthOpen, setMouthOpen] = useState(0);
  const [headPos, setHeadPos] = useState({ x: 0, y: 0 });
  const [aiSpeaking, setAiSpeaking] = useState(false);
  
  // Caption State
  const [caption, setCaption] = useState("");
  const [isTurnComplete, setIsTurnComplete] = useState(false);
  const captionResetTimer = useRef<number | null>(null);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>(0);
  const liveClient = useRef<any>(null);

  // Motion Tracking Constants
  const MOTION_THRESHOLD = 20;
  const MOTION_SMOOTHING = 0.1;
  const DOWNSAMPLE_SIZE = 32;

  // 1. Setup Camera & Audio for Mirroring
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Video Setup
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Audio Setup for Lip Sync (Local)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        setIsCameraOn(true);
      } catch (err) {
        console.error("Media access denied:", err);
        setIsCameraOn(false);
      }
    };

    if (isCameraOn) {
      startMedia();
    } else {
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isCameraOn]);

  // 2. Processing Loop (Motion + Audio)
  useEffect(() => {
    if (!isCameraOn) return;

    let prevFrameData: Uint8ClampedArray | null = null;
    let targetX = 0;
    let targetY = 0;

    const loop = () => {
      // A. Audio Analysis (Lip Sync)
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const average = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
        // Map average (0-255) to mouth open (0-1)
        const val = Math.max(0, (average - 10) / 50); 
        setMouthOpen(prev => prev * 0.7 + val * 0.3); // Smooth
      }

      // B. Motion Tracking (Head Position)
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx && video.readyState === 4) {
          // Draw downsampled frame
          ctx.drawImage(video, 0, 0, DOWNSAMPLE_SIZE, DOWNSAMPLE_SIZE);
          const frameData = ctx.getImageData(0, 0, DOWNSAMPLE_SIZE, DOWNSAMPLE_SIZE).data;

          if (prevFrameData) {
            let xSum = 0, ySum = 0, count = 0;
            
            for (let i = 0; i < frameData.length; i += 4) {
              const rDiff = Math.abs(frameData[i] - prevFrameData[i]);
              const gDiff = Math.abs(frameData[i+1] - prevFrameData[i+1]);
              const bDiff = Math.abs(frameData[i+2] - prevFrameData[i+2]);
              
              if (rDiff + gDiff + bDiff > MOTION_THRESHOLD) {
                const pixelIndex = i / 4;
                const x = pixelIndex % DOWNSAMPLE_SIZE;
                const y = Math.floor(pixelIndex / DOWNSAMPLE_SIZE);
                xSum += x;
                ySum += y;
                count++;
              }
            }

            if (count > 0) {
              const avgX = xSum / count;
              const avgY = ySum / count;
              
              // Map to range -1 to 1 (inverted X for mirror effect)
              targetX = -1 * ((avgX / DOWNSAMPLE_SIZE) - 0.5) * 40; // Multiplier for sensitivity
              targetY = ((avgY / DOWNSAMPLE_SIZE) - 0.5) * 30;
            }
          }
          prevFrameData = frameData;
        }
      }

      // Smooth Interpolation
      setHeadPos(prev => ({
        x: prev.x + (targetX - prev.x) * MOTION_SMOOTHING,
        y: prev.y + (targetY - prev.y) * MOTION_SMOOTHING
      }));

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
  }, [isCameraOn]);

  const toggleLiveSession = async () => {
    if (isLive) {
      if (liveClient.current) {
        liveClient.current.disconnect();
        liveClient.current = null;
      }
      setIsLive(false);
      setAiSpeaking(false);
      setCaption("");
      setIsTurnComplete(false);
    } else {
      const client = new GeminiLiveClient();
      setIsLive(true);
      setCaption("");
      setIsTurnComplete(false);
      
      try {
        const connection = await client.connect({
            onAudioData: (level) => {
               setAiSpeaking(level > 0.05);
            },
            onCaption: (text, isUser, turnComplete) => {
                if (turnComplete) {
                    setIsTurnComplete(true);
                    if (captionResetTimer.current) clearTimeout(captionResetTimer.current);
                    captionResetTimer.current = window.setTimeout(() => {
                        setCaption("");
                        setIsTurnComplete(false);
                    }, 3000);
                } else if (isUser) {
                    setIsTurnComplete(false);
                    if (captionResetTimer.current) clearTimeout(captionResetTimer.current);
                    setCaption(prev => prev + text);
                }
            },
            onClose: () => setIsLive(false)
        });
        liveClient.current = connection;
      } catch (e) {
        console.error("Failed to connect live", e);
        setIsLive(false);
      }
    }
  };

  // --- Visual Helpers ---

  const getColorClass = (colorName: string) => {
    switch (colorName) {
      case 'rose': return 'bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)]';
      case 'emerald': return 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]';
      case 'amber': return 'bg-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.4)]';
      case 'sky': return 'bg-sky-500 shadow-[0_0_40px_rgba(14,165,233,0.4)]';
      default: return 'bg-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.4)]';
    }
  };

  const getShapeClass = (shapeId: string) => {
      switch(shapeId) {
          case 'robot_round': return 'rounded-full';
          case 'robot_square': return 'rounded-3xl';
          default: return 'rounded-[2.5rem]';
      }
  };

  // --- Emotion Logic ---
  const getEyebrowStyle = () => {
      const base = "absolute -top-3 w-8 h-2 bg-slate-800 rounded-full transition-all duration-500";
      switch(emotion) {
          case 'happy': return { left: `${base} -translate-y-2 rotate-12`, right: `${base} -translate-y-2 -rotate-12` };
          case 'sad': return { left: `${base} translate-y-1 -rotate-12`, right: `${base} translate-y-1 rotate-12` };
          case 'focused': return { left: `${base} translate-y-2 rotate-12`, right: `${base} translate-y-2 -rotate-12` };
          case 'thinking': return { left: `${base} -translate-y-1`, right: `${base} translate-y-1 -rotate-6` };
          case 'surprised': return { left: `${base} -translate-y-4`, right: `${base} -translate-y-4` };
          default: return { left: `${base}`, right: `${base}` }; // Neutral
      }
  };

  const getMouthStyle = () => {
    // We use a combination of border radius and scaling to create mouth shapes
    const baseWidth = Math.max(20, mouthOpen * 50);
    const baseHeight = Math.max(4, mouthOpen * 40);
    
    let style: React.CSSProperties = {
        width: `${baseWidth}px`,
        height: `${baseHeight}px`,
        transition: 'all 0.3s ease-out'
    };

    if (mouthOpen < 0.1) {
        // If not talking, show static emotion mouth
        switch(emotion) {
            case 'happy': 
                return { ...style, width: '24px', height: '12px', borderRadius: '0 0 20px 20px', backgroundColor: 'transparent', borderBottom: '4px solid white' };
            case 'sad':
                return { ...style, width: '24px', height: '12px', borderRadius: '20px 20px 0 0', backgroundColor: 'transparent', borderTop: '4px solid white', marginTop: '10px' };
            case 'surprised':
                return { ...style, width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white' };
            case 'focused':
                return { ...style, width: '20px', height: '4px', borderRadius: '2px', backgroundColor: 'white' };
            case 'thinking':
                 return { ...style, width: '12px', height: '6px', borderRadius: '4px', backgroundColor: 'white', transform: 'translateX(8px)' };
            default: // Neutral
                return { ...style, width: '20px', height: '4px', borderRadius: '2px', backgroundColor: 'white' };
        }
    }

    // Talking - standard oval
    return { ...style, borderRadius: mouthOpen > 0.5 ? '50%' : '12px', backgroundColor: 'white' };
  };

  const eyebrows = getEyebrowStyle();
  const mouthStyle = getMouthStyle();

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-sky-100 flex flex-col gap-4 relative overflow-hidden h-full">
      
      {/* Header */}
      <div className="flex justify-between items-center z-10 px-1 shrink-0">
        <h3 className="text-sm font-bold text-sky-800 flex items-center gap-2">
            My Avatar
            {isCameraOn && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>}
        </h3>
        <button 
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`p-2 rounded-full transition-colors ${isCameraOn ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}
            title={isCameraOn ? "Stop Mirroring" : "Start Mirroring"}
        >
            {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
      </div>

      {/* Hidden processing elements */}
      <video ref={videoRef} muted playsInline className="hidden" width={DOWNSAMPLE_SIZE} height={DOWNSAMPLE_SIZE} />
      <canvas ref={canvasRef} width={DOWNSAMPLE_SIZE} height={DOWNSAMPLE_SIZE} className="hidden" />

      {/* Main Visual Stage */}
      <div className="relative flex-1 min-h-[200px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner group w-full mx-auto">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {!isCameraOn && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center z-0">
                <VideoOff size={32} className="mb-2 opacity-50" />
                <span className="text-xs font-bold">Camera Off</span>
                <span className="text-[10px] mt-1">Turn on to control avatar</span>
             </div>
        )}

        {aiSpeaking && (
            <div className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur text-indigo-900 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                <BrainCircuit size={12} className="text-indigo-500" />
                CodeBot Speaking...
            </div>
        )}

        {caption && (
             <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-[90%] px-4">
                 <div className={`
                    backdrop-blur-sm text-xs font-medium p-3 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-2 text-center relative transition-colors duration-300
                    ${isTurnComplete ? 'bg-green-50/95 text-green-800 border-green-200' : 'bg-white/95 text-slate-800 border-indigo-100'}
                 `}>
                     "{caption}"
                     {isTurnComplete && <Check size={12} className="inline-block ml-1.5 -mt-0.5 text-green-500" />}
                     <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 transform rotate-45 border-b border-r transition-colors duration-300 ${isTurnComplete ? 'bg-green-50 border-green-200' : 'bg-white border-indigo-100'}`}></div>
                 </div>
             </div>
        )}

        {/* The Avatar Container (Moves with Head) */}
        <div 
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-transform duration-100 ease-out"
            style={{ 
                transform: `translate(${headPos.x}px, ${headPos.y}px) scale(${isCameraOn ? 1 : 0.9})`,
            }}
        >
            {/* The Robot Character */}
            <div className={`relative transition-all duration-300 ${getColorClass(config.color)} ${getShapeClass(config.baseId)} w-36 h-36 border-4 border-white flex flex-col items-center justify-center`}>
                
                {/* Eyes Container */}
                <div className="flex gap-5 mb-4 relative z-10">
                     {/* Left Eye Group */}
                     <div className="relative">
                         <div className={eyebrows.left}></div>
                         <div className={`w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden relative transition-all duration-300 ${emotion === 'happy' ? 'h-6 mt-2' : ''} ${emotion === 'thinking' ? 'h-7 mt-1' : ''}`}>
                            <div 
                                className={`w-3 h-3 rounded-full transition-transform duration-75 ${config.color === 'amber' ? 'bg-amber-900' : 'bg-indigo-900'}`}
                                style={{ transform: `translate(${headPos.x * 0.5}px, ${headPos.y * 0.5}px)` }}
                            ></div>
                            <div className="absolute inset-0 bg-indigo-900 animate-[blink_4s_infinite] opacity-0"></div> 
                         </div>
                     </div>
                     
                     {/* Right Eye Group */}
                     <div className="relative">
                         <div className={eyebrows.right}></div>
                         <div className={`w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden relative transition-all duration-300 ${emotion === 'happy' ? 'h-6 mt-2' : ''}`}>
                            <div 
                                className={`w-3 h-3 rounded-full transition-transform duration-75 ${config.color === 'amber' ? 'bg-amber-900' : 'bg-indigo-900'}`}
                                style={{ transform: `translate(${headPos.x * 0.5}px, ${headPos.y * 0.5}px)` }}
                            ></div>
                             <div className="absolute inset-0 bg-indigo-900 animate-[blink_4s_infinite_0.1s] opacity-0"></div>
                         </div>
                     </div>
                </div>
                
                {/* Mouth - Dynamic */}
                <div style={mouthStyle}></div>
                
                {/* Dynamic Accessories */}
                {config.accessoryId === 'antenna_simple' && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-1.5 h-6 bg-white/80"></div>
                        <div className={`w-4 h-4 rounded-full ${isLive ? 'bg-red-500 animate-ping' : 'bg-red-400'}`}></div>
                    </div>
                )}
                
                {config.accessoryId === 'antenna_double' && (
                    <>
                        <div className="absolute -top-6 left-6 w-1 h-8 bg-white/80 -rotate-12 origin-bottom"></div>
                        <div className="absolute -top-6 right-6 w-1 h-8 bg-white/80 rotate-12 origin-bottom"></div>
                        <div className="absolute -top-8 left-4 w-3 h-3 rounded-full bg-green-400"></div>
                        <div className="absolute -top-8 right-4 w-3 h-3 rounded-full bg-green-400"></div>
                    </>
                )}

                {config.accessoryId === 'hat_party' && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-b-[60px] border-b-yellow-400 filter drop-shadow-md"></div>
                )}

                {config.accessoryId === 'headphones' && (
                    <>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-44 h-28 border-[6px] border-slate-800 rounded-t-full -z-10"></div>
                            <div className="absolute top-6 -left-6 w-10 h-16 bg-slate-800 rounded-xl border-l-4 border-slate-600"></div>
                            <div className="absolute top-6 -right-6 w-10 h-16 bg-slate-800 rounded-xl border-r-4 border-slate-600"></div>
                    </>
                )}
            </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-30 pointer-events-auto gap-3">
            <button 
                onClick={toggleLiveSession}
                disabled={!isCameraOn}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 text-sm ${
                    !isCameraOn
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isLive 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
                {isLive ? (
                    <>
                        <MicOff size={16} /> End Chat
                    </>
                ) : (
                    <>
                        <Sparkles size={16} /> Ask CodeBot
                    </>
                )}
            </button>
        </div>
      </div>
      
      <p className="text-center text-slate-500 text-xs shrink-0">
        {!isCameraOn ? "Enable camera to animate your avatar!" : 
         isLive ? "Ask CodeBot a question..." : "You are in Mirror Mode. Practice speaking!"}
      </p>

      {/* Style block for blink animation */}
      <style>{`
        @keyframes blink {
            0%, 48%, 52%, 100% { opacity: 0; }
            50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AvatarInterface;