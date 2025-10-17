
import { Profile, HackEmulationResult, HackResult, ShopItem, InventoryItem, UserTask, Question, FeedItem, ReactionEmoji } from '../types';
import { mockCurrentUser, mockPlayers, mockShopItems, mockInventory, mockUserTasks, mockSubjects, mockQuestions, mockFeedItems, mockAdminUser } from './mockData';

// --- LOCAL STORAGE PERSISTENCE ---
const CUSTOM_PLAYERS_KEY = 'brainheist_custom_players';

const getCustomPlayers = (): Profile[] => {
    try {
        const storedPlayers = localStorage.getItem(CUSTOM_PLAYERS_KEY);
        if (storedPlayers) {
            return JSON.parse(storedPlayers);
        }
    } catch (e) {
        console.error("Failed to parse custom players from localStorage", e);
    }
    return [];
};

const saveCustomPlayers = (players: Profile[]) => {
    try {
        localStorage.setItem(CUSTOM_PLAYERS_KEY, JSON.stringify(players));
    } catch (e) {
        console.error("Failed to save custom players to localStorage", e);
    }
};


// --- START OF SOUND SERVICE ---

const sounds = {
  ui_click: 'https://cdn.aistudio.dev/cohere-assets/sounds/click.wav',
  task_accept: 'https://cdn.aistudio.dev/cohere-assets/sounds/confirm.wav',
  task_claim: 'https://cdn.aistudio.dev/cohere-assets/sounds/coin.wav',
  quiz_correct: 'https://cdn.aistudio.dev/cohere-assets/sounds/correct.wav',
  quiz_incorrect: 'https://cdn.aistudio.dev/cohere-assets/sounds/incorrect.wav',
  hack_start: 'https://cdn.aistudio.dev/cohere-assets/sounds/swoosh.wav',
  hack_win: 'https://cdn.aistudio.dev/cohere-assets/sounds/success.wav',
  hack_fail: 'https://cdn.aistudio.dev/cohere-assets/sounds/failure.wav',
  shop_buy: 'https://cdn.aistudio.dev/cohere-assets/sounds/buy.wav',
  item_activate: 'https://cdn.aistudio.dev/cohere-assets/sounds/activate.wav',
  glitch: 'https://cdn.aistudio.dev/cohere-assets/sounds/glitch.wav',
  admin_action: 'https://cdn.aistudio.dev/cohere-assets/sounds/admin.wav',
};

type SoundName = keyof typeof sounds;

const audioCache: { [key in SoundName]?: HTMLAudioElement } = {};

let muted = localStorage.getItem('brainheist_muted') === 'true';

export const preloadSounds = () => {
  for (const key in sounds) {
    if (Object.prototype.hasOwnProperty.call(sounds, key)) {
      const name = key as SoundName;
      if (!audioCache[name]) {
        const audio = new Audio(sounds[name]);
        audio.preload = 'auto';
        audio.load();
        audioCache[name] = audio;
      }
    }
  }
};

export const playSound = (name: SoundName) => {
  if (muted) return;
  const audio = audioCache[name];
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.error(`Error playing sound ${name}:`, e));
  }
};

export const isMuted = () => muted;

export const toggleMute = () => {
  muted = !muted;
  localStorage.setItem('brainheist_muted', String(muted));
  return muted;
};


// --- END OF SOUND SERVICE ---


const SIMULATED_DELAY = 500;
let ALL_MOCK_PLAYERS = [mockCurrentUser, ...mockPlayers, mockAdminUser, ...getCustomPlayers()];

// Helper to simulate network delay
const delay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), SIMULATED_DELAY));

// --- NEW AUTH FUNCTIONS ---
export const login = async (username: string, password?: string): Promise<Profile | null> => {
    const user = ALL_MOCK_PLAYERS.find(p => p.username === username && p.password === password);
    if (user) {
        return delay(JSON.parse(JSON.stringify(user)));
    }
    return delay(null);
};

export const updateBio = async (userId: string, newBio: string): Promise<Profile | null> => {
    const user = findMutablePlayer(userId);
    if (user) {
        user.bio = newBio;
        return delay(JSON.parse(JSON.stringify(user)));
    }
    return delay(null);
}

export const getPlayerById = async (userId: string): Promise<Profile | null> => {
    const user = ALL_MOCK_PLAYERS.find(p => p.id === userId);
    return user ? delay(JSON.parse(JSON.stringify(user))) : delay(null);
};


export const getPlayers = async (excludeId?: string): Promise<Profile[]> => {
  let players = ALL_MOCK_PLAYERS.filter(p => p.role !== 'admin');
  if (excludeId) {
    players = players.filter(p => p.id !== excludeId)
  }
  return delay(JSON.parse(JSON.stringify(players)));
};

export const getShopItems = async (): Promise<ShopItem[]> => {
  return delay(JSON.parse(JSON.stringify(mockShopItems)));
}

export const getInventory = async (userId: string): Promise<InventoryItem[]> => {
  const userInventory = mockInventory.filter(i => i.user_id === userId);
  return delay(JSON.parse(JSON.stringify(userInventory)));
}

// --- New Feed Service Functions ---

const addFeedItem = (text: string, type: 'hack_result' | 'item_activation') => {
    const newItem: FeedItem = {
        id: `feed-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: type,
        text: text,
        reactions: [
            { emoji: '🔥', count: 0 },
            { emoji: '💀', count: 0 },
            { emoji: '💰', count: 0 },
            { emoji: '😂', count: 0 },
        ],
    };
    mockFeedItems.unshift(newItem); // Add to the top of the feed
};

export const getFeed = async (): Promise<FeedItem[]> => {
    return delay([...mockFeedItems]);
};

export const reactToFeedItem = async (feedItemId: string, emoji: ReactionEmoji): Promise<FeedItem | null> => {
    const item = mockFeedItems.find(i => i.id === feedItemId);
    if (item) {
        const reaction = item.reactions.find(r => r.emoji === emoji);
        if (reaction) {
            reaction.count++;
        }
        return delay({ ...item });
    }
    return delay(null);
};


export const emulateHack = async (attacker: Profile, defender: Profile): Promise<HackEmulationResult> => {
  // Using simplified formulas from the spec
  const A_power = attacker.hacking_skill * (1 + Math.log(1 + attacker.xp / 1000));
  const D_power = defender.security_level * (1 + Math.log(1 + defender.xp / 1000));

  const delta = A_power - D_power;
  const S = 25;
  let win_prob = 1 / (1 + Math.exp(-delta / S));

  // Clamp probability
  win_prob = Math.max(0.02, Math.min(0.98, win_prob));

  const stamina_cost = 10 + Math.round(attacker.hacking_skill / 10);

  return delay({
    attacker_power: parseFloat(A_power.toFixed(2)),
    defender_power: parseFloat(D_power.toFixed(2)),
    win_prob: parseFloat(win_prob.toFixed(2)),
    stamina_cost,
  });
};

export const performHack = async (attacker: Profile, defender: Profile): Promise<HackResult> => {
  const emulation = await emulateHack(attacker, defender);
  const u = Math.random();
  const win = u <= emulation.win_prob;

  let loot = { creds: 0, xp: 0 };
  let attacker_xp_gain = 0;
  let defender_xp_gain = 0;
  let feedText = '';

  if (win) {
    const base_loot_creds = Math.floor(Math.min(defender.creds * 0.05, 200 + 5 * attacker.hacking_skill));
    const loot_multiplier = 1 + (Math.random() - 0.5) * 0.2;
    loot.creds = Math.floor(base_loot_creds * loot_multiplier);
    attacker_xp_gain = Math.floor(10 + (emulation.attacker_power / emulation.defender_power) * 5);
    loot.xp = attacker_xp_gain;
    feedText = `<strong>${attacker.display_name}</strong> just schooled <strong>${defender.display_name}</strong> and made off with <strong>$${loot.creds.toLocaleString()} creds!</strong>`;
  } else {
    defender_xp_gain = Math.floor(5 + 2);
    feedText = `<strong>${attacker.display_name}</strong>'s hack attempt on <strong>${defender.display_name}</strong> was a total fail! LOL.`;
  }
  
  addFeedItem(feedText, 'hack_result');

  return delay({
    win,
    loot,
    attacker_xp_gain,
    defender_xp_gain,
    stamina_cost: emulation.stamina_cost,
  });
};

export const buyItem = async (user: Profile, item: ShopItem): Promise<{success: boolean, message: string, updatedUser: Profile | null}> => {
  const mutableUser = findMutablePlayer(user.id);
  if (!mutableUser || mutableUser.creds < item.price_creds) {
    return delay({ success: false, message: "Not enough creds!", updatedUser: null });
  }
  
  mutableUser.creds -= item.price_creds;

  // Handle stamina refill immediately
  if (item.payload.effect === 'stamina_refill') {
      mutableUser.stamina = Math.min(mutableUser.stamina_max, mutableUser.stamina + item.payload.value);
      return delay({ success: true, message: `Stamina refilled by ${item.payload.value}!`, updatedUser: { ...mutableUser } });
  }

  const existingItem = mockInventory.find(i => i.user_id === user.id && i.item_id === item.id);
  if(existingItem) {
    existingItem.qty += 1;
  } else {
    mockInventory.push({
      id: `inv-${Math.random()}`,
      user_id: user.id,
      item_id: item.id,
      qty: 1,
      activated: false,
      itemDetails: item
    });
  }
  return delay({ success: true, message: `Purchased ${item.title}!`, updatedUser: { ...mutableUser } });
}

export const activateItem = async (user: Profile, inventoryId: string): Promise<{success: boolean, message: string, updatedItem: InventoryItem | null}> => {
  const item = mockInventory.find(i => i.id === inventoryId && i.user_id === user.id);
  if (!item) {
    return delay({ success: false, message: "Item not found!", updatedItem: null });
  }
  if (item.activated) {
    return delay({ success: false, message: "Item already active!", updatedItem: item });
  }

  if (item.itemDetails?.item_type === 'consumable') {
      item.qty -= 1;
  } else {
      item.activated = true;
  }
  
  const message = item.itemDetails?.item_type === 'consumable' ? `${item.itemDetails.title} consumed!` : `${item.itemDetails.title} activated!`;
  
  if (item.itemDetails && item.itemDetails.tier > 1) {
    addFeedItem(`<strong>${user.display_name}</strong> just activated a <strong>${item.itemDetails.title}</strong>!`, 'item_activation');
  }

  return delay({ success: true, message: message, updatedItem: {...item} });
};

// --- New Task Service Functions ---

export const getTasks = async (userId: string): Promise<UserTask[]> => {
  // In a real app, this would filter tasks for the user. Here we return all for simplicity.
  return delay(JSON.parse(JSON.stringify(mockUserTasks)));
};

export const acceptTask = async (userTaskId: string): Promise<{success: boolean, updatedTask: UserTask | null}> => {
    const task = mockUserTasks.find(t => t.id === userTaskId);
    if (!task || task.status !== 'available') {
        return delay({ success: false, updatedTask: null });
    }
    task.status = 'in_progress';
    return delay({ success: true, updatedTask: {...task} });
};

export const claimTaskReward = async (userTaskId: string): Promise<{success: boolean, updatedTask: UserTask | null, reward: {creds: number, xp: number} | null}> => {
    const task = mockUserTasks.find(t => t.id === userTaskId);
    if (!task || task.status !== 'completed') {
        return delay({ success: false, updatedTask: null, reward: null });
    }
    task.status = 'claimed';
    const reward = {
        creds: task.template.reward_creds,
        xp: task.template.reward_xp,
    };
    return delay({ success: true, updatedTask: {...task}, reward });
};

// --- New Quiz Service Functions ---

export const getSubjects = async (): Promise<string[]> => {
  return delay([...mockSubjects]);
};

export const getQuestions = async (subject: string): Promise<Question[]> => {
  const questions = mockQuestions.filter(q => q.subject === subject);
  return delay(JSON.parse(JSON.stringify(questions)));
};

export const submitAnswer = async (questionId: string, answerIndex: number): Promise<{correct: boolean, reward: {creds: number, xp: number}}> => {
  const question = mockQuestions.find(q => q.id === questionId);
  if (!question) {
    return delay({ correct: false, reward: { creds: 0, xp: 0 } });
  }
  const correct = question.correct_choice_index === answerIndex;
  const reward = correct ? { creds: 20, xp: 10 } : { creds: -5, xp: 0 };
  return delay({ correct, reward });
};

export const getAllQuestions = async(): Promise<Question[]> => {
  return delay(JSON.parse(JSON.stringify(mockQuestions)));
}

export const saveQuestion = async(question: Omit<Question, 'id'> & {id?: string}): Promise<Question> => {
    if (question.id) {
        const index = mockQuestions.findIndex(q => q.id === question.id);
        if (index > -1) {
            mockQuestions[index] = { ...mockQuestions[index], ...question };
            return delay(mockQuestions[index]);
        }
    }
    const newQuestion: Question = {
        ...question,
        id: `question-${Math.random().toString(36).substring(2, 9)}`,
    };
    mockQuestions.push(newQuestion);
    return delay(newQuestion);
}

export const deleteQuestion = async(questionId: string): Promise<{success: boolean}> => {
    const index = mockQuestions.findIndex(q => q.id === questionId);
    if (index > -1) {
        mockQuestions.splice(index, 1);
        return delay({ success: true });
    }
    return delay({ success: false });
}

// --- NEW ADMIN FUNCTIONS ---
export const addPlayer = async(playerData: Omit<Profile, 'id' | 'avatar_url' | 'last_online_at' | 'badges'>): Promise<Profile> => {
    const newPlayer: Profile = {
        id: `user-${Date.now()}`,
        ...playerData,
        avatar_url: `https://picsum.photos/seed/${Date.now()}/200`,
        last_online_at: new Date().toISOString(),
        badges: [],
        role: 'player',
    };
    ALL_MOCK_PLAYERS.push(newPlayer);
    
    const customPlayers = getCustomPlayers();
    customPlayers.push(newPlayer);
    saveCustomPlayers(customPlayers);

    return delay(newPlayer);
};

export const deletePlayer = async(playerId: string): Promise<{success: boolean}> => {
    const index = ALL_MOCK_PLAYERS.findIndex(p => p.id === playerId);
    if (index > -1) {
        ALL_MOCK_PLAYERS.splice(index, 1);
        
        let customPlayers = getCustomPlayers();
        customPlayers = customPlayers.filter(p => p.id !== playerId);
        saveCustomPlayers(customPlayers);

        return delay({ success: true });
    }
    return delay({ success: false });
};


const findMutablePlayer = (playerId: string) => {
    return ALL_MOCK_PLAYERS.find(p => p.id === playerId);
}

export const addCreds = async(playerId: string, amount: number): Promise<Profile | null> => {
    const player = findMutablePlayer(playerId);
    if(player) {
        player.creds += amount;
        return delay({ ...player });
    }
    return delay(null);
}

export const addXp = async(playerId: string, amount: number): Promise<Profile | null> => {
    const player = findMutablePlayer(playerId);
    if(player) {
        player.xp += amount;
        // Simple level up logic for demonstration
        const xpForNextLevel = Math.floor(100 * Math.pow(player.level + 1, 1.6));
        if (player.xp >= xpForNextLevel) {
            player.level += 1;
        }
        return delay({ ...player });
    }
    return delay(null);
}

export const giveItem = async(playerId: string, itemId: string): Promise<InventoryItem | null> => {
    const player = findMutablePlayer(playerId);
    const itemDetails = mockShopItems.find(i => i.id === itemId);
    if (player && itemDetails) {
        const existingItem = mockInventory.find(i => i.user_id === playerId && i.item_id === itemId);
        if(existingItem) {
            existingItem.qty += 1;
            return delay({ ...existingItem });
        } else {
            const newInventoryItem: InventoryItem = {
                id: `inv-${Date.now()}`,
                user_id: playerId,
                item_id: itemId,
                qty: 1,
                activated: false,
                itemDetails: itemDetails,
            };
            mockInventory.push(newInventoryItem);
            return delay(newInventoryItem);
        }
    }
    return delay(null);
}

export const addBadge = async(playerId: string, badge: string): Promise<Profile | null> => {
    const player = findMutablePlayer(playerId);
    if(player && !player.badges.includes(badge)) {
        player.badges.push(badge);
        return delay({ ...player });
    }
    return delay(null);
}