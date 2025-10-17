import { Profile, ShopItem, InventoryItem, TaskTemplate, UserTask, Question, FeedItem } from '../types';

export const mockCurrentUser: Profile = {
  id: 'user-001',
  username: 'n3o_pwnr',
  password: 'password123',
  display_name: 'NeoPwner',
  avatar_url: 'https://picsum.photos/seed/user-001/200',
  bio: 'Master of the digital realm. Challenge me if you dare.',
  creds: 5000,
  xp: 1250,
  level: 8,
  stamina: 95,
  stamina_max: 100,
  security_level: 25,
  hacking_skill: 30,
  last_online_at: new Date().toISOString(),
  badges: ['10_wins_streak', 'alpha_tester'],
  role: 'player',
};

export const mockPlayers: Profile[] = [
  {
    id: 'user-002',
    username: 'gl1tch_w1tch',
    password: 'password123',
    display_name: 'GlitchWitch',
    avatar_url: 'https://picsum.photos/seed/user-002/200',
    bio: 'Casting spells in the machine.',
    creds: 8200,
    xp: 2100,
    level: 10,
    stamina: 100,
    stamina_max: 100,
    security_level: 32,
    hacking_skill: 28,
    last_online_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
    badges: ['top_10_player'],
    role: 'player',
  },
  {
    id: 'user-003',
    username: 'cyb3r_samura1',
    password: 'password123',
    display_name: 'CyberSamurai',
    avatar_url: 'https://picsum.photos/seed/user-003/200',
    bio: 'Code is my sword.',
    creds: 3450,
    xp: 900,
    level: 6,
    stamina: 100,
    stamina_max: 100,
    security_level: 20,
    hacking_skill: 22,
    last_online_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    badges: [],
    role: 'player',
  },
  {
    id: 'user-004',
    username: 'd4rk_c0de',
    password: 'password123',
    display_name: 'DarkCode',
    avatar_url: 'https://picsum.photos/seed/user-004/200',
    bio: 'In the shadows of the net.',
    creds: 15000,
    xp: 3500,
    level: 15,
    stamina: 100,
    stamina_max: 100,
    security_level: 40,
    hacking_skill: 45,
    last_online_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    badges: ['beta_tester', 'high_roller'],
    role: 'player',
  },
];

export const mockAdminUser: Profile = {
  id: 'user-admin-sobbi',
  username: 'Sobbi',
  password: 'sobbi-brain',
  display_name: 'Sobbi (Admin)',
  avatar_url: 'https://picsum.photos/seed/admin-sobbi/200',
  bio: 'System Administrator.',
  creds: 999999,
  xp: 999999,
  level: 99,
  stamina: 100,
  stamina_max: 100,
  security_level: 99,
  hacking_skill: 99,
  last_online_at: new Date().toISOString(),
  badges: ['admin'],
  role: 'admin',
};


export const mockShopItems: ShopItem[] = [
  {
    id: 'item-001',
    slug: 'attack-boost-10',
    title: 'ICE Breaker v1',
    description: 'Boosts hacking skill by 10% for 1 hour.',
    price_creds: 250,
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
    price_creds: 250,
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
    price_creds: 500,
    tier: 1,
    item_type: 'consumable',
    payload: { effect: 'stamina_refill', value: 25 },
    image_url: 'https://picsum.photos/seed/item-003/200',
  },
  {
    id: 'item-006',
    slug: 'perm-hack-boost-1',
    title: 'Neural Upgrade Chip',
    description: 'A rare processor that permanently increases your base Hacking Skill by 1.',
    price_creds: 5000,
    tier: 3,
    item_type: 'permanent_boost',
    payload: { effect: 'perm_hack_skill', value: 1 },
    image_url: 'https://picsum.photos/seed/item-006/200',
  },
  {
    id: 'item-007',
    slug: 'perm-security-boost-1',
    title: 'Quantum Firewall Patch',
    description: 'Applies a quantum entanglement algorithm to permanently boost your Security Level by 1.',
    price_creds: 5000,
    tier: 3,
    item_type: 'permanent_boost',
    payload: { effect: 'perm_security_level', value: 1 },
    image_url: 'https://picsum.photos/seed/item-007/200',
  },
  {
    id: 'item-005',
    slug: 'stamina-refill-large',
    title: 'Hyper-Caffeinated Jolt',
    description: 'A questionable concoction that fully restores stamina. Use with caution.',
    price_creds: 1000,
    tier: 2,
    item_type: 'consumable',
    payload: { effect: 'stamina_refill', value: 100 },
    image_url: 'https://picsum.photos/seed/item-005/200',
  },
  {
    id: 'item-004',
    slug: 'neon-avatar-frame',
    title: 'Neon Frame',
    description: 'A cool cosmetic frame for your avatar.',
    price_creds: 1500,
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

// --- New Task Mock Data ---

export const mockTaskTemplates: TaskTemplate[] = [
    {
        id: 'task-template-001',
        slug: 'daily-hack-3',
        title: 'Daily Incursion',
        description: 'Successfully hack 3 different players.',
        task_type: 'daily',
        reward_creds: 250,
        reward_xp: 100,
        conditions: { type: 'win_hack', count: 3 },
    },
    {
        id: 'task-template-002',
        slug: 'weekly-spend-5k',
        title: 'High Roller',
        description: 'Spend 5,000 creds in the shop this week.',
        task_type: 'weekly',
        reward_creds: 1000,
        reward_xp: 300,
        conditions: { type: 'spend_creds', count: 5000 },
    },
    {
        id: 'task-template-003',
        slug: 'oneoff-first-purchase',
        title: 'First Acquisition',
        description: 'Buy your first item from the shop.',
        task_type: 'oneoff',
        reward_creds: 100,
        reward_xp: 50,
        conditions: { type: 'spend_creds', count: 1 },
    }
];

export const mockUserTasks: UserTask[] = [
    {
        id: 'user-task-001',
        user_id: 'user-001',
        task_template_id: 'task-template-001',
        status: 'in_progress',
        progress: { current: 1, needed: 3 },
        template: mockTaskTemplates[0],
    },
    {
        id: 'user-task-002',
        user_id: 'user-001',
        task_template_id: 'task-template-002',
        status: 'available',
        progress: { current: 0, needed: 5000 },
        template: mockTaskTemplates[1],
    },
    {
        id: 'user-task-003',
        user_id: 'user-001',
        task_template_id: 'task-template-003',
        status: 'completed',
        progress: { current: 1, needed: 1 },
        template: mockTaskTemplates[2],
    }
];

// --- New Quiz Mock Data ---

export const mockSubjects: string[] = [
    'Science', 'Maths', 'English', 'Global Perspective', 'Russian language', 
    'Russian literature', 'German language', 'Geography', 'Kyrgyz language', 'Kyrgyz history'
];

export const mockQuestions: (Omit<Question, 'correct_answer'> & { correct_choice_index: number })[] = [
  {
    id: 'math-001',
    subject: 'Maths',
    prompt: 'What is 2 + 2 * 2?',
    choices: ['6', '8', '4', '10'],
    correct_choice_index: 0,
  },
  {
    id: 'math-002',
    subject: 'Maths',
    prompt: 'What is the square root of 81?',
    choices: ['7', '8', '9', '10'],
    correct_choice_index: 2,
  },
  {
    id: 'science-001',
    subject: 'Science',
    prompt: 'What is the chemical symbol for water?',
    choices: ['O2', 'H2O', 'CO2', 'NaCl'],
    correct_choice_index: 1,
  },
  {
    id: 'science-002',
    subject: 'Science',
    prompt: 'What planet is known as the Red Planet?',
    choices: ['Earth', 'Mars', 'Jupiter', 'Venus'],
    correct_choice_index: 1,
  },
];

// --- New Feed Mock Data ---

export const mockFeedItems: FeedItem[] = [
    {
        id: 'feed-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        type: 'hack_result',
        text: '<strong>GlitchWitch</strong> just totally pwned <strong>CyberSamurai</strong> and swiped <strong>850 creds!</strong> Ouch.',
        reactions: [
            { emoji: '🔥', count: 5 },
            { emoji: '💀', count: 2 },
            { emoji: '💰', count: 8 },
            { emoji: '😂', count: 1 },
        ],
    },
    {
        id: 'feed-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        type: 'item_activation',
        text: '<strong>DarkCode</strong> activated a <strong>Firewall Shield</strong>. Getting harder to crack!',
        reactions: [
            { emoji: '🔥', count: 3 },
            { emoji: '💀', count: 0 },
            { emoji: '💰', count: 0 },
            { emoji: '😂', count: 0 },
        ],
    },
    {
        id: 'feed-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: 'hack_result',
        text: '<strong>NeoPwner</strong>\'s hack against <strong>GlitchWitch</strong> failed! The Witch\'s defenses are no joke.',
        reactions: [
            { emoji: '🔥', count: 1 },
            { emoji: '💀', count: 4 },
            { emoji: '💰', count: 0 },
            { emoji: '😂', count: 10 },
        ],
    },
];
