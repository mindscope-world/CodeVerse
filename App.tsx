import React, { useState } from 'react';
import { Layout, BookOpen, User, Trophy, Grid } from 'lucide-react';
import AvatarInterface from './components/AvatarInterface';
import LogicBuilder from './components/LogicBuilder';
import CodeLab from './components/CodeLab';
import AvatarStudio from './components/AvatarStudio';
import { AppView, UserProfile, AvatarConfig, AvatarEmotion } from './types';
import { INITIAL_PROFILE, LESSONS, DEFAULT_AVATAR_CONFIG } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [generatedCode, setGeneratedCode] = useState<string | undefined>(undefined);
  const [user] = useState<UserProfile>(INITIAL_PROFILE);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>('neutral');

  const handleLogicToCode = (code: string) => {
    setGeneratedCode(code);
    setCurrentView(AppView.CODE_LAB);
    setAvatarEmotion('happy'); // Celebration for finishing logic!
    setTimeout(() => setAvatarEmotion('neutral'), 3000);
  };

  const NavButton = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setAvatarEmotion('neutral');
      }}
      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full transition-all text-sm font-bold whitespace-nowrap ${
        currentView === view
          ? 'bg-sky-500 text-white shadow-md shadow-sky-200'
          : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="h-screen bg-sky-50 flex flex-col overflow-hidden">
      
      {/* 1. TOP MENU */}
      <header className="bg-white border-b border-sky-100 p-3 lg:p-4 flex items-center justify-between shrink-0 z-30 shadow-sm relative">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-indigo-200 shadow-lg shrink-0">
                C
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight hidden md:block">CodeVerse</h1>
        </div>

        {/* Center: Navigation */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-100/80 backdrop-blur p-1.5 rounded-full border border-slate-200 shadow-inner max-w-[60%] overflow-x-auto no-scrollbar">
             <NavButton view={AppView.DASHBOARD} icon={Grid} label="Home" />
             <NavButton view={AppView.LOGIC_BUILDER} icon={Layout} label="Logic" />
             <NavButton view={AppView.CODE_LAB} icon={BookOpen} label="Code" />
             <NavButton view={AppView.AVATAR_STUDIO} icon={User} label="Studio" />
        </nav>

        {/* Right: User Profile */}
        <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end">
                <span className="font-bold text-slate-700 text-sm">{user.name}</span>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Lvl {user.level}</span>
             </div>
             <div className="w-10 h-10 bg-sky-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-sky-600 overflow-hidden shrink-0">
                <User size={20} />
             </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
         
         {/* Left Sidebar: Avatar Companion (Desktop Only) */}
         <aside className="hidden lg:flex w-80 bg-white/50 border-r border-sky-100 flex-col gap-4 p-4 overflow-y-auto shrink-0">
             <div className="flex-1 flex flex-col min-h-[350px]">
                <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3 px-1">Interactive Companion</h3>
                <div className="flex-1 relative">
                    <div className="absolute inset-0">
                        <AvatarInterface config={avatarConfig} emotion={avatarEmotion} />
                    </div>
                </div>
             </div>
             
             {/* XP Card */}
             <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 shrink-0">
                <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-slate-500 uppercase">Progress</span>
                     <Trophy size={16} className="text-yellow-500" />
                </div>
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-black text-slate-800">{user.xp}</span>
                    <span className="text-xs font-bold text-slate-400 mb-1">XP</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                    <div className="bg-yellow-400 h-2 rounded-full shadow-sm" style={{ width: '65%' }}></div>
                </div>
                <div className="text-xs text-slate-400 text-center">350 XP to Level 4</div>
             </div>
         </aside>

         {/* Content Area */}
         <main className="flex-1 flex flex-col min-w-0 bg-sky-50/50 p-4 lg:p-6 relative overflow-hidden">
             
             {/* View Header */}
             <div className="mb-6 shrink-0 flex justify-between items-end">
                 <div>
                    {currentView === AppView.DASHBOARD && (
                        <>
                        <h2 className="text-3xl font-bold text-slate-800">Welcome back! 👋</h2>
                        <p className="text-slate-500 font-medium">What will you create today?</p>
                        </>
                    )}
                    {currentView === AppView.LOGIC_BUILDER && (
                        <>
                        <h2 className="text-2xl font-bold text-slate-800">Logic Builder 🧩</h2>
                        <p className="text-slate-500">Drag & drop blocks to build your algorithm.</p>
                        </>
                    )}
                    {currentView === AppView.CODE_LAB && (
                        <>
                        <h2 className="text-2xl font-bold text-slate-800">Code Lab 💻</h2>
                        <p className="text-slate-500">Write real Python code with AI assistance.</p>
                        </>
                    )}
                    {currentView === AppView.AVATAR_STUDIO && (
                        <>
                        <h2 className="text-2xl font-bold text-slate-800">Avatar Studio 🎨</h2>
                        <p className="text-slate-500">Customize your digital identity.</p>
                        </>
                    )}
                 </div>
             </div>

             {/* View Container */}
             <div className="flex-1 relative min-h-0">
                <div className="absolute inset-0">
                    {currentView === AppView.DASHBOARD && (
                        <div className="h-full overflow-y-auto pr-1 pb-10">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-slate-700">Next Missions</h3>
                                    {LESSONS.map(lesson => (
                                        <div key={lesson.id} className={`p-5 rounded-3xl border-2 transition-all ${lesson.locked ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-white bg-white shadow-md hover:scale-[1.01] cursor-pointer group'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    lesson.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' :
                                                    lesson.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {lesson.difficulty}
                                                </span>
                                                {!lesson.locked && <div className="bg-sky-500 text-white rounded-full p-1.5 group-hover:bg-sky-400 transition-colors"><BookOpen size={14}/></div>}
                                            </div>
                                            <h4 className="font-bold text-base text-slate-800 mb-1">{lesson.title}</h4>
                                            <p className="text-slate-500 text-sm">{lesson.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                     <h3 className="font-bold text-lg text-slate-700 mb-4">Your Trophy Case</h3>
                                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-3 sm:grid-cols-4 gap-4">
                                        {user.badges.map((badge, idx) => (
                                            <div key={idx} className="aspect-square bg-sky-50 rounded-2xl flex flex-col items-center justify-center p-2 text-center hover:bg-sky-100 transition-colors">
                                                <Trophy className="text-yellow-500 mb-2" size={24} />
                                                <span className="text-[10px] font-bold text-sky-800 leading-tight">{badge}</span>
                                            </div>
                                        ))}
                                        <div className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                                            <span className="text-slate-300 text-xs font-bold">Locked</span>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === AppView.LOGIC_BUILDER && (
                        <div className="h-full">
                            <LogicBuilder onCodeGenerated={handleLogicToCode} setAvatarEmotion={setAvatarEmotion} />
                        </div>
                    )}

                    {currentView === AppView.CODE_LAB && (
                        <div className="h-full">
                            <CodeLab initialCode={generatedCode} setAvatarEmotion={setAvatarEmotion} />
                        </div>
                    )}

                    {currentView === AppView.AVATAR_STUDIO && (
                        <div className="h-full overflow-y-auto pb-10">
                            <AvatarStudio 
                            config={avatarConfig} 
                            setConfig={setAvatarConfig} 
                            userLevel={user.level} 
                            />
                        </div>
                    )}
                </div>
             </div>
         </main>
      </div>
    </div>
  );
};

export default App;