export interface Profile {
  id: string;
  username: string;
  password?: string; // For admin creation
  display_name: string;
  avatar_url: string;
  bio: string;
  creds: number;
  xp: number;
  level: number;
  stamina: number;
  stamina_max: number;
  security_level: number;
  hacking_skill: number;
  last_online_at: string;
  badges: string[];
}

export type ItemType = 'consumable' | 'equip' | 'cosmetic' | 'booster';
export type AccentColor = 'cyan' | 'pink' | 'purple' | 'lime';

export interface ShopItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_creds: number;
  tier: number;
  item_type: ItemType;
  payload: {
    effect: string;
    value: number;
    duration?: number;
  };
  image_url: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  qty: number;
  activated: boolean;
  itemDetails?: ShopItem;
}

export interface HackEmulationResult {
  attacker_power: number;
  defender_power: number;
  win_prob: number;
  stamina_cost: number;
}

export interface HackResult {
  win: boolean;
  loot: {
    creds: number;
    xp: number;
  };
  attacker_xp_gain: number;
  defender_xp_gain: number;
  stamina_cost: number;
}

// --- New Task Types ---

export type TaskType = 'daily' | 'weekly' | 'oneoff' | 'challenge' | 'batch';
export type TaskStatus = 'available' | 'accepted' | 'in_progress' | 'completed' | 'claimed' | 'failed' | 'expired';

export interface TaskTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  task_type: TaskType;
  reward_creds: number;
  reward_xp: number;
  reward_items?: any[]; // Simplified for now
  conditions: {
    type: 'hack' | 'win_hack' | 'spend_creds';
    count: number;
  };
}

export interface UserTask {
  id: string;
  user_id: string;
  task_template_id: string;
  status: TaskStatus;
  progress: {
    current: number;
    needed: number;
  };
  template: TaskTemplate;
}

// --- New Quiz Types ---
export interface Question {
  id: string;
  subject: string;
  prompt: string;
  choices: string[];
  correct_choice_index: number;
}

// --- New Feed Types ---
export type ReactionEmoji = '🔥' | '💀' | '💰' | '😂';

export interface Reaction {
    emoji: ReactionEmoji;
    count: number;
    // user_ids: string[]; // To prevent multiple reactions from same user
}

export type FeedItemType = 'hack_result' | 'item_activation' | 'level_up' | 'high_score';

export interface FeedItem {
    id: string;
    timestamp: string;
    type: FeedItemType;
    text: string;
    reactions: Reaction[];
}