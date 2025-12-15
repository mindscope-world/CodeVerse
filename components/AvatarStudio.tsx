
import React, { useState } from 'react';
import { AvatarConfig, UserProfile, TutorPersonality } from '../types';
import { AVATAR_OPTIONS, TUTOR_PROMPTS } from '../constants';
import AvatarInterface from './AvatarInterface';
import { User, Palette, Shirt, Smile, Box, Mic2, Gamepad2, Glasses, Leaf } from 'lucide-react';

interface AvatarStudioProps {
  config: AvatarConfig;
  setConfig: (config: AvatarConfig) => void;
  user: UserProfile;
  setUser: (u: UserProfile) => void;
}

const AvatarStudio: React.FC<AvatarStudioProps> = ({ config, setConfig, user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'base' | 'face' | 'hair' | 'gear' | 'personality'>('base');

  const updateConfig = (key: keyof AvatarConfig, value: string) => {
    setConfig({ ...config, [key]: value });
  };

  const ColorButton = ({ color, selected, onClick }: { color: string, selected: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`w-10 h-10 rounded-full border-4 shadow-sm transition-transform hover:scale-110 ${selected ? 'border-sky-500 scale-110' : 'border-white'}`}
        style={{ backgroundColor: color }}
    />
  );

  const OptionButton = ({ label, selected, onClick, children }: { label: string, selected: boolean, onClick: () => void, children?: React.ReactNode }) => (
      <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all w-full aspect-square ${
            selected ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-100 bg-white text-slate-600 hover:border-sky-200'
        }`}
      >
          <div className="mb-2">{children}</div>
          <span className="text-xs font-bold">{label}</span>
      </button>
  );

  const getIcon = (name: string) => {
      switch(name) {
          case 'Smile': return <Smile size={24} />;
          case 'Glasses': return <Glasses size={24} />;
          case 'Gamepad2': return <Gamepad2 size={24} />;
          case 'Leaf': return <Leaf size={24} />;
          default: return <Smile size={24} />;
      }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
       
       {/* Left: Preview & Identity */}
       <div className="lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
             <div className="mb-4">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Avatar Identity</label>
                 <div className="mt-1 flex gap-2">
                     <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400"><User size={20}/></div>
                     <input 
                        type="text" 
                        value={user.avatarName}
                        onChange={(e) => setUser({...user, avatarName: e.target.value})}
                        className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-sky-400 border-2 rounded-xl px-4 font-bold text-slate-700 outline-none transition-colors"
                        placeholder="Name your avatar..."
                     />
                 </div>
             </div>

             <div className="aspect-square bg-slate-900 rounded-3xl overflow-hidden relative shadow-inner">
                 <div className="absolute inset-0 p-2">
                     <AvatarInterface config={config} emotion='happy' />
                 </div>
             </div>
             
             <div className="mt-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                 <h5 className="font-bold text-indigo-900 text-sm mb-1">Current Tutor Style</h5>
                 <p className="text-xs text-indigo-700 leading-relaxed italic">
                    "{TUTOR_PROMPTS[config.personality].split('\n')[0]}"
                 </p>
             </div>
          </div>
       </div>

       {/* Right: Customization Tabs */}
       <div className="flex-1 bg-white flex flex-col rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50/50 overflow-x-auto">
              <button onClick={() => setActiveTab('base')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'base' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                  <Box size={18} /> Model
              </button>
              <button onClick={() => setActiveTab('face')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'face' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:bg-slate-100'}`} disabled={config.style === 'robot'}>
                  <Smile size={18} /> Features
              </button>
              <button onClick={() => setActiveTab('hair')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'hair' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:bg-slate-100'}`} disabled={config.style === 'robot'}>
                  <Palette size={18} /> Hair
              </button>
              <button onClick={() => setActiveTab('gear')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'gear' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                  <Shirt size={18} /> Style
              </button>
              <button onClick={() => setActiveTab('personality')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'personality' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                  <Mic2 size={18} /> Personality
              </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
              
              {activeTab === 'base' && (
                  <div className="space-y-8">
                      <div>
                          <h4 className="font-bold text-slate-800 mb-4">Choose Style</h4>
                          <div className="grid grid-cols-2 gap-4">
                              {AVATAR_OPTIONS.styles.map(s => (
                                  <button
                                    key={s.id}
                                    onClick={() => updateConfig('style', s.id)}
                                    className={`p-4 rounded-2xl border-2 text-center font-bold transition-all ${config.style === s.id ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                  >
                                      {s.name}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {config.style === 'robot' && (
                          <>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4">Chassis Shape</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {AVATAR_OPTIONS.robotBases.map(base => (
                                        <OptionButton 
                                            key={base.id} 
                                            label={base.name} 
                                            selected={config.baseId === base.id}
                                            onClick={() => updateConfig('baseId', base.id)}
                                        >
                                            <div className={`w-8 h-8 bg-slate-200 border-2 border-slate-300 ${base.id === 'robot_round' ? 'rounded-full' : base.id === 'robot_square' ? 'rounded-lg' : 'rounded-2xl'}`}></div>
                                        </OptionButton>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4">Paint Job</h4>
                                <div className="flex flex-wrap gap-3">
                                    {AVATAR_OPTIONS.robotColors.map(c => (
                                        <div key={c.id} className={`w-12 h-12 rounded-full ${c.value} cursor-pointer border-4 ${config.color === c.id ? 'border-slate-800 shadow-lg scale-110' : 'border-transparent'}`} onClick={() => updateConfig('color', c.id)}></div>
                                    ))}
                                </div>
                            </div>
                          </>
                      )}

                      {config.style === 'human' && (
                         <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 text-center text-sky-800">
                             <h4 className="font-bold mb-2">You chose Human!</h4>
                             <p className="text-sm">Use the tabs above to customize your skin, hair, and clothes.</p>
                         </div>
                      )}
                  </div>
              )}

              {activeTab === 'face' && config.style === 'human' && (
                  <div className="space-y-8">
                       <div>
                          <h4 className="font-bold text-slate-800 mb-4">Skin Tone</h4>
                          <div className="flex flex-wrap gap-3">
                              {AVATAR_OPTIONS.skinTones.map(t => (
                                  <ColorButton key={t.id} color={t.value} selected={config.skinTone === t.id} onClick={() => updateConfig('skinTone', t.id)} />
                              ))}
                          </div>
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 mb-4">Eye Color</h4>
                          <div className="flex flex-wrap gap-3">
                              {AVATAR_OPTIONS.eyeColors.map(t => (
                                  <ColorButton key={t.id} color={t.value} selected={config.eyeColor === t.id} onClick={() => updateConfig('eyeColor', t.id)} />
                              ))}
                          </div>
                       </div>
                  </div>
              )}

              {activeTab === 'hair' && config.style === 'human' && (
                  <div className="space-y-8">
                       <div>
                          <h4 className="font-bold text-slate-800 mb-4">Hair Style</h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                              {AVATAR_OPTIONS.hairStyles.map(h => (
                                  <OptionButton key={h.id} label={h.name} selected={config.hairStyle === h.id} onClick={() => updateConfig('hairStyle', h.id)}>
                                      <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                                  </OptionButton>
                              ))}
                          </div>
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 mb-4">Hair Color</h4>
                          <div className="flex flex-wrap gap-3">
                              {AVATAR_OPTIONS.hairColors.map(t => (
                                  <ColorButton key={t.id} color={t.value} selected={config.hairColor === t.id} onClick={() => updateConfig('hairColor', t.id)} />
                              ))}
                          </div>
                       </div>
                  </div>
              )}

              {activeTab === 'gear' && (
                  <div className="space-y-8">
                       {config.style === 'human' && (
                           <div>
                                <h4 className="font-bold text-slate-800 mb-4">Clothing</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {AVATAR_OPTIONS.clothing.map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => updateConfig('clothing', c.id)}
                                            className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${config.clothing === c.id ? 'border-sky-500 bg-sky-50' : 'border-slate-100 hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${c.value} border-2 border-white shadow-sm`}></div>
                                            <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                        </button>
                                    ))}
                                </div>
                           </div>
                       )}
                       <div>
                          <h4 className="font-bold text-slate-800 mb-4">Accessories</h4>
                          <div className="grid grid-cols-3 gap-3">
                              {AVATAR_OPTIONS.accessories.map(a => (
                                  <OptionButton key={a.id} label={a.name} selected={config.accessoryId === a.id} onClick={() => updateConfig('accessoryId', a.id)}>
                                      <span className="text-xl font-bold text-slate-300">{a.id === 'none' ? '∅' : '+'}</span>
                                  </OptionButton>
                              ))}
                          </div>
                       </div>
                  </div>
              )}
              
              {activeTab === 'personality' && (
                  <div className="space-y-8">
                       <div>
                          <h4 className="font-bold text-slate-800 mb-4">Choose AI Tutor Personality</h4>
                          <div className="grid grid-cols-2 gap-4">
                              {AVATAR_OPTIONS.personalities.map(p => (
                                  <button 
                                      key={p.id}
                                      onClick={() => updateConfig('personality', p.id as any)}
                                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 text-center transition-all ${
                                          config.personality === p.id ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md' : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                                      }`}
                                  >
                                      <div className={`p-3 rounded-full ${config.personality === p.id ? 'bg-indigo-200' : 'bg-slate-100'}`}>
                                          {getIcon(p.icon)}
                                      </div>
                                      <div>
                                          <div className="font-bold text-sm">{p.name}</div>
                                          <div className="text-[10px] mt-1 opacity-70">
                                              {p.id === 'friendly' ? 'Encouraging & Fun' : 
                                               p.id === 'strict' ? 'Precise & Logical' :
                                               p.id === 'playful' ? 'Chaotic & Silly' : 'Peaceful & Slow'}
                                          </div>
                                      </div>
                                  </button>
                              ))}
                          </div>
                          
                          <div className="mt-6 bg-slate-50 border border-slate-100 rounded-xl p-4">
                              <h5 className="font-bold text-slate-700 text-sm mb-2">Instructor Behavior</h5>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                  {TUTOR_PROMPTS[config.personality]}
                              </p>
                          </div>
                       </div>
                  </div>
              )}

          </div>
       </div>
    </div>
  );
};

export default AvatarStudio;
