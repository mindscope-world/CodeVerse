import React, { useState, useEffect } from 'react';
import { Play, HelpCircle, Save, CheckCircle, RefreshCcw, AlertTriangle, MonitorPlay } from 'lucide-react';
import { generateCodeExplanation } from '../services/geminiService';
import { runPythonCode } from '../services/pythonInterpreter';
import { AvatarEmotion } from '../types';

interface CodeLabProps {
  code: string;
  setCode: (code: string) => void;
  setAvatarEmotion: (e: AvatarEmotion) => void;
  onPresent: () => void;
}

const CodeLab: React.FC<CodeLabProps> = ({ code, setCode, setAvatarEmotion, onPresent }) => {
  const [output, setOutput] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExpl, setLoadingExpl] = useState(false);
  const [hasError, setHasError] = useState(false);

  const runCode = () => {
    setOutput(["> Initializing runtime...", "> Running code..."]);
    setHasError(false);
    setAvatarEmotion('focused');
    
    // Small timeout to allow UI to update before heavy sync operation
    setTimeout(() => {
        const results = runPythonCode(code);
        setOutput(results);
        
        // Check for errors in output
        const errorFound = results.some(line => line.startsWith('Error') || line.startsWith('Runtime Error'));
        setHasError(errorFound);
        
        if (errorFound) {
            setAvatarEmotion('sad');
            setTimeout(() => setAvatarEmotion('neutral'), 3000);
        } else {
            setAvatarEmotion('happy');
            setTimeout(() => setAvatarEmotion('neutral'), 3000);
        }
    }, 500);
  };

  const askAI = async () => {
    setLoadingExpl(true);
    setExplanation(null);
    setAvatarEmotion('thinking');
    
    const text = await generateCodeExplanation(code);
    
    setExplanation(text);
    setLoadingExpl(false);
    setAvatarEmotion('happy'); // Happy to help
    setTimeout(() => setAvatarEmotion('neutral'), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Editor Side */}
      <div className="flex flex-col gap-4">
        <div className="bg-slate-800 rounded-3xl p-1 shadow-xl flex-1 flex flex-col overflow-hidden relative group">
            <div className="bg-slate-900 px-6 py-3 flex justify-between items-center">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-slate-400 text-xs font-mono">main.py</span>
                <button onClick={onPresent} className="text-slate-400 hover:text-white transition-colors" title="Presentation Mode">
                    <MonitorPlay size={16} />
                </button>
            </div>
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-slate-800 text-green-400 font-mono p-6 resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
            />
        </div>
        <div className="flex gap-3">
             <button 
                onClick={runCode}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
                <Play size={20} fill="currentColor" /> Run Code
            </button>
             <button 
                onClick={askAI}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
                <HelpCircle size={20} /> Explain
            </button>
        </div>
      </div>

      {/* Output & AI Side */}
      <div className="flex flex-col gap-6">
        {/* Console Output */}
        <div className={`bg-slate-900 rounded-3xl p-6 shadow-lg min-h-[200px] flex flex-col font-mono text-sm transition-colors ${hasError ? 'border-2 border-red-500/50' : ''}`}>
            <h4 className="text-slate-400 mb-2 border-b border-slate-700 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2"><RefreshCcw size={14} /> Console Output</span>
                {hasError && <span className="text-red-400 flex items-center gap-1 text-xs"><AlertTriangle size={12}/> Error Detected</span>}
            </h4>
            <div className="flex-1 text-slate-300 space-y-1 overflow-y-auto max-h-[300px]">
                {output.map((line, i) => {
                    let className = 'text-slate-200';
                    if (line.startsWith('>')) className = 'text-indigo-400';
                    if (line.startsWith('Error') || line.startsWith('Runtime Error')) className = 'text-red-400 font-bold bg-red-900/20 px-2 rounded';
                    
                    return <div key={i} className={className}>{line}</div>
                })}
                {output.length === 0 && <span className="text-slate-600 italic">No output yet. Run your code!</span>}
            </div>
        </div>

        {/* AI Tutor Bubble */}
        <div className={`flex-1 rounded-3xl p-6 relative transition-all duration-500 ${explanation || loadingExpl ? 'bg-indigo-50 border-2 border-indigo-100' : 'bg-transparent'}`}>
            {loadingExpl ? (
                 <div className="absolute inset-0 flex items-center justify-center text-indigo-500 gap-2">
                    <div className="animate-spin"><RefreshCcw /></div> Thinking...
                 </div>
            ) : explanation ? (
                <div>
                    <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            AI
                         </div>
                         <h4 className="font-bold text-indigo-900">Coach CodeBot says:</h4>
                    </div>
                    <p className="text-indigo-800 leading-relaxed text-lg">{explanation}</p>
                </div>
            ) : (
                <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <HelpCircle size={48} className="mb-4 text-slate-200" />
                    <p>Stuck? Click "Explain" and I'll tell you what your code is doing!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CodeLab;