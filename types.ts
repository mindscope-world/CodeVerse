
export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  avatarId: string;
  badges: string[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  LOGIC_BUILDER = 'LOGIC_BUILDER',
  CODE_LAB = 'CODE_LAB',
  AVATAR_STUDIO = 'AVATAR_STUDIO'
}

export type AvatarEmotion = 'neutral' | 'happy' | 'sad' | 'thinking' | 'surprised' | 'focused';

export interface AvatarConfig {
  baseId: string;
  color: string;
  accessoryId: string;
}

export interface AvatarPart {
  id: string;
  type: 'base' | 'color' | 'accessory';
  name: string;
  unlockLevel: number;
  previewColor?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  locked: boolean;
  xpReward: number;
}

// --- Logic Builder Types ---

export type BlockCategory = 'event' | 'control' | 'action' | 'variable' | 'math' | 'logic';

export interface BlockDefinition {
  type: string;
  category: BlockCategory;
  label: string;
  color: string;
  icon?: string;
  hasChildren?: boolean;
  inputs?: {
    name: string;
    type: 'text' | 'number' | 'select' | 'variable';
    label?: string;
    options?: string[];
    defaultValue?: any;
  }[];
}

export interface BlockInstance {
  id: string;
  type: string;
  params: Record<string, any>;
  children?: BlockInstance[]; // For nested blocks (if, loop)
}

export interface RuntimeState {
  variables: Record<string, any>;
  consoleOutput: string[];
  currentBlockId: string | null;
  isRunning: boolean;
  isFinished: boolean;
  error: string | null;
}
