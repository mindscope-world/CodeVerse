
export interface UserProfile {
  name: string;
  avatarName: string; // Separated identity
  level: number;
  xp: number;
  avatarId: string;
  badges: string[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  LOGIC_BUILDER = 'LOGIC_BUILDER',
  CODE_LAB = 'CODE_LAB',
  AVATAR_STUDIO = 'AVATAR_STUDIO',
  PRESENTATION = 'PRESENTATION',
  BRAIN_BUILDER = 'BRAIN_BUILDER',
  CLASSROOM = 'CLASSROOM'
}

export type AvatarEmotion = 'neutral' | 'happy' | 'sad' | 'thinking' | 'surprised' | 'focused';

export type AvatarStyle = 'robot' | 'human';

export type TutorPersonality = 'friendly' | 'strict' | 'playful' | 'calm';

export interface AvatarConfig {
  style: AvatarStyle;
  
  // Shared / Robot
  baseId: string; // 'robot_classic', 'robot_round' OR 'human_base'
  color: string; // Chassis color for robots
  accessoryId: string;

  // Human Specific
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  clothing: string;
  backgroundColor: string;
  
  // Personality
  personality: TutorPersonality;
}

export interface AvatarPart {
  id: string;
  type: 'base' | 'color' | 'accessory' | 'skin' | 'hair' | 'hairColor' | 'clothing' | 'eyes' | 'bg' | 'personality';
  name: string;
  value: string; // CSS class or color value
  unlockLevel: number;
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

// --- Intelligence Layer Types ---

export interface KPINode {
  id: string;
  label: string;
  weight: number; // 0-100 relevance
  children?: KPINode[];
}

export interface BusinessRule {
  id: string;
  condition: string; // e.g. "Energy < 20%"
  action: string;    // e.g. "Trigger Sleep Mode"
  priority: 'High' | 'Medium' | 'Low';
  active: boolean;
}

export interface DecisionContext {
  allowAutonomousMovement: boolean;
  requireHumanApproval: boolean; // For critical actions
  temporalMemoryWindow: number;  // Seconds to look back
  riskTolerance: 'Low' | 'Medium' | 'High';
}

export interface IntelligenceModel {
  kpiTree: KPINode[];
  rules: BusinessRule[];
  context: DecisionContext;
}

export interface StudentContext {
  currentTask: string;
  codeSnippet?: string;
  recentError?: string;
  isIdle: boolean;
  lastSuccessTime?: number;
}

// --- Classroom Types ---

export interface Peer {
  id: string;
  name: string;
  avatarConfig: AvatarConfig;
  status: 'online' | 'away' | 'raising_hand' | 'working';
  emotion: AvatarEmotion;
  lastReaction?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'me' or peerId
  senderName: string;
  content: string;
  type: 'text' | 'emoji' | 'system';
  timestamp: number;
}
