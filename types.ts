
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  coins: number;
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
  price_coins: number;
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
    coins: number;
    xp: number;
  };
  attacker_xp_gain: number;
  defender_xp_gain: number;
  stamina_cost: number;
}
