
import { Lesson, AvatarPart, AvatarConfig, BlockDefinition, UserProfile, TutorPersonality, Peer } from './types';

export const INITIAL_PROFILE: UserProfile = {
  name: "Alex",
  avatarName: "CodeBot",
  level: 3,
  xp: 1250,
  avatarId: "robot_1",
  badges: ["Loop Master", "Bug Hunter"],
  accessibility: {
    inputMode: 'camera',
    reducedMotion: false,
    avoidEyeContact: false,
    captionsEnabled: true,
    speechRate: 'normal'
  }
};

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  style: 'robot',
  baseId: 'robot_classic',
  color: 'indigo',
  accessoryId: 'none',
  skinTone: 'light',
  hairStyle: 'none',
  hairColor: 'brown',
  eyeColor: 'blue',
  clothing: 'tshirt_blue',
  backgroundColor: 'bg-slate-900',
  personality: 'friendly'
};

export const TUTOR_PROMPTS: Record<TutorPersonality, string> = {
  friendly: `You are CodeBot, a super friendly and encouraging coding coach for kids. 
             Tone: High energy, uses emojis, metaphor-heavy (e.g., "Think of a loop like a hamster wheel!").
             Strategy: Always validate the student's effort first. If they are stuck, give a small hint, never the answer.
             Reaction to Errors: "Oops! Bugs happen. Let's squash it together!"`,
  
  strict: `You are Professor Byte, a serious, precise, but fair mentor.
           Tone: Formal, concise, focuses on logic and efficiency. No emojis.
           Strategy: Demand precision. Ask Socratic questions: "Why did you choose that block?"
           Reaction to Errors: "Incorrect syntax. Analyze line 3. What is missing?"`,
  
  playful: `You are Glitch, a chaotic good robot friend!
            Tone: Silly, makes puns, references video games.
            Strategy: Gamify everything. "Level up your loop!" "That bug is a boss battle!"
            Reaction to Errors: "Womp womp. The code exploded (metaphorically). Try again!"`,
  
  calm: `You are ZenBot.
         Tone: Slow, peaceful, meditative.
         Strategy: Focus on flow and mindfulness. "Breathe in... code out..."
         Reaction to Errors: "A mistake is just a stepping stone to wisdom. Observe the error gently."`
};

export const AVATAR_OPTIONS = {
  styles: [
    { id: 'robot', name: 'Robot' },
    { id: 'human', name: 'Human' }
  ],
  personalities: [
    { id: 'friendly', name: 'Friendly Coach', icon: 'Smile' },
    { id: 'strict', name: 'Professor Byte', icon: 'Glasses' },
    { id: 'playful', name: 'Glitch (Playful)', icon: 'Gamepad2' },
    { id: 'calm', name: 'ZenBot', icon: 'Leaf' }
  ],
  skinTones: [
    { id: 'light', value: '#fce5d4', name: 'Light' },
    { id: 'fair', value: '#f5d0b1', name: 'Fair' },
    { id: 'medium', value: '#d4aa78', name: 'Medium' },
    { id: 'tan', value: '#b58b5a', name: 'Tan' },
    { id: 'dark', value: '#8d5524', name: 'Dark' },
    { id: 'deep', value: '#543015', name: 'Deep' }
  ],
  hairStyles: [
    { id: 'none', name: 'Bald' },
    { id: 'short', name: 'Short' },
    { id: 'bob', name: 'Bob' },
    { id: 'spiky', name: 'Spiky' },
    { id: 'pigtails', name: 'Pigtails' },
    { id: 'long', name: 'Long' }
  ],
  hairColors: [
    { id: 'black', value: '#1a1a1a', name: 'Black' },
    { id: 'brown', value: '#5d4037', name: 'Brown' },
    { id: 'blonde', value: '#e6c768', name: 'Blonde' },
    { id: 'red', value: '#c62828', name: 'Red' },
    { id: 'blue', value: '#1e88e5', name: 'Blue' },
    { id: 'pink', value: '#f48fb1', name: 'Pink' },
    { id: 'white', value: '#f5f5f5', name: 'White' }
  ],
  eyeColors: [
    { id: 'black', value: '#212121', name: 'Dark' },
    { id: 'blue', value: '#2196f3', name: 'Blue' },
    { id: 'green', value: '#4caf50', name: 'Green' },
    { id: 'brown', value: '#795548', name: 'Brown' },
    { id: 'purple', value: '#9c27b0', name: 'Purple' }
  ],
  clothing: [
    { id: 'tshirt_blue', value: 'bg-blue-500', name: 'Blue Tee' },
    { id: 'tshirt_red', value: 'bg-red-500', name: 'Red Tee' },
    { id: 'hoodie_gray', value: 'bg-slate-600', name: 'Gray Hoodie' },
    { id: 'shirt_check', value: 'bg-indigo-600', name: 'Plaid Shirt' },
    { id: 'suit_space', value: 'bg-orange-500', name: 'Space Suit' }
  ],
  robotColors: [
    { id: 'indigo', value: 'bg-indigo-500', name: 'Indigo' },
    { id: 'rose', value: 'bg-rose-500', name: 'Rose' },
    { id: 'emerald', value: 'bg-emerald-500', name: 'Emerald' },
    { id: 'amber', value: 'bg-amber-500', name: 'Amber' },
    { id: 'sky', value: 'bg-sky-500', name: 'Sky' }
  ],
  robotBases: [
    { id: 'robot_classic', name: 'Classic Bot' },
    { id: 'robot_round', name: 'Sphere Bot' },
    { id: 'robot_square', name: 'Cube Bot' }
  ],
  accessories: [
    { id: 'none', name: 'None' },
    { id: 'glasses', name: 'Glasses' },
    { id: 'hat_party', name: 'Party Hat' },
    { id: 'antenna_simple', name: 'Antenna' },
    { id: 'headphones', name: 'Headphones' }
  ]
};

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Events
  { type: 'start', category: 'event', label: 'On Start', color: 'bg-yellow-500', icon: 'Play' },
  
  // Control
  { 
    type: 'repeat', 
    category: 'control', 
    label: 'Repeat', 
    color: 'bg-orange-500', 
    hasChildren: true, 
    inputs: [
      { name: 'times', type: 'number', label: 'times', defaultValue: 3 }
    ]
  },
  { 
    type: 'if', 
    category: 'control', 
    label: 'If', 
    color: 'bg-orange-500', 
    hasChildren: true,
    inputs: [
        { name: 'condition_var', type: 'variable', label: 'Variable', defaultValue: 'score' },
        { name: 'operator', type: 'select', label: 'is', options: ['>', '<', '=='], defaultValue: '>' },
        { name: 'value', type: 'number', label: 'Value', defaultValue: 10 }
    ]
  },

  // Actions
  { type: 'print', category: 'action', label: 'Print', color: 'bg-blue-500', inputs: [{ name: 'message', type: 'text', defaultValue: 'Hello!' }] },
  { type: 'move', category: 'action', label: 'Move Avatar', color: 'bg-blue-500', inputs: [{ name: 'direction', type: 'select', options: ['Forward', 'Back', 'Left', 'Right'], defaultValue: 'Forward' }] },
  { type: 'wait', category: 'action', label: 'Wait', color: 'bg-blue-400', inputs: [{ name: 'seconds', type: 'number', label: 'seconds', defaultValue: 1 }] },

  // Variables
  { type: 'set_var', category: 'variable', label: 'Set Variable', color: 'bg-rose-500', inputs: [
      { name: 'name', type: 'variable', label: 'Name', defaultValue: 'score' },
      { name: 'value', type: 'number', label: 'to', defaultValue: 0 }
  ]},
  { type: 'change_var', category: 'variable', label: 'Change Variable', color: 'bg-rose-500', inputs: [
      { name: 'name', type: 'variable', label: 'Name', defaultValue: 'score' },
      { name: 'value', type: 'number', label: 'by', defaultValue: 1 }
  ]},
];

export const LESSONS: Lesson[] = [
  { id: '1', title: 'Hello World', description: 'Your first step into the coding verse.', difficulty: 'Beginner', locked: false, xpReward: 100 },
  { id: '2', title: 'Loop-de-Loop', description: 'Learn how to repeat actions without getting dizzy.', difficulty: 'Beginner', locked: false, xpReward: 150 },
  { id: '3', title: 'If This, Then That', description: 'Teaching your avatar to make decisions.', difficulty: 'Intermediate', locked: true, xpReward: 300 },
  { id: '4', title: 'Function Junction', description: 'Organize your code like a pro.', difficulty: 'Advanced', locked: true, xpReward: 500 },
];

export const SAFE_PHRASES = [
  "Good job! 🌟", 
  "I'm stuck, can anyone help? 🤔", 
  "Check out my code! 💻", 
  "That's so cool! 🚀",
  "How did you do that? 🤯", 
  "Ready to present! 🎤", 
  "Bug squashed! 🐛", 
  "Let's work together! 🤝"
];

export const REACTION_EMOJIS = ["👍", "👏", "❤️", "🔥", "🤔", "😂"];

export const MOCK_PEERS: Peer[] = [
    { 
        id: 'p1', name: 'Sarah', status: 'online', emotion: 'happy',
        avatarConfig: { ...DEFAULT_AVATAR_CONFIG, style: 'human', hairStyle: 'pigtails', hairColor: 'blonde', clothing: 'hoodie_gray' } 
    },
    { 
        id: 'p2', name: 'Jamal', status: 'working', emotion: 'focused',
        avatarConfig: { ...DEFAULT_AVATAR_CONFIG, style: 'human', hairStyle: 'short', skinTone: 'dark', clothing: 'suit_space' } 
    },
    { 
        id: 'p3', name: 'Robo-X', status: 'raising_hand', emotion: 'surprised',
        avatarConfig: { ...DEFAULT_AVATAR_CONFIG, style: 'robot', baseId: 'robot_round', color: 'rose' } 
    },
    { 
        id: 'p4', name: 'Maya', status: 'online', emotion: 'neutral',
        avatarConfig: { ...DEFAULT_AVATAR_CONFIG, style: 'human', hairStyle: 'long', clothing: 'shirt_check' } 
    }
];
