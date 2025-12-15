import React from 'react';
import { AvatarConfig, AvatarPart } from '../types';
import { AVATAR_PARTS } from '../constants';
import AvatarInterface from './AvatarInterface';
import { Lock, Check } from 'lucide-react';

interface AvatarStudioProps {
  config: AvatarConfig;
  setConfig: (config: AvatarConfig) => void;
  userLevel: number;
}

const AvatarStudio: React.FC<AvatarStudioProps> = ({ config, setConfig, userLevel }) => {
  // Helper to check unlock status
  const isUnlocked = (part: AvatarPart) => userLevel >= part.unlockLevel;

  const handleSelect = (part: AvatarPart) => {
    if (!isUnlocked(part)) return;
    
    if (part.type === 'base') setConfig({ ...config, baseId: part.id });
    if (part.type === 'color') setConfig({ ...config, color: part.id });
    if (part.type === 'accessory') setConfig({ ...config, accessoryId: part.id });
  };

  const renderPartSection = (title: string, type: 'base' | 'color' | 'accessory') => (
    <div className="mb-8">
      <h3 className="font-bold text-slate-700 mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {AVATAR_PARTS.filter(p => p.type === type).map(part => {
          const unlocked = isUnlocked(part);
          const isSelected = 
            (type === 'base' && config.baseId === part.id) ||
            (type === 'color' && config.color === part.id) ||
            (type === 'accessory' && config.accessoryId === part.id);

          return (
            <button
              key={part.id}
              onClick={() => handleSelect(part)}
              disabled={!unlocked}
              className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                  : unlocked 
                    ? 'border-slate-200 hover:border-indigo-300 bg-white hover:shadow-sm' 
                    : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Preview Icon/Shape */}
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-inner ${
                 type === 'color' && part.previewColor ? part.previewColor : 'bg-slate-100'
              }`}>
                 {type === 'base' && (
                    <div className={`w-8 h-8 bg-slate-400 border-2 border-slate-300 shadow-sm transition-all ${
                        part.id === 'robot_round' ? 'rounded-full' : 
                        part.id === 'robot_square' ? 'rounded-lg' : 'rounded-2xl'
                    }`}></div>
                 )}
                 {type === 'accessory' && (
                     <span className="text-xl font-bold text-slate-400">
                        {part.id === 'none' ? '∅' : '+'}
                     </span>
                 )}
              </div>
              
              <span className="text-xs font-bold text-slate-600 text-center leading-tight">{part.name}</span>
              
              {!unlocked && (
                <div className="absolute top-2 right-2 text-slate-400">
                  <Lock size={14} />
                </div>
              )}
              {isSelected && (
                <div className="absolute top-[-8px] right-[-8px] bg-indigo-500 text-white rounded-full p-1.5 shadow-md transform scale-100 transition-transform">
                  <Check size={12} strokeWidth={4} />
                </div>
              )}
              {!unlocked && (
                 <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">Lvl {part.unlockLevel}</span>
                 </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
       {/* Preview Panel */}
       <div className="lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
             <h3 className="text-center font-bold text-slate-800 mb-4">Live Preview</h3>
             <div className="aspect-square bg-slate-900 rounded-3xl overflow-hidden relative shadow-inner">
                 {/* Reusing AvatarInterface for the preview */}
                 <div className="absolute inset-0 p-2">
                     <AvatarInterface config={config} />
                 </div>
             </div>
             <p className="text-center text-slate-400 text-xs mt-4">
                 Your avatar updates instantly across the app!
             </p>
          </div>
       </div>

       {/* Controls Panel */}
       <div className="flex-1 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Customize CodeBot</h2>
                <p className="text-slate-500">Unlock cool parts by completing coding missions!</p>
              </div>
              <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-bold border border-amber-200 shadow-sm flex items-center gap-2">
                <span>⭐ Level {userLevel} Unlocked</span>
              </div>
          </div>

          {renderPartSection("Body Model", 'base')}
          {renderPartSection("Paint Job", 'color')}
          {renderPartSection("Accessories", 'accessory')}
       </div>
    </div>
  );
};

export default AvatarStudio;
