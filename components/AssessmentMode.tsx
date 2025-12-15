
import React, { useState } from 'react';
import { 
    Video, Star, PlayCircle, ClipboardList, CheckCircle, 
    MessageCircle, Calendar, Send, FileCode, Award, Loader2 
} from 'lucide-react';
import AvatarInterface from './AvatarInterface';
import { AvatarConfig, Submission, UserProfile } from '../types';
import { DEFAULT_AVATAR_CONFIG } from '../constants';

interface AssessmentModeProps {
  user: UserProfile;
  code: string;
  avatarConfig: AvatarConfig;
  onSubmit: (submission: Submission) => void;
  submissions: Submission[];
}

const TEACHER_CONFIG: AvatarConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    personality: 'friendly',
    style: 'human',
    hairStyle: 'bob',
    hairColor: 'black',
    clothing: 'shirt_check',
    skinTone: 'medium'
};

const AssessmentMode: React.FC<AssessmentModeProps> = ({ user, code, avatarConfig, onSubmit, submissions }) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Mock Submission Handler
  const handleSubmission = () => {
      const newSub: Submission = {
          id: Math.random().toString(36).substr(2, 9),
          missionTitle: "Loop-de-Loop Mission",
          codeSnapshot: code,
          date: Date.now(),
          status: 'submitted',
      };
      
      onSubmit(newSub);
      setRecordingComplete(false);
      setActiveTab('history');
      
      // Simulate grading after 3 seconds
      setTimeout(() => {
          // This would ideally update the state in parent app, but for demo we assume parent passes updated subs
          alert("Teacher has graded your assignment! Check History.");
      }, 3000);
  };

  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
        
        {/* Left: Navigation & List */}
        <div className="lg:w-1/3 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex gap-2 bg-slate-50">
                <button 
                    onClick={() => setActiveTab('submit')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'submit' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Video size={16} /> Submit Task
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ClipboardList size={16} /> Portfolio
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTab === 'submit' && (
                    <div className="text-center p-6 text-slate-500">
                        <FileCode size={48} className="mx-auto mb-4 text-slate-300" />
                        <h3 className="font-bold text-slate-700">Current Mission</h3>
                        <p className="text-xs mb-4">Loop-de-Loop</p>
                        <div className="bg-slate-100 rounded-xl p-3 text-left font-mono text-xs text-slate-600 mb-4 line-clamp-6">
                            {code}
                        </div>
                        <p className="text-sm">Ready to record your explanation?</p>
                    </div>
                )}

                {activeTab === 'history' && (
                    submissions.length === 0 ? (
                        <div className="text-center p-8 text-slate-400">
                            <ClipboardList size={48} className="mx-auto mb-2 opacity-50" />
                            <p>No submissions yet.</p>
                        </div>
                    ) : (
                        submissions.map(sub => (
                            <button 
                                key={sub.id}
                                onClick={() => setSelectedSubmissionId(sub.id)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedSubmissionId === sub.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-700">{sub.missionTitle}</span>
                                    {sub.status === 'graded' ? (
                                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            <CheckCircle size={10} /> Graded
                                        </span>
                                    ) : (
                                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Pending</span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                    <Calendar size={12} /> {new Date(sub.date).toLocaleDateString()}
                                </div>
                                {sub.rubric && (
                                    <div className="mt-2 flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} className={i < Math.round(sub.rubric.total / 3) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} />
                                        ))}
                                    </div>
                                )}
                            </button>
                        ))
                    )
                )}
            </div>
        </div>

        {/* Right: Detail View */}
        <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
            
            {activeTab === 'submit' ? (
                // --- SUBMISSION VIEW ---
                <div className="h-full flex flex-col">
                    <div className="flex-1 relative bg-slate-900 overflow-hidden p-6 flex flex-col items-center justify-center">
                        <div className="w-full max-w-md aspect-video relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700">
                            <AvatarInterface 
                                config={avatarConfig} 
                                emotion="happy"
                                isRecording={isRecording}
                                accessibility={user.accessibility}
                            />
                            {recordingComplete && !isRecording && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center flex-col text-white z-50">
                                    <CheckCircle size={48} className="text-green-400 mb-2" />
                                    <h3 className="font-bold text-xl">Recording Ready!</h3>
                                    <p className="text-sm opacity-80">0:45s • explanation.mp4</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                         <div className="text-sm text-slate-500">
                             <strong>Tip:</strong> Explain how your loop works!
                         </div>
                         <div className="flex gap-3">
                             {!recordingComplete ? (
                                 <button 
                                    onClick={() => {
                                        if (isRecording) {
                                            setIsRecording(false);
                                            setRecordingComplete(true);
                                        } else {
                                            setIsRecording(true);
                                        }
                                    }}
                                    className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50'}`}
                                 >
                                     {isRecording ? <><div className="w-3 h-3 bg-white rounded-sm"></div> Stop</> : <><div className="w-3 h-3 bg-red-500 rounded-full"></div> Record</>}
                                 </button>
                             ) : (
                                 <button 
                                    onClick={() => setRecordingComplete(false)}
                                    className="px-4 py-3 text-slate-500 font-bold hover:text-slate-700"
                                 >
                                     Retake
                                 </button>
                             )}

                             <button 
                                onClick={handleSubmission}
                                disabled={!recordingComplete}
                                className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg ${recordingComplete ? 'bg-indigo-600 text-white hover:bg-indigo-700 transform hover:scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                             >
                                 <Send size={18} /> Submit
                             </button>
                         </div>
                    </div>
                </div>
            ) : selectedSubmission ? (
                // --- FEEDBACK VIEW ---
                <div className="h-full flex flex-col">
                    {/* Teacher Feedback Header */}
                    <div className="h-2/5 bg-indigo-900 relative p-6 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        {selectedSubmission.status === 'graded' && selectedSubmission.feedback ? (
                            <div className="flex items-center gap-8 z-10 w-full max-w-3xl">
                                {/* Teacher Avatar */}
                                <div className="w-40 h-40 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-slate-800 shrink-0">
                                    <AvatarInterface 
                                        config={selectedSubmission.feedback.avatarConfig}
                                        emotion="happy"
                                        simulatedTalking={true} // Force mouth animation for feedback
                                    />
                                </div>
                                
                                {/* Speech Bubble */}
                                <div className="flex-1 bg-white rounded-2xl p-6 shadow-xl relative animate-in slide-in-from-right duration-500">
                                    <div className="absolute top-6 -left-3 w-6 h-6 bg-white transform rotate-45"></div>
                                    <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                        Ms. Sarah says:
                                    </h4>
                                    <p className="text-slate-700 leading-relaxed text-sm">
                                        "{selectedSubmission.feedback.text}"
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-400">
                                        <PlayCircle size={16} /> Play Audio Feedback
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-white/60">
                                <Loader2 size={48} className="mx-auto mb-4 animate-spin opacity-50" />
                                <h3 className="text-xl font-bold text-white">Waiting for Feedback...</h3>
                                <p className="text-sm">Your teacher will review your submission soon.</p>
                            </div>
                        )}
                    </div>

                    {/* Rubric & Details */}
                    <div className="flex-1 bg-white p-6 md:p-8 overflow-y-auto">
                        <div className="max-w-3xl mx-auto">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Award className="text-yellow-500" /> Assessment Score
                            </h3>

                            {selectedSubmission.rubric ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                        <div className="text-slate-400 text-xs font-bold uppercase mb-2">Clarity</div>
                                        <div className="flex justify-center gap-1 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16} className={i < selectedSubmission.rubric!.clarity ? "fill-sky-400 text-sky-400" : "text-slate-200"} />
                                            ))}
                                        </div>
                                        <div className="text-xs text-slate-500">How clearly you explained</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                        <div className="text-slate-400 text-xs font-bold uppercase mb-2">Logic</div>
                                        <div className="flex justify-center gap-1 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16} className={i < selectedSubmission.rubric!.logic ? "fill-purple-400 text-purple-400" : "text-slate-200"} />
                                            ))}
                                        </div>
                                        <div className="text-xs text-slate-500">Code efficiency & structure</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                        <div className="text-slate-400 text-xs font-bold uppercase mb-2">Confidence</div>
                                        <div className="flex justify-center gap-1 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16} className={i < selectedSubmission.rubric!.confidence ? "fill-green-400 text-green-400" : "text-slate-200"} />
                                            ))}
                                        </div>
                                        <div className="text-xs text-slate-500">Avatar presentation style</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl mb-6">
                                    Scores will appear here after grading.
                                </div>
                            )}

                            <div>
                                <h4 className="font-bold text-slate-700 mb-3">Submitted Code</h4>
                                <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto">
                                    <pre>{selectedSubmission.codeSnapshot}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 flex-col">
                    <MessageCircle size={48} className="mb-4 opacity-20" />
                    <p>Select a submission to view feedback</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default AssessmentMode;
