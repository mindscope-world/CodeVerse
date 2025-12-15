import React, { useState } from 'react';
import { 
    Network, GitBranch, Shield, Zap, Clock, 
    Plus, Trash2, ChevronRight, ChevronDown, 
    AlertTriangle, BrainCircuit, Activity
} from 'lucide-react';
import { IntelligenceModel, KPINode, BusinessRule, DecisionContext } from '../types';

interface BrainBuilderProps {
  model: IntelligenceModel;
  setModel: (m: IntelligenceModel) => void;
}

// --- KPI Tree Component ---
const KPITreeNode: React.FC<{ 
    node: KPINode; 
    depth: number; 
    onAdd: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ node, depth, onAdd, onDelete }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="flex flex-col relative">
            {/* Visual connector lines */}
            {depth > 0 && (
                <div className="absolute -left-4 top-5 w-4 h-0.5 bg-slate-300"></div>
            )}
            
            <div className={`flex items-center gap-2 mb-2 p-2 rounded-xl border-2 transition-all ${depth === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-sky-200'}`}>
                <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-slate-100 rounded">
                    {node.children && node.children.length > 0 ? (
                        expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />
                    ) : <div className="w-3.5" />}
                </button>
                
                <div className="flex-1 flex items-center gap-3">
                    <span className={`font-bold text-sm ${depth === 0 ? 'text-indigo-800' : 'text-slate-700'}`}>{node.label}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">w:{node.weight}</span>
                </div>

                <div className="flex gap-1">
                    <button onClick={() => onAdd(node.id)} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded" title="Add Sub-metric">
                        <Plus size={14} />
                    </button>
                    {depth > 0 && (
                        <button onClick={() => onDelete(node.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded" title="Remove Metric">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Children */}
            {expanded && node.children && (
                <div className="ml-8 border-l-2 border-slate-200 pl-4">
                    {node.children.map(child => (
                        <KPITreeNode key={child.id} node={child} depth={depth + 1} onAdd={onAdd} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

const BrainBuilder: React.FC<BrainBuilderProps> = ({ model, setModel }) => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'logic' | 'context'>('kpi');

  // --- Handlers ---
  const addKpiNode = (parentId: string) => {
      const newNode: KPINode = {
          id: Math.random().toString(36).substr(2, 9),
          label: 'New Metric',
          weight: 50,
          children: []
      };

      const addRecursive = (nodes: KPINode[]): KPINode[] => {
          return nodes.map(node => {
              if (node.id === parentId) {
                  return { ...node, children: [...(node.children || []), newNode] };
              }
              if (node.children) {
                  return { ...node, children: addRecursive(node.children) };
              }
              return node;
          });
      };
      
      setModel({ ...model, kpiTree: addRecursive(model.kpiTree) });
  };

  const deleteKpiNode = (id: string) => {
      const deleteRecursive = (nodes: KPINode[]): KPINode[] => {
          return nodes.filter(n => n.id !== id).map(n => ({
              ...n,
              children: n.children ? deleteRecursive(n.children) : []
          }));
      };
      setModel({ ...model, kpiTree: deleteRecursive(model.kpiTree) });
  };

  const addRule = () => {
      const newRule: BusinessRule = {
          id: Math.random().toString(36).substr(2, 9),
          condition: 'If ...',
          action: 'Then ...',
          priority: 'Medium',
          active: true
      };
      setModel({ ...model, rules: [...model.rules, newRule] });
  };

  const updateContext = (key: keyof DecisionContext, value: any) => {
      setModel({ ...model, context: { ...model.context, [key]: value } });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <BrainCircuit className="text-indigo-500" />
                    Avatar Intelligence Core
                </h2>
                <p className="text-slate-500 text-sm mt-1">Configure context awareness, logic constraints, and success metrics.</p>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('kpi')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'kpi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <GitBranch size={16} /> KPI Hierarchy
                </button>
                <button 
                    onClick={() => setActiveTab('logic')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'logic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Shield size={16} /> Logic Encoding
                </button>
                <button 
                    onClick={() => setActiveTab('context')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'context' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Activity size={16} /> Context Engine
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-50/30">
            
            {/* --- KPI HIERARCHY BUILDER --- */}
            {activeTab === 'kpi' && (
                <div className="h-full flex gap-6">
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 overflow-y-auto shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Network size={18} className="text-sky-500" /> Success Metrics Structure
                        </h3>
                        {model.kpiTree.map(node => (
                            <KPITreeNode key={node.id} node={node} depth={0} onAdd={addKpiNode} onDelete={deleteKpiNode} />
                        ))}
                    </div>
                    <div className="w-72 bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                        <h4 className="font-bold text-indigo-900 mb-2">About Hierarchy</h4>
                        <p className="text-sm text-indigo-700/80 mb-4">
                            Define what "Success" means for your Avatar. High-level goals (Root) are broken down into sub-metrics.
                        </p>
                        <div className="space-y-3">
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                <div className="text-xs font-bold text-slate-400 uppercase">Current Focus</div>
                                <div className="font-bold text-indigo-600">Primary Goal Weight: {model.kpiTree[0]?.weight}%</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                <div className="text-xs font-bold text-slate-400 uppercase">Sub-metrics</div>
                                <div className="font-bold text-indigo-600">Count: 3 Active</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BUSINESS LOGIC ENCODER --- */}
            {activeTab === 'logic' && (
                <div className="h-full flex flex-col max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700">Global Constraints & Rules</h3>
                        <button onClick={addRule} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-all">
                            <Plus size={16} /> Add Rule
                        </button>
                    </div>
                    
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                        {model.rules.map((rule, idx) => (
                            <div key={rule.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-indigo-300 transition-all">
                                <div className="flex flex-col items-center gap-1 w-16 shrink-0">
                                    <span className="text-xs font-bold text-slate-400">PRIORITY</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        rule.priority === 'High' ? 'bg-red-100 text-red-600' :
                                        rule.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                        {rule.priority.toUpperCase()}
                                    </span>
                                </div>
                                
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400">IF</span>
                                        <input 
                                            className="bg-transparent border-none text-sm font-mono text-slate-700 w-full focus:outline-none" 
                                            defaultValue={rule.condition}
                                        />
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400">THEN</span>
                                        <input 
                                            className="bg-transparent border-none text-sm font-mono text-indigo-600 font-bold w-full focus:outline-none" 
                                            defaultValue={rule.action}
                                        />
                                    </div>
                                </div>

                                <button onClick={() => {
                                    const newRules = model.rules.filter(r => r.id !== rule.id);
                                    setModel({...model, rules: newRules});
                                }} className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- DECISION CONTEXT ENGINE --- */}
            {activeTab === 'context' && (
                <div className="h-full grid grid-cols-2 gap-6">
                    
                    {/* Decision Boundaries */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                            <Shield size={18} className="text-emerald-500" /> Decision Boundaries
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-slate-800">Autonomous Movement</div>
                                    <div className="text-xs text-slate-500">Allow AI to move without direct command</div>
                                </div>
                                <button 
                                    onClick={() => updateContext('allowAutonomousMovement', !model.context.allowAutonomousMovement)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${model.context.allowAutonomousMovement ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${model.context.allowAutonomousMovement ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-slate-800">Human-in-the-Loop</div>
                                    <div className="text-xs text-slate-500">Require approval for critical actions</div>
                                </div>
                                <button 
                                    onClick={() => updateContext('requireHumanApproval', !model.context.requireHumanApproval)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${model.context.requireHumanApproval ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${model.context.requireHumanApproval ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div>
                                <div className="font-bold text-slate-800 mb-2">Risk Tolerance</div>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                    {['Low', 'Medium', 'High'].map(risk => (
                                        <button 
                                            key={risk}
                                            onClick={() => updateContext('riskTolerance', risk)}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${model.context.riskTolerance === risk ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                                        >
                                            {risk}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Temporal Reasoning (Memory) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                         <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                            <Clock size={18} className="text-amber-500" /> Temporal Reasoning
                        </h3>

                        <div className="mb-6">
                            <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                                <span>Memory Window</span>
                                <span className="text-indigo-600">{model.context.temporalMemoryWindow}s</span>
                            </div>
                            <input 
                                type="range" min="5" max="60" step="5"
                                value={model.context.temporalMemoryWindow}
                                onChange={(e) => updateContext('temporalMemoryWindow', Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        {/* Simulated Memory Stream Visualization */}
                        <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 p-4 relative overflow-hidden">
                            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Recent Events Stream</div>
                            <div className="space-y-3 relative z-10">
                                <div className="flex items-center gap-2 text-xs opacity-40">
                                    <span className="font-mono text-slate-400">T-15s</span>
                                    <span className="bg-white border border-slate-200 px-2 py-1 rounded">System Init</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs opacity-70">
                                    <span className="font-mono text-slate-400">T-08s</span>
                                    <span className="bg-white border border-slate-200 px-2 py-1 rounded flex items-center gap-1">
                                        <Zap size={10} className="text-yellow-500"/> Energy Check
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    <span className="font-mono text-indigo-400">T-02s</span>
                                    <span className="bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                                        <AlertTriangle size={10} className="text-red-500"/> Constraint Validated
                                    </span>
                                </div>
                            </div>
                            
                            {/* Decorative timeline line */}
                            <div className="absolute top-10 bottom-4 left-[2.4rem] w-px bg-slate-200 border-l border-dashed border-slate-300 z-0"></div>
                        </div>
                    </div>

                </div>
            )}

        </div>
    </div>
  );
};

export default BrainBuilder;
