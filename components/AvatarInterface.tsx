import React, { useEffect, useRef, useState } from 'react';
import { MicOff, Video, VideoOff, Sparkles, BrainCircuit, Check, Loader2, Disc, MessageSquare, Mic, Send } from 'lucide-react';
import { GeminiLiveClient } from '../services/geminiService';
import { AvatarConfig, AvatarEmotion } from '../types';
import { DEFAULT_AVATAR_CONFIG, AVATAR_OPTIONS } from '../constants';
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

interface AvatarInterfaceProps {
  config?: AvatarConfig;
  emotion?: AvatarEmotion; // External override emotion
  isRecording?: boolean; // NEW: Visual state for recording
}

// Internal state for the visual engine
interface ExpressionState {
  mouthOpen: number;     // 0.0 - 1.0
  eyebrowLift: number;   // -1.0 (angry) to 1.0 (surprised)
  eyeX: number;          // -1.0 (left) to 1.0 (right)
  eyeY: number;          // -1.0 (up) to 1.0 (down)
  headTilt: number;      // degrees
  headX: number;         // pixels
  headY: number;         // pixels
  detectedEmotion: AvatarEmotion | 'neutral';
}

const AvatarInterface: React.FC<AvatarInterfaceProps> = ({ config = DEFAULT_AVATAR_CONFIG, emotion: overrideEmotion = 'neutral', isRecording = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  
  // Q&A State
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  
  // Avatar Rendering State
  const [expr, setExpr] = useState<ExpressionState>({
    mouthOpen: 0, eyebrowLift: 0, eyeX: 0, eyeY: 0, headTilt: 0, headX: 0, headY: 0, detectedEmotion: 'neutral'
  });
  
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [isTurnComplete, setIsTurnComplete] = useState(false);
  
  // Refs
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const liveClient = useRef<any>(null);
  const captionResetTimer = useRef<number | null>(null);

  // --- 1. Initialize Computer Vision (MediaPipe) ---
  useEffect(() => {
    const loadModel = async () => {
      if (faceLandmarkerRef.current) return;
      
      setModelLoading(true);
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        console.log("Face Landmarker Loaded");
      } catch (err) {
        console.error("Failed to load Face Landmarker", err);
      } finally {
        setModelLoading(false);
      }
    };
    
    if (isCameraOn) {
      loadModel();
    }
  }, [isCameraOn]);

  // --- 2. Camera & Tracking Loop ---
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera denied:", err);
        setIsCameraOn(false);
      }
    };

    if (isCameraOn) {
      startCamera();
      requestRef.current = requestAnimationFrame(predictWebcam);
    } else {
      if (videoRef.current) videoRef.current.srcObject = null;
      cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraOn]);

  const predictWebcam = () => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;
    
    if (video && landmarker && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      
      try {
          const startTimeMs = performance.now();
          const result = landmarker.detectForVideo(video, startTimeMs);

          if (result.faceBlendshapes && result.faceBlendshapes.length > 0 && result.faceLandmarks.length > 0) {
              const shapes = result.faceBlendshapes[0].categories;
              const landmarks = result.faceLandmarks[0]; 
              
              const getShape = (name: string) => shapes.find(s => s.categoryName === name)?.score || 0;

              const jawOpen = getShape('jawOpen');
              const smileLeft = getShape('mouthSmileLeft');
              const smileRight = getShape('mouthSmileRight');
              const browInnerUp = getShape('browInnerUp');
              const browOuterUpLeft = getShape('browOuterUpLeft');
              const browDownLeft = getShape('browDownLeft');
              const eyeLookInLeft = getShape('eyeLookInLeft');
              const eyeLookOutLeft = getShape('eyeLookOutLeft');
              const eyeLookUp = getShape('eyeLookUpLeft');
              const eyeLookDown = getShape('eyeLookDownLeft');

              const alpha = 0.2; 
              
              setExpr(prev => {
                const targetMouth = jawOpen;
                const targetBrow = (browInnerUp + browOuterUpLeft) - browDownLeft;
                const targetEyeX = (eyeLookInLeft - eyeLookOutLeft) * 2; 
                const targetEyeY = (eyeLookDown - eyeLookUp) * 1.5;

                const nose = landmarks[1];
                const targetHeadX = (nose.x - 0.5) * -100; 
                const targetHeadY = (nose.y - 0.5) * 80;

                const leftEye = landmarks[33];
                const rightEye = landmarks[263];
                const dx = rightEye.x - leftEye.x;
                const dy = rightEye.y - leftEye.y;
                const targetTilt = (Math.atan2(dy, dx) * 180 / Math.PI) * -1; 

                let emotion: AvatarEmotion = 'neutral';
                const smile = (smileLeft + smileRight) / 2;
                if (smile > 0.4) emotion = 'happy';
                else if (browInnerUp > 0.4 && jawOpen > 0.2) emotion = 'surprised';
                else if (browDownLeft > 0.5) emotion = 'focused';
                else if (targetBrow < -0.2) emotion = 'thinking';

                return {
                    mouthOpen: prev.mouthOpen + (targetMouth - prev.mouthOpen) * alpha,
                    eyebrowLift: prev.eyebrowLift + (targetBrow - prev.eyebrowLift) * alpha,
                    eyeX: prev.eyeX + (targetEyeX - prev.eyeX) * alpha,
                    eyeY: prev.eyeY + (targetEyeY - prev.eyeY) * alpha,
                    headX: prev.headX + (targetHeadX - prev.headX) * alpha,
                    headY: prev.headY + (targetHeadY - prev.headY) * alpha,
                    headTilt: prev.headTilt + (targetTilt - prev.headTilt) * alpha,
                    detectedEmotion: emotion
                };
              });
          }
      } catch (e) {
        console.warn("Tracking error", e);
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  // --- 3. Live Audio Integration (Gemini) ---
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
            onAudioData: (level) => setAiSpeaking(level > 0.05),
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

  // --- 4. Render Helpers (Same as before) ---
  const currentEmotion = isCameraOn ? expr.detectedEmotion : overrideEmotion;
  const getSimulatedExpr = () => {
      switch(overrideEmotion) {
          case 'happy': return { mouth: 0.2, brow: 0.3, tilt: 5 };
          case 'sad': return { mouth: 0, brow: -0.3, tilt: -10 };
          case 'surprised': return { mouth: 0.5, brow: 0.8, tilt: 0 };
          case 'focused': return { mouth: 0, brow: -0.5, tilt: 0 };
          case 'thinking': return { mouth: 0, brow: -0.2, tilt: 15 };
          default: return { mouth: 0, brow: 0, tilt: 0 };
      }
  };

  const sim = getSimulatedExpr();
  const activeMouth = isCameraOn ? expr.mouthOpen : sim.mouth;
  const activeBrow = isCameraOn ? expr.eyebrowLift : sim.brow;
  const activeTilt = isCameraOn ? expr.headTilt : sim.tilt;
  const activeHeadX = isCameraOn ? expr.headX : 0;
  const activeHeadY = isCameraOn ? expr.headY : 0;
  const activeEyeX = isCameraOn ? expr.eyeX : 0;
  const activeEyeY = isCameraOn ? expr.eyeY : 0;

  const getSkinColor = () => AVATAR_OPTIONS.skinTones.find(s => s.id === config.skinTone)?.value || '#fce5d4';
  const getHairColor = () => AVATAR_OPTIONS.hairColors.find(s => s.id === config.hairColor)?.value || '#5d4037';
  const getEyeColor = () => AVATAR_OPTIONS.eyeColors.find(s => s.id === config.eyeColor)?.value || '#2196f3';
  const getRobotColor = () => AVATAR_OPTIONS.robotColors.find(s => s.id === config.color)?.value || 'bg-indigo-500';
  const getClothingClass = () => AVATAR_OPTIONS.clothing.find(s => s.id === config.clothing)?.value || 'bg-blue-500';

  const getEyebrowStyle = () => {
      const liftPx = activeBrow * -10; 
      const rotateDeg = activeBrow * 20;
      const common = {
          backgroundColor: config.style === 'human' ? getHairColor() : undefined,
          className: config.style === 'human' ? '' : 'bg-slate-800',
          transition: 'transform 0.1s ease-out'
      };
      return {
          left: { ...common, transform: `translateY(${liftPx}px) rotate(${rotateDeg}deg)` },
          right: { ...common, transform: `translateY(${liftPx}px) rotate(${-rotateDeg}deg)` }
      };
  };

  const getMouthStyle = () => {
    const width = 20 + (activeMouth * 40);
    const height = 4 + (activeMouth * 30);
    const radius = activeMouth > 0.2 ? '50%' : '10px';
    const bg = config.style === 'human' ? '#d84315' : 'white';
    
    const borderRadius = currentEmotion === 'happy' && activeMouth < 0.2 ? '0 0 20px 20px' : radius;
    const borderTop = currentEmotion === 'sad' && activeMouth < 0.2 ? '4px solid' : '0';

    return {
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: borderRadius,
        backgroundColor: activeMouth < 0.1 && (currentEmotion === 'happy' || currentEmotion === 'sad') ? 'transparent' : bg,
        borderBottom: currentEmotion === 'happy' && activeMouth < 0.1 ? `4px solid ${bg}` : 'none',
        borderTop: borderTop,
        borderColor: bg,
        transition: 'all 0.1s ease-out',
        position: 'absolute' as const,
        bottom: '25px',
        left: '50%',
        transform: 'translateX(-50%)'
    };
  };

  const RenderAccessories = () => (
      <>
        {config.accessoryId === 'glasses' && (
             <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-28 h-10 flex justify-between items-center z-20 pointer-events-none">
                 <div className="w-10 h-10 rounded-full border-4 border-slate-800 bg-black/10"></div>
                 <div className="w-4 h-1 bg-slate-800"></div>
                 <div className="w-10 h-10 rounded-full border-4 border-slate-800 bg-black/10"></div>
             </div>
        )}
        {config.accessoryId === 'hat_party' && (
             <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-b-[60px] border-b-yellow-400 filter drop-shadow-md z-30" style={{ transform: `rotate(${-activeTilt}deg)` }}></div>
        )}
        {config.accessoryId === 'antenna_simple' && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                <div className="w-1.5 h-6 bg-slate-400"></div>
                <div className={`w-4 h-4 rounded-full ${isLive ? 'bg-red-500 animate-ping' : 'bg-red-400'}`}></div>
            </div>
        )}
        {config.accessoryId === 'headphones' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-32 pointer-events-none z-30">
                <div className="absolute -top-4 left-0 right-0 h-12 border-[8px] border-slate-800 rounded-t-full"></div>
                <div className="absolute top-8 -left-4 w-10 h-14 bg-slate-800 rounded-xl border-l-4 border-slate-600"></div>
                <div className="absolute top-8 -right-4 w-10 h-14 bg-slate-800 rounded-xl border-r-4 border-slate-600"></div>
            </div>
        )}
      </>
  );

  const RenderEyes = () => (
      <div className="flex gap-4 mb-2 relative z-20">
            <div className="relative">
                <div className="absolute -top-3 w-8 h-2 rounded-full z-10" style={getEyebrowStyle().left}></div>
                <div className="w-8 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                <div className="w-4 h-4 rounded-full transition-transform duration-75" style={{ backgroundColor: config.style === 'robot' ? '#1e293b' : getEyeColor(), transform: `translate(${activeEyeX * 6}px, ${activeEyeY * 4}px)` }}>
                    <div className="w-1.5 h-1.5 bg-black rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="w-1 h-1 bg-white rounded-full absolute top-1 left-1 opacity-60"></div>
                </div>
                </div>
            </div>
            <div className="relative">
                <div className="absolute -top-3 w-8 h-2 rounded-full z-10" style={getEyebrowStyle().right}></div>
                <div className="w-8 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                <div className="w-4 h-4 rounded-full transition-transform duration-75" style={{ backgroundColor: config.style === 'robot' ? '#1e293b' : getEyeColor(), transform: `translate(${activeEyeX * 6}px, ${activeEyeY * 4}px)` }}>
                    <div className="w-1.5 h-1.5 bg-black rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="w-1 h-1 bg-white rounded-full absolute top-1 left-1 opacity-60"></div>
                </div>
                </div>
            </div>
      </div>
  );

  const RenderHuman = () => (
    <div className="relative w-40 h-48 flex flex-col items-center">
        {/* Hair Back Layer */}
        {config.hairStyle === 'long' && <div className="absolute top-8 w-40 h-32 rounded-b-xl z-0" style={{ backgroundColor: getHairColor() }}></div>}
        {config.hairStyle === 'bob' && <div className="absolute top-8 w-36 h-28 rounded-b-[3rem] z-0" style={{ backgroundColor: getHairColor() }}></div>}
        {config.hairStyle === 'pigtails' && (
            <>
                <div className="absolute top-10 -left-6 w-16 h-24 rounded-full z-0 origin-top-right animate-bounce-slow" style={{ backgroundColor: getHairColor() }}></div>
                <div className="absolute top-10 -right-6 w-16 h-24 rounded-full z-0 origin-top-left animate-bounce-slow" style={{ backgroundColor: getHairColor() }}></div>
            </>
        )}
        {/* Body */}
        <div className={`absolute bottom-0 w-32 h-20 rounded-t-[3rem] z-10 shadow-sm ${getClothingClass()}`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-8 z-0" style={{ backgroundColor: getSkinColor(), filter: 'brightness(0.9)' }}></div>
            {config.clothing === 'tshirt_blue' && <div className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white/20"></div>}
            {config.clothing === 'hoodie_gray' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-2 bg-slate-800/20 rounded-b-lg"></div>}
        </div>
        {/* Head */}
        <div className="absolute top-6 w-28 h-32 rounded-[2.5rem] z-20 flex flex-col items-center shadow-md origin-bottom" style={{ backgroundColor: getSkinColor() }}>
            {config.hairStyle !== 'none' && (
                 <div className="absolute -top-2 w-32 h-16 z-30 pointer-events-none">
                     {config.hairStyle === 'short' && <div className="w-full h-full rounded-t-[3rem]" style={{ backgroundColor: getHairColor() }}></div>}
                     {config.hairStyle === 'spiky' && (
                         <div className="flex justify-center -mt-4">
                             <div className="w-8 h-8 rotate-45" style={{ backgroundColor: getHairColor() }}></div>
                             <div className="w-10 h-10 -ml-4 rotate-45 -mt-2" style={{ backgroundColor: getHairColor() }}></div>
                             <div className="w-8 h-8 -ml-4 rotate-45" style={{ backgroundColor: getHairColor() }}></div>
                         </div>
                     )}
                     {(config.hairStyle === 'bob' || config.hairStyle === 'long' || config.hairStyle === 'pigtails') && (
                         <div className="w-full h-full rounded-t-[3rem] clip-path-bangs" style={{ backgroundColor: getHairColor() }}></div>
                     )}
                 </div>
            )}
            <div className="mt-12 w-full flex flex-col items-center relative">
                 <RenderEyes />
                 <div className="w-2 h-2 rounded-full bg-black/10 mb-1"></div>
                 <div style={getMouthStyle()}></div>
            </div>
        </div>
        <RenderAccessories />
    </div>
  );

  const RenderRobot = () => (
      <div className={`relative transition-all duration-300 ${getRobotColor()} ${config.baseId === 'robot_round' ? 'rounded-full' : config.baseId === 'robot_square' ? 'rounded-3xl' : 'rounded-[2.5rem]'} w-36 h-36 border-4 border-white flex flex-col items-center justify-center shadow-lg`}>
          <RenderEyes />
          <div style={getMouthStyle()}></div>
          <RenderAccessories />
      </div>
  );

  return (
    <div className={`bg-white rounded-3xl p-4 shadow-sm border flex flex-col gap-4 relative overflow-hidden h-full transition-all duration-500 ${isRecording ? 'border-4 border-red-500 shadow-red-200' : 'border-sky-100'}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center z-10 px-1 shrink-0">
        <h3 className="text-sm font-bold text-sky-800 flex items-center gap-2">
            My Avatar
            {isCameraOn && !modelLoading && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>}
            {isRecording && <span className="flex items-center gap-1 text-red-500 text-xs animate-pulse font-black"><Disc size={12} fill="currentColor"/> REC</span>}
        </h3>
        <div className="flex gap-2">
            <button
                onClick={() => setShowTextInput(!showTextInput)}
                className={`p-2 rounded-full transition-colors ${showTextInput ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                title="Type a message"
            >
                <MessageSquare size={18} />
            </button>
            <button 
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`p-2 rounded-full transition-colors ${isCameraOn ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}
                title={isCameraOn ? "Stop Mirroring" : "Start Mirroring"}
            >
                {modelLoading ? <Loader2 size={18} className="animate-spin" /> : isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
        </div>
      </div>

      <video ref={videoRef} autoPlay playsInline muted className="absolute opacity-0 pointer-events-none w-1 h-1" />

      {/* Main Visual Stage */}
      <div className="relative flex-1 min-h-[200px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner group w-full mx-auto flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {!isCameraOn && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center z-0">
                <VideoOff size={32} className="mb-2 opacity-50" />
                <span className="text-xs font-bold">Camera Off</span>
                <span className="text-[10px] mt-1">Avatar uses simulated emotions</span>
             </div>
        )}

        {aiSpeaking && (
            <div className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur text-indigo-900 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                <BrainCircuit size={12} className="text-indigo-500" />
                Speaking...
            </div>
        )}

        {/* Captions / Q&A Bubble */}
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

        <div 
            className="absolute z-20 pointer-events-none transition-transform duration-75 ease-out flex items-center justify-center"
            style={{ 
                transform: `translate(${activeHeadX}px, ${activeHeadY}px) rotate(${activeTilt}deg) scale(${isCameraOn ? 1 : 0.95})`,
            }}
        >
            {config.style === 'human' ? <RenderHuman /> : <RenderRobot />}
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-30 pointer-events-auto gap-3">
             {showTextInput ? (
                 <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-full shadow-lg backdrop-blur mx-4 w-full max-w-xs animate-in slide-in-from-bottom-5">
                     <input 
                        type="text" 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Ask a coding question..."
                        className="flex-1 bg-transparent border-none text-xs px-2 focus:outline-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                // Simulate sending - in real app would send to Gemini text API
                                setCaption(textInput);
                                setTextInput("");
                                setTimeout(() => {
                                    setCaption("That's a great question! Let's break it down...");
                                    setIsTurnComplete(true);
                                    setTimeout(() => setIsTurnComplete(false), 3000);
                                }, 1000);
                            }
                        }}
                     />
                     <button className="bg-indigo-500 text-white p-1.5 rounded-full hover:bg-indigo-600">
                         <Send size={14} />
                     </button>
                 </div>
             ) : (
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
                    {isLive ? <><MicOff size={16} /> End Chat</> : <><Sparkles size={16} /> Ask CodeBot</>}
                </button>
             )}
        </div>
      </div>
      
      <p className="text-center text-slate-500 text-xs shrink-0">
         {isRecording ? "🔴 Recording explanation..." : 
          modelLoading ? "Initializing Vision Engine..." : 
          !isCameraOn ? "Turn on camera to control avatar expression" : 
          "Processing on-device. Privacy protected."}
      </p>

      <style>{`
        .clip-path-bangs { clip-path: polygon(0 0, 100% 0, 100% 60%, 70% 80%, 30% 80%, 0 60%); }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-slow { animation: bounce-slow 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default AvatarInterface;