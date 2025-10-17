
import { Profile, HackEmulationResult, HackResult, ShopItem, InventoryItem, UserTask, Question, FeedItem, ReactionEmoji, GameState } from '../types';
import { mockCurrentUser, mockPlayers, mockShopItems, mockInventory, mockUserTasks, mockSubjects, mockQuestions, mockFeedItems, mockAdminUser } from './mockData';

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

// --- LOCAL STORAGE PERSISTENCE ---
const GAME_STATE_KEY = 'brainheist_game_state';
let gameState: GameState;

const saveGameState = () => {
    try {
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    } catch (e) {
        console.error("Failed to save game state to localStorage", e);
    }
};

const loadGameState = (): GameState => {
    try {
        const storedState = localStorage.getItem(GAME_STATE_KEY);
        if (storedState) {
            const parsedState = JSON.parse(storedState);
            if (parsedState.players && parsedState.feedItems) {
                console.log("Game state loaded from localStorage.");
                return parsedState;
            }
        }
    } catch (e) {
        console.error("Failed to parse game state from localStorage", e);
    }
    
    console.log("Initializing new game state from mock data.");
    return {
        players: JSON.parse(JSON.stringify([mockCurrentUser, ...mockPlayers, mockAdminUser])),
        shopItems: JSON.parse(JSON.stringify(mockShopItems)),
        inventory: JSON.parse(JSON.stringify(mockInventory)),
        userTasks: JSON.parse(JSON.stringify(mockUserTasks)),
        questions: JSON.parse(JSON.stringify(mockQuestions)),
        feedItems: JSON.parse(JSON.stringify(mockFeedItems)),
    };
};

// Initialize the game state when the service module is first loaded.
gameState = loadGameState();
// If the state was newly initialized from mock data, save it so it persists.
if (!localStorage.getItem(GAME_STATE_KEY)) {
    saveGameState();
}


const SIMULATED_DELAY = 500;

// Helper to simulate network delay
const delay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), SIMULATED_DELAY));

// --- AUTH FUNCTIONS ---
export const login = async (username: string, password?: string): Promise<Profile | null> => {
    const user = gameState.players.find(p => p.username === username && p.password === password);
    if (user) {
        return delay(JSON.parse(JSON.stringify(user)));
    }
    return delay(null);
};

export const updateBio = async (userId: string, newBio: string): Promise<Profile | null> => {
    const user = gameState.players.find(p => p.id === userId);
    if (user) {
        user.bio = newBio;
        saveGameState();
        return delay(JSON.parse(JSON.stringify(user)));
    }
    return delay(null);
}

export const getPlayerById = async (userId: string): Promise<Profile | null> => {
    const user = gameState.players.find(p => p.id === userId);
    return user ? delay(JSON.parse(JSON.stringify(user))) : delay(null);
};


export const getPlayers = async (excludeId?: string): Promise<Profile[]> => {
  let players = gameState.players.filter(p => p.role !== 'admin');
  if (excludeId) {
    players = players.filter(p => p.id !== excludeId)
  }
  return delay(JSON.parse(JSON.stringify(players)));
};

export const getShopItems = async (): Promise<ShopItem[]> => {
  return delay(JSON.parse(JSON.stringify(gameState.shopItems)));
}

export const getInventory = async (userId: string): Promise<InventoryItem[]> => {
  const userInventory = gameState.inventory.filter(i => i.user_id === userId);
  userInventory.forEach(invItem => {
    invItem.itemDetails = gameState.shopItems.find(shopItem => shopItem.id === invItem.item_id);
  });
  return delay(JSON.parse(JSON.stringify(userInventory)));
}

// --- Feed Service Functions ---
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
    gameState.feedItems.unshift(newItem); // Add to the top of the feed
};

export const getFeed = async (): Promise<FeedItem[]> => {
    return delay([...gameState.feedItems]);
};

export const reactToFeedItem = async (feedItemId: string, emoji: ReactionEmoji): Promise<FeedItem | null> => {
    const item = gameState.feedItems.find(i => i.id === feedItemId);
    if (item) {
        const reaction = item.reactions.find(r => r.emoji === emoji);
        if (reaction) {
            reaction.count++;
        }
        saveGameState();
        return delay({ ...item });
    }
    return delay(null);
};

// --- Hacking Service Functions ---
export const emulateHack = async (attacker: Profile, defender: Profile): Promise<HackEmulationResult> => {
  const A_power = attacker.hacking_skill * (1 + Math.log(1 + attacker.xp / 1000));
  const D_power = defender.security_level * (1 + Math.log(1 + defender.xp / 1000));
  const delta = A_power - D_power;
  const S = 25;
  let win_prob = 1 / (1 + Math.exp(-delta / S));
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

  const mutableAttacker = gameState.players.find(p => p.id === attacker.id);
  const mutableDefender = gameState.players.find(p => p.id === defender.id);

  if (!mutableAttacker || !mutableDefender) {
    console.error("Attacker or defender not found in game state!");
    return delay({ win: false, loot: { creds: 0, xp: 0 }, attacker_xp_gain: 0, defender_xp_gain: 0, stamina_cost: emulation.stamina_cost });
  }

  mutableAttacker.stamina = Math.max(0, mutableAttacker.stamina - emulation.stamina_cost);
  
  let loot = { creds: 0, xp: 0 };
  let attacker_xp_gain = 0;
  let defender_xp_gain = 0;
  let feedText = '';

  if (win) {
    const base_loot_creds = Math.floor(Math.min(mutableDefender.creds * 0.05, 200 + 5 * mutableAttacker.hacking_skill));
    const loot_multiplier = 1 + (Math.random() - 0.5) * 0.2;
    loot.creds = Math.floor(Math.max(0, base_loot_creds * loot_multiplier));
    attacker_xp_gain = Math.floor(10 + (emulation.attacker_power / emulation.defender_power) * 5);
    loot.xp = attacker_xp_gain;
    
    mutableAttacker.creds += loot.creds;
    mutableAttacker.xp += loot.xp;
    mutableDefender.creds = Math.max(0, mutableDefender.creds - loot.creds);
    
    feedText = `<strong>${attacker.display_name}</strong> just schooled <strong>${defender.display_name}</strong> and made off with <strong>$${loot.creds.toLocaleString()} creds!</strong>`;
  } else {
    defender_xp_gain = Math.floor(5 + 2);
    mutableDefender.xp += defender_xp_gain;
    feedText = `<strong>${attacker.display_name}</strong>'s hack attempt on <strong>${defender.display_name}</strong> was a total fail! LOL.`;
  }
  
  addFeedItem(feedText, 'hack_result');
  saveGameState();

  return delay({
    win,
    loot,
    attacker_xp_gain,
    defender_xp_gain,
    stamina_cost: emulation.stamina_cost,
  });
};

// --- Shop & Inventory Service ---
export const buyItem = async (user: Profile, item: ShopItem): Promise<{success: boolean, message: string, updatedUser: Profile | null}> => {
  const mutableUser = gameState.players.find(p => p.id === user.id);
  if (!mutableUser || mutableUser.creds < item.price_creds) {
    return delay({ success: false, message: "Not enough creds!", updatedUser: null });
  }
  
  mutableUser.creds -= item.price_creds;

  if (item.payload.effect === 'stamina_refill') {
      mutableUser.stamina = Math.min(mutableUser.stamina_max, mutableUser.stamina + item.payload.value);
  } else {
    const existingItem = gameState.inventory.find(i => i.user_id === user.id && i.item_id === item.id);
    if(existingItem) {
      existingItem.qty += 1;
    } else {
      gameState.inventory.push({
        id: `inv-${Date.now()}`,
        user_id: user.id,
        item_id: item.id,
        qty: 1,
        activated: false,
        itemDetails: item
      });
    }
  }

  saveGameState();
  return delay({ success: true, message: `Purchased ${item.title}!`, updatedUser: { ...mutableUser } });
}

export const activateItem = async (user: Profile, inventoryId: string): Promise<{success: boolean, message: string, updatedItem: InventoryItem | null}> => {
  const item = gameState.inventory.find(i => i.id === inventoryId && i.user_id === user.id);
  if (!item) return delay({ success: false, message: "Item not found!", updatedItem: null });
  if (item.activated) return delay({ success: false, message: "Item already active!", updatedItem: item });

  if (item.itemDetails?.item_type === 'consumable') {
      item.qty -= 1;
  } else {
      item.activated = true;
  }
  
  const message = item.itemDetails?.item_type === 'consumable' ? `${item.itemDetails.title} consumed!` : `${item.itemDetails.title} activated!`;
  
  if (item.itemDetails && item.itemDetails.tier > 1) {
    addFeedItem(`<strong>${user.display_name}</strong> just activated a <strong>${item.itemDetails.title}</strong>!`, 'item_activation');
  }

  if (item.qty <= 0) {
      gameState.inventory = gameState.inventory.filter(i => i.id !== inventoryId);
  }

  saveGameState();
  return delay({ success: true, message: message, updatedItem: {...item} });
};

// --- Task Service Functions ---
export const getTasks = async (userId: string): Promise<UserTask[]> => {
  return delay(JSON.parse(JSON.stringify(gameState.userTasks)));
};

export const acceptTask = async (userTaskId: string): Promise<{success: boolean, updatedTask: UserTask | null}> => {
    const task = gameState.userTasks.find(t => t.id === userTaskId);
    if (!task || task.status !== 'available') {
        return delay({ success: false, updatedTask: null });
    }
    task.status = 'in_progress';
    saveGameState();
    return delay({ success: true, updatedTask: {...task} });
};

export const claimTaskReward = async (userTaskId: string, userId: string): Promise<{success: boolean, updatedTask: UserTask | null, reward: {creds: number, xp: number} | null}> => {
    const task = gameState.userTasks.find(t => t.id === userTaskId);
    const user = gameState.players.find(p => p.id === userId);
    if (!task || !user || task.status !== 'completed') {
        return delay({ success: false, updatedTask: null, reward: null });
    }
    task.status = 'claimed';
    const reward = {
        creds: task.template.reward_creds,
        xp: task.template.reward_xp,
    };
    user.creds += reward.creds;
    user.xp += reward.xp;
    saveGameState();
    return delay({ success: true, updatedTask: {...task}, reward });
};

// --- Quiz Service Functions ---
export const getSubjects = async (): Promise<string[]> => {
  return delay([...mockSubjects]);
};

export const getQuestions = async (subject: string): Promise<Question[]> => {
  const questions = gameState.questions.filter(q => q.subject === subject);
  return delay(JSON.parse(JSON.stringify(questions)));
};

export const submitAnswer = async (questionId: string, answerIndex: number, userId: string): Promise<{correct: boolean, reward: {creds: number, xp: number}}> => {
  const question = gameState.questions.find(q => q.id === questionId);
  const user = gameState.players.find(p => p.id === userId);
  if (!question || !user) {
    return delay({ correct: false, reward: { creds: 0, xp: 0 } });
  }
  const correct = question.correct_choice_index === answerIndex;
  const reward = correct ? { creds: 20, xp: 10 } : { creds: -5, xp: 0 };
  
  user.creds += reward.creds;
  user.xp += reward.xp;
  
  saveGameState();
  return delay({ correct, reward });
};

export const getAllQuestions = async(): Promise<Question[]> => {
  return delay(JSON.parse(JSON.stringify(gameState.questions)));
}

export const saveQuestion = async(question: Omit<Question, 'id'> & {id?: string}): Promise<Question> => {
    if (question.id) {
        const index = gameState.questions.findIndex(q => q.id === question.id);
        if (index > -1) {
            gameState.questions[index] = { ...gameState.questions[index], ...question };
            saveGameState();
            return delay(gameState.questions[index]);
        }
    }
    const newQuestion: Question = {
        ...question,
        id: `question-${Math.random().toString(36).substring(2, 9)}`,
    };
    gameState.questions.push(newQuestion);
    saveGameState();
    return delay(newQuestion);
}

export const deleteQuestion = async(questionId: string): Promise<{success: boolean}> => {
    const index = gameState.questions.findIndex(q => q.id === questionId);
    if (index > -1) {
        gameState.questions.splice(index, 1);
        saveGameState();
        return delay({ success: true });
    }
    return delay({ success: false });
}

// --- ADMIN FUNCTIONS ---
export const addPlayer = async(playerData: Omit<Profile, 'id' | 'avatar_url' | 'last_online_at' | 'badges'>): Promise<Profile> => {
    const newPlayer: Profile = {
        id: `user-${Date.now()}`,
        ...playerData,
        avatar_url: `https://picsum.photos/seed/${Date.now()}/200`,
        last_online_at: new Date().toISOString(),
        badges: [],
        role: 'player',
    };
    gameState.players.push(newPlayer);
    saveGameState();
    return delay(newPlayer);
};

export const deletePlayer = async(playerId: string): Promise<{success: boolean}> => {
    const index = gameState.players.findIndex(p => p.id === playerId);
    if (index > -1) {
        gameState.players.splice(index, 1);
        saveGameState();
        return delay({ success: true });
    }
    return delay({ success: false });
};

export const addCreds = async(playerId: string, amount: number): Promise<Profile | null> => {
    const player = gameState.players.find(p => p.id === playerId);
    if(player) {
        player.creds += amount;
        saveGameState();
        return delay({ ...player });
    }
    return delay(null);
}

export const addXp = async(playerId: string, amount: number): Promise<Profile | null> => {
    const player = gameState.players.find(p => p.id === playerId);
    if(player) {
        player.xp += amount;
        // Simple level up logic for demonstration
        const xpForNextLevel = Math.floor(100 * Math.pow(player.level + 1, 1.6));
        if (player.xp >= xpForNextLevel) {
            player.level += 1;
        }
        saveGameState();
        return delay({ ...player });
    }
    return delay(null);
}

export const giveItem = async(playerId: string, itemId: string): Promise<InventoryItem | null> => {
    const player = gameState.players.find(p => p.id === playerId);
    const itemDetails = gameState.shopItems.find(i => i.id === itemId);
    if (player && itemDetails) {
        const existingItem = gameState.inventory.find(i => i.user_id === playerId && i.item_id === itemId);
        if(existingItem) {
            existingItem.qty += 1;
            saveGameState();
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
            gameState.inventory.push(newInventoryItem);
            saveGameState();
            return delay(newInventoryItem);
        }
    }
    return delay(null);
}

export const addBadge = async(playerId: string, badge: string): Promise<Profile | null> => {
    const player = gameState.players.find(p => p.id === playerId);
    if(player && !player.badges.includes(badge)) {
        player.badges.push(badge);
        saveGameState();
        return delay({ ...player });
    }
    return delay(null);
}
