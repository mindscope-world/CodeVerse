
import React, { useState, useEffect, useRef } from 'react';
import { Layout, BookOpen, User, Trophy, Grid, Disc, StopCircle, BrainCircuit, Users, ClipboardCheck } from 'lucide-react';
import AvatarInterface from './components/AvatarInterface';
import LogicBuilder from './components/LogicBuilder';
import CodeLab from './components/CodeLab';
import AvatarStudio from './components/AvatarStudio';
import PresentationMode from './components/PresentationMode';
import BrainBuilder from './components/BrainBuilder';
import ClassroomMode from './components/ClassroomMode';
import AssessmentMode from './components/AssessmentMode';
import { AppView, UserProfile, AvatarConfig, AvatarEmotion, BlockInstance, IntelligenceModel, StudentContext, Submission } from './types';
import { INITIAL_PROFILE, LESSONS, DEFAULT_AVATAR_CONFIG } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Lifted State for Content
  const [program, setProgram] = useState<BlockInstance[]>([]);
  const [code, setCode] = useState<string>("# Start typing your Python code here...\n\nprint('Hello World')");
  
  // Assessment State
  const [submissions, setSubmissions] = useState<Submission[]>([
      {
          id: 'demo-1',
          missionTitle: 'Hello World Mission',
          codeSnapshot: "print('Hello World')",
          date: Date.now() - 86400000,
          status: 'graded',
          rubric: { clarity: 5, logic: 5, confidence: 4, total: 14 },
          feedback: {
              id: 'fb-1',
              teacherName: 'Ms. Sarah',
              avatarConfig: { ...DEFAULT_AVATAR_CONFIG, style: 'human', hairStyle: 'bob', personality: 'friendly' },
              text: "Fantastic start! Your explanation was super clear and your avatar looked very confident. Keep it up!",
              timestamp: Date.now()
          }
      }
  ]);
  
  // Context Monitoring State
  const [studentContext, setStudentContext] = useState<StudentContext>({
      currentTask: "Free Play",
      codeSnippet: "",
      recentError: undefined,
      isIdle: false
  });
  const idleTimer = useRef<number | null>(null);

  // Intelligence Layer State
  const [brainModel, setBrainModel] = useState<IntelligenceModel>({
      kpiTree: [
          { 
              id: 'root', label: 'Mission Success', weight: 100, 
              children: [
                  { id: 'c1', label: 'Survival', weight: 60, children: [] },
                  { id: 'c2', label: 'Efficiency', weight: 40, children: [] }
              ] 
          }
      ],
      rules: [
          { id: 'r1', condition: 'Health < 20%', action: 'Seek Repair Station', priority: 'High', active: true },
          { id: 'r2', condition: 'Inventory Full', action: 'Return to Base', priority: 'Medium', active: true }
      ],
      context: {
          allowAutonomousMovement: true,
          requireHumanApproval: true,
          temporalMemoryWindow: 30,
          riskTolerance: 'Medium'
      }
  });

  const [user, setUser] = useState<UserProfile>(INITIAL_PROFILE);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>('neutral');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // --- Idle Detection Logic ---
  const resetIdleTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      setStudentContext(prev => ({ ...prev, isIdle: false }));
      idleTimer.current = window.setTimeout(() => {
          setStudentContext(prev => ({ ...prev, isIdle: true }));
      }, 30000); // 30 seconds idle
  };

  useEffect(() => {
      window.addEventListener('mousemove', resetIdleTimer);
      window.addEventListener('keydown', resetIdleTimer);
      window.addEventListener('click', resetIdleTimer);
      resetIdleTimer(); // Init
      return () => {
          window.removeEventListener('mousemove', resetIdleTimer);
          window.removeEventListener('keydown', resetIdleTimer);
          window.removeEventListener('click', resetIdleTimer);
          if (idleTimer.current) clearTimeout(idleTimer.current);
      };
  }, []);

  // Update Context when code/view changes
  useEffect(() => {
      let task = "Free Play";
      if (currentView === AppView.LOGIC_BUILDER) task = "Building Logic Blocks";
      if (currentView === AppView.CODE_LAB) task = "Writing Python Code";
      if (currentView === AppView.CLASSROOM) task = "In Classroom";
      if (currentView === AppView.ASSESSMENT) task = "Submitting Assignment";
      
      setStudentContext(prev => ({
          ...prev,
          currentTask: task,
          codeSnippet: currentView === AppView.CODE_LAB ? code : JSON.stringify(program.map(b => b.type)),
      }));
  }, [code, program, currentView]);

  // Recording Timer
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleLogicToCode = (generatedCode: string) => {
    setCode(generatedCode);
    setCurrentView(AppView.CODE_LAB);
    setAvatarEmotion('happy'); 
    setTimeout(() => setAvatarEmotion('neutral'), 3000);
  };

  const toggleRecording = () => {
      if (isRecording) {
          // Stop
          setIsRecording(false);
          setRecordingTime(0);
          alert("Recording saved to your portfolio! (Simulation)");
      } else {
          setIsRecording(true);
      }
  };

  const handleAssessmentSubmit = (sub: Submission) => {
      setSubmissions(prev => [sub, ...prev]);
      // Mock Grading Process
      setTimeout(() => {
          setSubmissions(prev => prev.map(s => 
              s.id === sub.id ? {
                  ...s,
                  status: 'graded',
                  rubric: { clarity: 4, logic: 5, confidence: 5, total: 14 },
                  feedback: {
                      id: 'new-fb',
                      teacherName: "Ms. Sarah",
                      avatarConfig: { ...DEFAULT_AVATAR_CONFIG, style: 'human', hairStyle: 'bob', personality: 'friendly' },
                      text: "Great use of the loop logic! Your code is efficient. Maybe try adding a variable for the jump height next time?",
                      timestamp: Date.now()
                  }
              } : s
          ));
      }, 5000);
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
      
      {/* 1. TOP MENU (Hidden in Presentation Mode) */}
      {currentView !== AppView.PRESENTATION && (
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
                <NavButton view={AppView.CLASSROOM} icon={Users} label="Class" />
                <NavButton view={AppView.ASSESSMENT} icon={ClipboardCheck} label="Tasks" />
                <NavButton view={AppView.BRAIN_BUILDER} icon={BrainCircuit} label="AI Core" />
                <NavButton view={AppView.LOGIC_BUILDER} icon={Layout} label="Logic" />
                <NavButton view={AppView.CODE_LAB} icon={BookOpen} label="Code" />
                <NavButton view={AppView.AVATAR_STUDIO} icon={User} label="Studio" />
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={toggleRecording}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs border transition-all ${
                        isRecording ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {isRecording ? <StopCircle size={16} /> : <Disc size={16} />}
                    {isRecording ? formatTime(recordingTime) : "Record Explanation"}
                </button>

                <div className="hidden md:flex flex-col items-end">
                    <span className="font-bold text-slate-700 text-sm">{user.name}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Lvl {user.level}</span>
                </div>
                <div className="w-10 h-10 bg-sky-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-sky-600 overflow-hidden shrink-0">
                    <User size={20} />
                </div>
            </div>
        </header>
      )}

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
         
         {/* Sidebar: Dynamic sizing based on view */}
         <aside className={`
            hidden lg:flex transition-all duration-500 ease-in-out flex-col gap-4 p-4 overflow-y-auto shrink-0 bg-white/50 border-r border-sky-100
            ${currentView === AppView.PRESENTATION || currentView === AppView.CLASSROOM ? 'w-0 opacity-0 p-0 border-0' : 'w-80'}
         `}>
             <div className="flex-1 flex flex-col min-h-[350px]">
                {currentView !== AppView.PRESENTATION && <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3 px-1">Interactive Companion</h3>}
                
                <div className={`flex-1 relative transition-all duration-500 ${currentView === AppView.PRESENTATION ? 'scale-110 translate-y-10' : ''}`}>
                    <div className="absolute inset-0">
                        <AvatarInterface 
                            config={avatarConfig} 
                            emotion={avatarEmotion} 
                            isRecording={isRecording}
                            studentContext={studentContext}
                        />
                    </div>
                </div>
                
                {currentView !== AppView.PRESENTATION && (
                    <div className="text-center mt-2">
                        <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-bold border border-sky-200">
                            {user.avatarName}
                        </span>
                    </div>
                )}
             </div>
             
             {/* Hide XP Card in Presentation Mode */}
             {currentView !== AppView.PRESENTATION && (
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
             )}
         </aside>

         {/* Content Area */}
         <main className={`flex-1 flex flex-col min-w-0 bg-sky-50/50 p-4 lg:p-6 relative overflow-hidden transition-colors ${currentView === AppView.PRESENTATION || currentView === AppView.CLASSROOM ? 'bg-slate-900 p-0' : ''}`}>
             
             {/* View Header (Standard Mode) */}
             {currentView !== AppView.PRESENTATION && currentView !== AppView.CLASSROOM && (
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
                        {currentView === AppView.BRAIN_BUILDER && (
                            <>
                            <h2 className="text-2xl font-bold text-slate-800">AI Brain Builder 🧠</h2>
                            <p className="text-slate-500">Configure your avatar's intelligence and priorities.</p>
                            </>
                        )}
                        {currentView === AppView.ASSESSMENT && (
                            <>
                            <h2 className="text-2xl font-bold text-slate-800">Assessment Center 📊</h2>
                            <p className="text-slate-500">Submit assignments and view teacher feedback.</p>
                            </>
                        )}
                    </div>
                </div>
             )}

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
                            <LogicBuilder 
                                program={program}
                                setProgram={setProgram}
                                onCodeGenerated={handleLogicToCode} 
                                setAvatarEmotion={setAvatarEmotion} 
                                onPresent={() => setCurrentView(AppView.PRESENTATION)}
                            />
                        </div>
                    )}

                    {currentView === AppView.BRAIN_BUILDER && (
                        <div className="h-full pb-10 overflow-y-auto">
                            <BrainBuilder 
                                model={brainModel}
                                setModel={setBrainModel}
                            />
                        </div>
                    )}

                    {currentView === AppView.CODE_LAB && (
                        <div className="h-full">
                            <CodeLab 
                                code={code}
                                setCode={setCode}
                                setAvatarEmotion={setAvatarEmotion} 
                                onPresent={() => setCurrentView(AppView.PRESENTATION)}
                            />
                        </div>
                    )}

                    {currentView === AppView.AVATAR_STUDIO && (
                        <div className="h-full overflow-y-auto pb-10">
                            <AvatarStudio 
                                config={avatarConfig} 
                                setConfig={setAvatarConfig} 
                                user={user}
                                setUser={setUser}
                            />
                        </div>
                    )}

                    {currentView === AppView.CLASSROOM && (
                        <div className="h-full p-4 lg:p-8">
                            <ClassroomMode 
                                user={user}
                                userAvatarConfig={avatarConfig}
                            />
                        </div>
                    )}
                    
                    {currentView === AppView.ASSESSMENT && (
                        <div className="h-full">
                            <AssessmentMode 
                                user={user}
                                code={code}
                                avatarConfig={avatarConfig}
                                onSubmit={handleAssessmentSubmit}
                                submissions={submissions}
                            />
                        </div>
                    )}

                    {currentView === AppView.PRESENTATION && (
                        <div className="h-full p-4 lg:p-8">
                            <PresentationMode 
                                mode={program.length > 0 ? 'logic' : 'code'}
                                program={program}
                                code={code}
                                onExit={() => setCurrentView(AppView.DASHBOARD)}
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
