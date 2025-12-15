import React from 'react';
import { ArrowLeft, Play, MonitorPlay, MousePointer } from 'lucide-react';
import { BlockInstance, BlockDefinition } from '../types';
import { BLOCK_DEFINITIONS } from '../constants';

interface PresentationModeProps {
  mode: 'logic' | 'code';
  program: BlockInstance[];
  code: string;
  onExit: () => void;
}

// Simple Read-Only Logic Block Renderer for Presentation
const PresentationBlock: React.FC<{ block: BlockInstance; depth: number }> = ({ block, depth }) => {
  const def = BLOCK_DEFINITIONS.find(d => d.type === block.type);
  if (!def) return null;

  return (
    <div className={`mb-2 transform transition-all hover:scale-105`}>
        <div className={`${def.color} text-white rounded-xl shadow-lg p-4 flex items-center gap-3 text-xl font-bold`}>
            <span>{def.label}</span>
            {def.inputs?.map(input => (
                <span key={input.name} className="bg-black/20 px-3 py-1 rounded-lg">
                    {block.params[input.name] || input.defaultValue}
                </span>
            ))}
        </div>
        {def.hasChildren && block.children && (
            <div className="ml-8 pl-4 border-l-4 border-slate-300 mt-2">
                {block.children.map(child => <PresentationBlock key={child.id} block={child} depth={depth + 1} />)}
            </div>
        )}
    </div>
  );
};

const PresentationMode: React.FC<PresentationModeProps> = ({ mode, program, code, onExit }) => {
  return (
    <div className="h-full flex flex-col bg-slate-900 text-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-indigo-500 relative">
      
      {/* Top Controls */}
      <div className="absolute top-6 left-6 z-50 flex gap-4">
          <button onClick={onExit} className="bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-sm transition-colors">
              <ArrowLeft size={24} />
          </button>
      </div>

      <div className="absolute top-6 right-6 z-50 bg-indigo-600 px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 animate-pulse">
          <MonitorPlay size={20} /> Presentation Mode
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-12 md:p-20">
          <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-black mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">
                  {mode === 'logic' ? "Logic Flow" : "Python Code"}
              </h1>

              {mode === 'logic' ? (
                  <div className="space-y-4">
                      {program.length === 0 && <div className="text-center text-slate-500 text-2xl">No logic blocks to present.</div>}
                      {program.map(block => <PresentationBlock key={block.id} block={block} depth={0} />)}
                  </div>
              ) : (
                  <div className="bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700">
                      <pre className="font-mono text-2xl leading-relaxed text-green-400 whitespace-pre-wrap">
                          {code}
                      </pre>
                  </div>
              )}
          </div>
      </div>

      {/* Laser Pointer Effect (Visual Flair) */}
      <div className="absolute bottom-6 left-6 text-slate-500 text-sm font-mono flex items-center gap-2">
          <MousePointer size={14} /> Pointer Active
      </div>
    </div>
  );
};

export default PresentationMode;
