
import { Lesson, AvatarPart, AvatarConfig, BlockDefinition, UserProfile } from './types';

export const INITIAL_PROFILE: UserProfile = {
  name: "CoderKid",
  level: 3,
  xp: 1250,
  avatarId: "robot_1",
  badges: ["Loop Master", "Bug Hunter"]
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

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  baseId: 'robot_classic',
  color: 'indigo',
  accessoryId: 'none'
};

export const AVATAR_PARTS: AvatarPart[] = [
  // Bases
  { id: 'robot_classic', type: 'base', name: 'Classic Bot', unlockLevel: 1 },
  { id: 'robot_round', type: 'base', name: 'Sphere Bot', unlockLevel: 3 },
  { id: 'robot_square', type: 'base', name: 'Cube Bot', unlockLevel: 5 },
  
  // Colors
  { id: 'indigo', type: 'color', name: 'Cosmic Indigo', previewColor: 'bg-indigo-500', unlockLevel: 1 },
  { id: 'rose', type: 'color', name: 'Neon Rose', previewColor: 'bg-rose-500', unlockLevel: 2 },
  { id: 'emerald', type: 'color', name: 'Matrix Green', previewColor: 'bg-emerald-500', unlockLevel: 4 },
  { id: 'amber', type: 'color', name: 'Circuit Gold', previewColor: 'bg-amber-500', unlockLevel: 6 },
  { id: 'sky', type: 'color', name: 'Sky Blue', previewColor: 'bg-sky-500', unlockLevel: 8 },

  // Accessories
  { id: 'none', type: 'accessory', name: 'No Accessory', unlockLevel: 1 },
  { id: 'antenna_simple', type: 'accessory', name: 'Basic Antenna', unlockLevel: 1 },
  { id: 'antenna_double', type: 'accessory', name: 'Dual Receivers', unlockLevel: 3 },
  { id: 'hat_party', type: 'accessory', name: 'Party Hat', unlockLevel: 4 },
  { id: 'headphones', type: 'accessory', name: 'Gamer Headset', unlockLevel: 6 },
];
