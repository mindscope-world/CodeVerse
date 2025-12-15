import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Standard Content Generation
export const generateCodeExplanation = async (code: string) => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a friendly, encouraging coding tutor for kids. Explain the following Python code simply, in 2-3 sentences max. Use emojis. Code: \n\n${code}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "Oops! I couldn't explain that right now. Try again later!";
  }
};

export const convertBlocksToCode = async (blockLabels: string[]) => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Convert this sequence of logic blocks into valid Python code. Return ONLY code, no markdown. Blocks: ${blockLabels.join(', ')}`,
    });
    return response.text;
  } catch (error) {
    return "# Error generating code";
  }
};

// Live API Helpers
export const audioContexts = {
  input: null as AudioContext | null,
  output: null as AudioContext | null,
};

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export type LiveConfig = {
  onAudioData: (amplitude: number) => void;
  onClose: () => void;
  onCaption?: (text: string, isUser: boolean, turnComplete: boolean) => void;
};

export class GeminiLiveClient {
  private ai: GoogleGenAI;
  private stopSignal = false;
  
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(config: LiveConfig) {
    this.stopSignal = false;
    let nextStartTime = 0;
    
    // Setup Audio Contexts
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    audioContexts.input = inputAudioContext;
    audioContexts.output = outputAudioContext;

    const inputNode = inputAudioContext.createGain();
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Connected");
          const source = inputAudioContext.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            if (this.stopSignal) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (this.stopSignal) return;
          
          // Handle Captions
          if (config.onCaption) {
             if (message.serverContent?.inputTranscription) {
                 config.onCaption(message.serverContent.inputTranscription.text, true, false);
             }
             if (message.serverContent?.outputTranscription) {
                 config.onCaption(message.serverContent.outputTranscription.text, false, false);
             }
             if (message.serverContent?.turnComplete) {
                 config.onCaption("", false, true);
             }
          }

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          
          if (base64Audio) {
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            
            const audioBuffer = await decodeAudioData(
              decode(base64Audio),
              outputAudioContext,
              24000,
              1
            );
            
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.start(nextStartTime);
            
            // Simple visualization hook
            // Analyze average amplitude for animation
            const rawData = audioBuffer.getChannelData(0);
            let sum = 0;
            for(let i=0; i<rawData.length; i+=10) { sum += Math.abs(rawData[i]); }
            const avg = sum / (rawData.length/10);
            config.onAudioData(avg * 5); // Boost for visibility

            nextStartTime += audioBuffer.duration;
          }
        },
        onclose: () => {
          config.onClose();
        },
        onerror: (e) => {
          console.error("Gemini Live Error", e);
          config.onClose();
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // Friendly voice
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: "You are 'CodeBot', a cheerful, encouraging, and funny programming tutor for children aged 8-12. Speak simply, use analogies, and be very enthusiastic about coding! Keep answers concise.",
      }
    });

    return {
        disconnect: () => {
            this.stopSignal = true;
            inputAudioContext.close();
            outputAudioContext.close();
            stream.getTracks().forEach(t => t.stop());
        }
    }
  }
}