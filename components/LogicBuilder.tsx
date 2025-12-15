import React, { useState, useEffect } from 'react';
import { BLOCK_DEFINITIONS } from '../constants';
import { BlockInstance, BlockDefinition, RuntimeState, AvatarEmotion } from '../types';
import { LogicEngine } from '../services/logicRuntime';
import { 
    Play, RotateCcw, FastForward, Code as CodeIcon, 
    Trash2, GripVertical, Plus, Variable,
    PlusCircle, MonitorPlay
} from 'lucide-react';

interface LogicBuilderProps {
  program: BlockInstance[];
  setProgram: React.Dispatch<React.SetStateAction<BlockInstance[]>>;
  onCodeGenerated: (code: string) => void;
  setAvatarEmotion: (e: AvatarEmotion) => void;
  onPresent: () => void; // New prop for Presentation Mode
}

// --- Drag Types ---
const DND_TYPE = "application/codeverse-block";

// --- Recursive Block Component ---
const LogicBlockNode: React.FC<{
  block: BlockInstance;
  definition: BlockDefinition;
  depth: number;
  runtimeState: RuntimeState;
  availableVariables: string[];
  onUpdate: (id: string, params: any) => void;
  onDelete: (id: string) => void;
  onDrop: (targetId: string, blockData: any) => void;
}> = ({ block, definition, depth, runtimeState, availableVariables, onUpdate, onDelete, onDrop }) => {
  const isActive = runtimeState.currentBlockId === block.id;

  const handleParamChange = (key: string, value: any) => {
    onUpdate(block.id, { ...block.params, [key]: value });
  };

  const handleDragStart = (e: React.DragEvent) => {
     e.dataTransfer.setData(DND_TYPE, JSON.stringify({ type: 'move_existing', id: block.id }));
     e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const data = e.dataTransfer.getData(DND_TYPE);
      if (data) {
          onDrop(block.id, JSON.parse(data));
      }
  };

  return (
    <div 
        className={`relative mb-2 transition-all duration-300 ${isActive ? 'scale-[1.02] z-10' : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      {/* Block Body */}
      <div className={`
        ${definition.color} text-white rounded-xl shadow-sm p-3 flex items-center gap-3 select-none
        ${isActive ? 'ring-4 ring-yellow-400 shadow-xl' : ''}
      `}>
        <GripVertical size={16} className="opacity-50 cursor-grab active:cursor-grabbing" />
        <span className="font-bold text-sm tracking-wide">{definition.label}</span>

        {/* Inputs */}
        {definition.inputs?.map(input => (
            <div key={input.name} className="flex items-center gap-2">
                {input.label && <span className="text-xs font-medium opacity-80">{input.label}</span>}
                
                {input.type === 'select' && (
                    <select 
                        value={block.params[input.name]}
                        onChange={(e) => handleParamChange(input.name, e.target.value)}
                        className="bg-black/20 border-none rounded-md text-xs px-2 py-1 text-white focus:ring-2 focus:ring-white/50 outline-none"
                    >
                        {input.options?.map(opt => <option key={opt} value={opt} className="text-slate-800">{opt}</option>)}
                    </select>
                )}
                
                {input.type === 'variable' && (
                    <select 
                        value={block.params[input.name]}
                        onChange={(e) => handleParamChange(input.name, e.target.value)}
                        className="bg-black/20 border-none rounded-md text-xs px-2 py-1 text-white focus:ring-2 focus:ring-white/50 outline-none min-w-[80px]"
                    >
                        {availableVariables.map(v => <option key={v} value={v} className="text-slate-800">{v}</option>)}
                    </select>
                )}

                {/* Fallback for text/number */}
                {(input.type === 'number' || input.type === 'text') && (
                    <input 
                        type={input.type === 'number' ? 'number' : 'text'}
                        value={block.params[input.name]}
                        onChange={(e) => handleParamChange(input.name, input.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className="bg-black/20 border-none rounded-md text-xs px-2 py-1 text-white w-20 focus:ring-2 focus:ring-white/50 outline-none text-center font-mono"
                    />
                )}
            </div>
        ))}

        <div className="flex-1"></div>
        <button onClick={() => onDelete(block.id)} className="opacity-50 hover:opacity-100 p-1 rounded-full hover:bg-white/20 transition-all">
            <Trash2 size={14} />
        </button>
      </div>

      {/* Nested Children Container */}
      {definition.hasChildren && (
        <div className="ml-6 pl-4 border-l-4 border-slate-200/50 mt-1 min-h-[40px] bg-slate-50/50 rounded-bl-xl p-2">
           {block.children && block.children.length > 0 ? (
               block.children.map(child => {
                   const childDef = BLOCK_DEFINITIONS.find(d => d.type === child.type);
                   if (!childDef) return null;
                   return (
                       <LogicBlockNode 
                          key={child.id} 
                          block={child} 
                          definition={childDef} 
                          depth={depth + 1}
                          runtimeState={runtimeState}
                          availableVariables={availableVariables}
                          onUpdate={onUpdate}
                          onDelete={onDelete}
                          onDrop={onDrop}
                       />
                   );
               })
           ) : (
               <div className="text-xs text-slate-400 italic py-2 px-2 border-2 border-dashed border-slate-200 rounded-lg">
                   Drop blocks here
               </div>
           )}
           {/* Drop Zone at end of nested list */}
           <div 
              className="h-8 rounded-lg border-2 border-dashed border-transparent hover:border-slate-300 transition-all flex items-center justify-center text-slate-300 text-xs mt-1"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  const data = e.dataTransfer.getData(DND_TYPE);
                  if (data) onDrop(block.id, JSON.parse(data)); // Drop into parent
              }}
           >
              <Plus size={14} />
           </div>
        </div>
      )}
    </div>
  );
};

// --- Main Builder Component ---
const LogicBuilder: React.FC<LogicBuilderProps> = ({ program, setProgram, onCodeGenerated, setAvatarEmotion, onPresent }) => {
  const [engine, setEngine] = useState<LogicEngine | null>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
      variables: {}, consoleOutput: [], currentBlockId: null, isRunning: false, isFinished: false, error: null
  });
  const [generatedPython, setGeneratedPython] = useState("");
  const [variables, setVariables] = useState<string[]>(['score', 'count', 'speed']);

  // Init Engine
  useEffect(() => {
     const newEngine = new LogicEngine(program);
     setEngine(newEngine);
     setRuntimeState(newEngine.getState());
     const code = newEngine.generatePython();
     setGeneratedPython(code);
  }, [program]);

  // --- Runtime Controls ---
  const handleRunStep = () => {
    if (engine) {
        setAvatarEmotion('focused');
        const newState = engine.step();
        setRuntimeState({ ...newState });
        if (newState.isFinished) {
            setAvatarEmotion('happy');
            setTimeout(() => setAvatarEmotion('neutral'), 2000);
        }
    }
  };

  const handleReset = () => {
      if (engine) {
          engine.reset();
          setRuntimeState(engine.getState());
          setAvatarEmotion('neutral');
      }
  };

  const handleConvert = () => {
      onCodeGenerated(generatedPython);
  };

  const createVariable = () => {
      const name = window.prompt("Enter variable name (e.g., 'lives')");
      if (name && !variables.includes(name)) {
          setVariables(prev => [...prev, name]);
      }
  };

  // --- Logic Manipulation ---
  const addBlock = (def: BlockDefinition) => {
      const newBlock: BlockInstance = {
          id: Math.random().toString(36).substr(2, 9),
          type: def.type,
          params: {},
          children: def.hasChildren ? [] : undefined
      };
      
      // Set defaults
      def.inputs?.forEach(input => {
          newBlock.params[input.name] = input.defaultValue;
      });

      setProgram(prev => [...prev, newBlock]);
  };

  const updateBlock = (id: string, newParams: any) => {
      const updateRecursive = (blocks: BlockInstance[]): BlockInstance[] => {
          return blocks.map(b => {
              if (b.id === id) return { ...b, params: newParams };
              if (b.children) return { ...b, children: updateRecursive(b.children) };
              return b;
          });
      };
      setProgram(prev => updateRecursive(prev));
  };

  const deleteBlock = (id: string) => {
      const deleteRecursive = (blocks: BlockInstance[]): BlockInstance[] => {
          return blocks.filter(b => b.id !== id).map(b => {
              if (b.children) return { ...b, children: deleteRecursive(b.children) };
              return b;
          });
      };
      setProgram(prev => deleteRecursive(prev));
  };

  const handleDrop = (targetId: string, dragData: any) => {
      if (dragData.type === 'new') {
          const def = BLOCK_DEFINITIONS.find(d => d.type === dragData.defType);
          if (!def) return;

          const newBlock: BlockInstance = {
            id: Math.random().toString(36).substr(2, 9),
            type: def.type,
            params: {},
            children: def.hasChildren ? [] : undefined
          };
          def.inputs?.forEach(input => newBlock.params[input.name] = input.defaultValue);

          const addToChildren = (blocks: BlockInstance[]): BlockInstance[] => {
             return blocks.map(b => {
                 if (b.id === targetId && b.children) {
                     return { ...b, children: [...b.children, newBlock] };
                 }
                 if (b.children) return { ...b, children: addToChildren(b.children) };
                 return b;
             });
          };
          setProgram(prev => addToChildren(prev));
      }
  };

  const handleMainDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData(DND_TYPE);
      if (data) {
          const parsed = JSON.parse(data);
          if (parsed.type === 'new') {
             const def = BLOCK_DEFINITIONS.find(d => d.type === parsed.defType);
             if (def) addBlock(def);
          }
      }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      
      {/* TOOLBOX */}
      <div className="w-full lg:w-64 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden shrink-0">
         <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
            <GripVertical size={18} /> Toolbox
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {['event', 'control', 'action', 'variable'].map(cat => (
                <div key={cat}>
                    <div className="flex justify-between items-center mb-2">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cat}</h5>
                        {cat === 'variable' && (
                            <button 
                                onClick={createVariable}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                                title="Create new variable"
                            >
                                <PlusCircle size={10} /> Add
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {BLOCK_DEFINITIONS.filter(b => b.category === cat).map(block => (
                            <div 
                                key={block.type}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData(DND_TYPE, JSON.stringify({ type: 'new', defType: block.type }));
                                }}
                                onClick={() => addBlock(block)}
                                className={`
                                    ${block.color} text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm 
                                    cursor-grab active:cursor-grabbing hover:brightness-110 active:scale-95 transition-all
                                    flex items-center gap-2
                                `}
                            >
                                <Plus size={14} /> {block.label}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* WORKSPACE & VISUALIZATION */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
          
          {/* Main Canvas */}
          <div 
            className="flex-1 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 relative overflow-hidden flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleMainDrop}
          >
             {/* Toolbar */}
             <div className="absolute top-4 right-4 flex gap-2 z-20">
                 <button onClick={onPresent} className="bg-sky-500 text-white p-2 rounded-full shadow hover:bg-sky-600" title="Presentation Mode">
                     <MonitorPlay size={20} />
                 </button>
                 <button onClick={handleReset} className="bg-white text-slate-600 p-2 rounded-full shadow hover:bg-slate-50" title="Reset">
                     <RotateCcw size={20} />
                 </button>
                 <button onClick={handleRunStep} className="bg-green-500 text-white p-2 rounded-full shadow hover:bg-green-600" title="Step Forward">
                     <FastForward size={20} />
                 </button>
                 <button onClick={handleConvert} className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow hover:bg-indigo-700 font-bold text-sm flex items-center gap-2">
                     <CodeIcon size={16} /> To Code
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8">
                 {program.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                         <div className="w-16 h-16 border-4 border-slate-300 rounded-xl border-dashed mb-4"></div>
                         <p>Drag blocks here to start building!</p>
                     </div>
                 ) : (
                     <div className="max-w-xl mx-auto pb-20">
                         {program.map(block => {
                             const def = BLOCK_DEFINITIONS.find(d => d.type === block.type);
                             if (!def) return null;
                             return (
                                 <LogicBlockNode 
                                     key={block.id} 
                                     block={block} 
                                     definition={def} 
                                     depth={0} 
                                     runtimeState={runtimeState}
                                     availableVariables={variables}
                                     onUpdate={updateBlock}
                                     onDelete={deleteBlock}
                                     onDrop={handleDrop}
                                 />
                             );
                         })}
                     </div>
                 )}
             </div>
          </div>

          {/* Bottom Panel: Variables & Console */}
          <div className="h-48 bg-slate-900 rounded-3xl p-6 flex gap-6 shrink-0 shadow-lg text-sm font-mono overflow-hidden">
             {/* Console */}
             <div className="flex-1 flex flex-col gap-2">
                 <h4 className="text-slate-400 font-bold border-b border-slate-700 pb-1 flex justify-between">
                    <span>Console Output</span>
                    {runtimeState.isFinished && <span className="text-green-400 text-xs">Finished</span>}
                 </h4>
                 <div className="flex-1 overflow-y-auto space-y-1 text-slate-300">
                     {runtimeState.consoleOutput.length === 0 && <span className="text-slate-600 italic">Ready to run...</span>}
                     {runtimeState.consoleOutput.map((line, i) => (
                         <div key={i} className={line.startsWith('>') ? 'text-indigo-400' : 'text-red-400'}>{line}</div>
                     ))}
                     <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })}></div>
                 </div>
             </div>

             {/* Variable Watch */}
             <div className="w-64 bg-slate-800 rounded-xl p-4 flex flex-col gap-2 border border-slate-700">
                 <h4 className="text-slate-400 font-bold border-b border-slate-600 pb-1 flex items-center gap-2">
                    <Variable size={14} /> Variables
                 </h4>
                 <div className="flex-1 overflow-y-auto space-y-2">
                     {Object.keys(runtimeState.variables).length === 0 ? (
                         <span className="text-slate-600 italic text-xs">No variables yet</span>
                     ) : (
                         Object.entries(runtimeState.variables).map(([key, val]) => (
                             <div key={key} className="flex justify-between items-center bg-slate-700/50 px-2 py-1 rounded">
                                 <span className="text-rose-300">{key}</span>
                                 <span className="text-emerald-300 font-bold">{val}</span>
                             </div>
                         ))
                     )}
                 </div>
             </div>
          </div>
      </div>

    </div>
  );
};

export default LogicBuilder;