
import { Profile, ShopItem, InventoryItem } from '../types';

export const mockCurrentUser: Profile = {
  id: 'user-001',
  username: 'n3o_pwnr',
  display_name: 'NeoPwner',
  avatar_url: 'https://picsum.photos/seed/user-001/200',
  bio: 'Master of the digital realm. Challenge me if you dare.',
  coins: 5000,
  xp: 1250,
  level: 8,
  stamina: 95,
  stamina_max: 100,
  security_level: 25,
  hacking_skill: 30,
  last_online_at: new Date().toISOString(),
  badges: ['10_wins_streak', 'alpha_tester'],
};

export const mockPlayers: Profile[] = [
  {
    id: 'user-002',
    username: 'gl1tch_w1tch',
    display_name: 'GlitchWitch',
    avatar_url: 'https://picsum.photos/seed/user-002/200',
    bio: 'Casting spells in the machine.',
    coins: 8200,
    xp: 2100,
    level: 10,
    stamina: 100,
    stamina_max: 100,
    security_level: 32,
    hacking_skill: 28,
    last_online_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
    badges: ['top_10_player'],
  },
  {
    id: 'user-003',
    username: 'cyb3r_samura1',
    display_name: 'CyberSamurai',
    avatar_url: 'https://picsum.photos/seed/user-003/200',
    bio: 'Code is my sword.',
    coins: 3450,
    xp: 900,
    level: 6,
    stamina: 100,
    stamina_max: 100,
    security_level: 20,
    hacking_skill: 22,
    last_online_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    badges: [],
  },
  {
    id: 'user-004',
    username: 'd4rk_c0de',
    display_name: 'DarkCode',
    avatar_url: 'https://picsum.photos/seed/user-004/200',
    bio: 'In the shadows of the net.',
    coins: 15000,
    xp: 3500,
    level: 15,
    stamina: 100,
    stamina_max: 100,
    security_level: 40,
    hacking_skill: 45,
    last_online_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    badges: ['beta_tester', 'high_roller'],
  },
];


export const mockShopItems: ShopItem[] = [
  {
    id: 'item-001',
    slug: 'attack-boost-10',
    title: 'ICE Breaker v1',
    description: 'Boosts hacking skill by 10% for 1 hour.',
    price_coins: 250,
    tier: 1,
    item_type: 'booster',
    payload: { effect: 'attack_percent', value: 10, duration: 3600 },
    image_url: 'https://picsum.photos/seed/item-001/200',
  },
  {
    id: 'item-002',
    slug: 'defense-boost-10',
    title: 'Firewall Shield',
    description: 'Boosts security level by 10% for 1 hour.',
    price_coins: 250,
    tier: 1,
    item_type: 'booster',
    payload: { effect: 'defense_percent', value: 10, duration: 3600 },
    image_url: 'https://picsum.photos/seed/item-002/200',
  },
  {
    id: 'item-003',
    slug: 'stamina-refill-small',
    title: 'Energy Drink',
    description: 'Instantly restores 25 stamina.',
    price_coins: 500,
    tier: 1,
    item_type: 'consumable',
    payload: { effect: 'stamina_refill', value: 25 },
    image_url: 'https://picsum.photos/seed/item-003/200',
  },
  {
    id: 'item-004',
    slug: 'neon-avatar-frame',
    title: 'Neon Frame',
    description: 'A cool cosmetic frame for your avatar.',
    price_coins: 1000,
    tier: 2,
    item_type: 'cosmetic',
    payload: { effect: 'cosmetic_frame', value: 1 },
    image_url: 'https://picsum.photos/seed/item-004/200',
  },
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv-001',
    user_id: 'user-001',
    item_id: 'item-001',
    qty: 3,
    activated: false,
  },
  {
    id: 'inv-002',
    user_id: 'user-001',
    item_id: 'item-003',
    qty: 1,
    activated: false,
  }
];

// Add itemDetails to inventory items
mockInventory.forEach(invItem => {
  invItem.itemDetails = mockShopItems.find(shopItem => shopItem.id === invItem.item_id);
});
