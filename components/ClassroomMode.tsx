
import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, Hand, MessageCircle, MoreHorizontal, 
    Smile, LayoutGrid, Monitor, Mic, Video
} from 'lucide-react';
import AvatarInterface from './AvatarInterface';
import { AvatarConfig, ChatMessage, Peer, UserProfile } from '../types';
import { SAFE_PHRASES, REACTION_EMOJIS, MOCK_PEERS, DEFAULT_AVATAR_CONFIG } from '../constants';

interface ClassroomModeProps {
  user: UserProfile;
  userAvatarConfig: AvatarConfig;
}

const ClassroomMode: React.FC<ClassroomModeProps> = ({ user, userAvatarConfig }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peers, setPeers] = useState<Peer[]>(MOCK_PEERS);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [teacherMode, setTeacherMode] = useState<'lecture' | 'group'>('lecture');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Simulate Classroom Activity
  useEffect(() => {
      const interval = setInterval(() => {
          if (Math.random() > 0.7) {
              const randomPeer = peers[Math.floor(Math.random() * peers.length)];
              const randomEmoji = REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)];
              
              // Trigger visual reaction
              setPeers(prev => prev.map(p => 
                  p.id === randomPeer.id ? { ...p, lastReaction: randomEmoji } : p
              ));

              // Clear reaction after 2s
              setTimeout(() => {
                  setPeers(prev => prev.map(p => 
                      p.id === randomPeer.id ? { ...p, lastReaction: undefined } : p
                  ));
              }, 2000);
          }
      }, 3000);
      return () => clearInterval(interval);
  }, [peers]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (content: string, type: 'text' | 'emoji' | 'system') => {
      const newMsg: ChatMessage = {
          id: Math.random().toString(),
          senderId: 'me',
          senderName: user.avatarName,
          content,
          type,
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, newMsg]);

      // Simulate Peer Response
      if (type === 'text') {
          setTimeout(() => {
              const randomPeer = peers[Math.floor(Math.random() * peers.length)];
              const reply: ChatMessage = {
                  id: Math.random().toString(),
                  senderId: randomPeer.id,
                  senderName: randomPeer.name,
                  content: REACTION_EMOJIS[0], // Thumbs up
                  type: 'emoji',
                  timestamp: Date.now()
              };
              setMessages(prev => [...prev, reply]);
          }, 1500);
      }
  };

  const toggleHand = () => {
      setIsHandRaised(!isHandRaised);
      if (!isHandRaised) {
          sendMessage("✋ Raised hand", 'system');
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 rounded-[2rem] overflow-hidden shadow-inner relative">
       
       {/* Background Decoration */}
       <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, #64748b 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

       {/* Top Bar: Teacher Stage */}
       <div className="h-1/3 bg-slate-800 p-4 flex gap-6 shrink-0 relative shadow-md z-10">
           
           {/* Teacher Avatar Area */}
           <div className="w-1/4 min-w-[200px] relative">
               <div className="absolute inset-0 bg-slate-700 rounded-2xl overflow-hidden border-4 border-indigo-500 shadow-2xl">
                   {/* Using AvatarInterface for Teacher - Always animated */}
                   <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full z-20 font-bold">INSTRUCTOR</div>
                   <AvatarInterface 
                        config={{...DEFAULT_AVATAR_CONFIG, personality: 'friendly', style: 'robot', color: 'emerald'}} 
                        emotion="happy"
                   />
               </div>
           </div>

           {/* Shared Whiteboard / Screen */}
           <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 p-4 relative overflow-hidden flex flex-col items-center justify-center text-slate-400">
               <div className="absolute top-2 right-2 flex gap-2">
                   <span className="flex items-center gap-1 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse"><Monitor size={10} /> LIVE</span>
               </div>
               
               {teacherMode === 'lecture' ? (
                   <>
                        <h3 className="text-2xl font-black text-white mb-2">Today's Mission: Loop-de-Loop! 🎢</h3>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 font-mono text-sm text-green-400 w-full max-w-lg shadow-lg">
                            <span className="text-pink-400">for</span> i <span className="text-pink-400">in</span> <span className="text-yellow-400">range</span>(5):<br/>
                            &nbsp;&nbsp;<span className="text-blue-400">avatar</span>.jump()
                        </div>
                   </>
               ) : (
                   <div className="text-center">
                       <LayoutGrid size={48} className="mx-auto mb-2 opacity-50" />
                       <p>Group Work Mode Active</p>
                       <p className="text-xs">Collaborating on "Project Alpha"</p>
                   </div>
               )}
           </div>
       </div>

       {/* Middle: Peer Grid & Chat */}
       <div className="flex-1 flex overflow-hidden">
           
           {/* Peer Grid */}
           <div className="flex-1 p-6 overflow-y-auto">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Users size={14} /> Classmates ({peers.length + 1} Online)
               </h4>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                   {/* Self */}
                   <div className={`aspect-video bg-white rounded-xl shadow-sm border-2 relative overflow-hidden group ${isHandRaised ? 'border-yellow-400 ring-4 ring-yellow-100' : 'border-white'}`}>
                       <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                           You
                       </div>
                       {isHandRaised && <div className="absolute top-2 left-2 z-20 text-2xl animate-bounce">✋</div>}
                       {/* Simplified Render for Grid (using AvatarInterface but static props could be optimized) */}
                       <div className="transform scale-75 origin-top">
                            <AvatarInterface config={userAvatarConfig} emotion="neutral" />
                       </div>
                   </div>

                   {/* Peers */}
                   {peers.map(peer => (
                       <div key={peer.id} className="aspect-video bg-white rounded-xl shadow-sm border-2 border-white relative overflow-hidden">
                           <div className="absolute bottom-2 left-2 z-20 bg-black/40 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                               {peer.name}
                           </div>
                           {peer.status === 'raising_hand' && <div className="absolute top-2 left-2 z-20 text-2xl animate-bounce">✋</div>}
                           {peer.lastReaction && (
                               <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 backdrop-blur-sm animate-in zoom-in fade-in duration-300">
                                   <span className="text-6xl animate-bounce">{peer.lastReaction}</span>
                               </div>
                           )}
                           <div className="transform scale-75 origin-top opacity-90 grayscale-[0.2]">
                                <AvatarInterface config={peer.avatarConfig} emotion={peer.emotion} />
                           </div>
                       </div>
                   ))}
               </div>
           </div>

           {/* Chat Sidebar */}
           <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-xl">
               <div className="p-3 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center bg-slate-50">
                   <span>Class Chat</span>
                   <div className="flex gap-1">
                       <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                   {messages.map(msg => (
                       <div key={msg.id} className={`flex flex-col ${msg.senderId === 'me' ? 'items-end' : 'items-start'}`}>
                           {msg.type !== 'system' && <span className="text-[10px] text-slate-400 mb-0.5 px-1">{msg.senderName}</span>}
                           <div className={`
                                px-3 py-2 rounded-xl text-sm max-w-[85%]
                                ${msg.type === 'system' ? 'bg-slate-100 text-slate-500 text-xs italic text-center w-full' : 
                                  msg.senderId === 'me' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}
                           `}>
                               {msg.type === 'emoji' ? <span className="text-2xl">{msg.content}</span> : msg.content}
                           </div>
                       </div>
                   ))}
                   <div ref={chatEndRef} />
               </div>

               {/* Safe Comms Controls */}
               <div className="p-3 border-t border-slate-100 bg-white">
                   {/* Emoji Bar */}
                   <div className="flex justify-between mb-3 px-1">
                       {REACTION_EMOJIS.map(emoji => (
                           <button 
                                key={emoji} 
                                onClick={() => sendMessage(emoji, 'emoji')}
                                className="text-xl hover:scale-125 transition-transform p-1"
                            >
                               {emoji}
                           </button>
                       ))}
                   </div>
                   
                   {/* Phrases Grid */}
                   <div className="grid grid-cols-2 gap-2 h-24 overflow-y-auto pr-1 custom-scrollbar">
                       {SAFE_PHRASES.map((phrase, idx) => (
                           <button 
                                key={idx}
                                onClick={() => sendMessage(phrase, 'text')}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-2 rounded-lg text-left transition-colors font-medium"
                           >
                               {phrase}
                           </button>
                       ))}
                   </div>
               </div>
           </div>
       </div>

       {/* Bottom Controls Bar */}
       <div className="bg-white border-t border-slate-200 p-3 flex justify-between items-center shrink-0">
           <div className="flex gap-2">
               <button 
                   onClick={toggleHand}
                   className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isHandRaised ? 'bg-yellow-400 text-yellow-900 shadow-yellow-200 shadow-md transform -translate-y-1' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
               >
                   <Hand size={18} /> {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
               </button>
               <button className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200">
                   <Mic size={18} />
               </button>
               <button className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200">
                   <Video size={18} />
               </button>
           </div>
           
           <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
               <span>Sound: On</span>
               <span>Mode: {teacherMode === 'lecture' ? 'Lecture' : 'Groups'}</span>
           </div>
       </div>

    </div>
  );
};

export default ClassroomMode;
