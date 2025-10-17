import { Profile, HackEmulationResult, HackResult, ShopItem, InventoryItem, UserTask, Question, FeedItem, ReactionEmoji, FeedItemType, TaskTemplate } from '../types';
import { mockCurrentUser, mockPlayers, mockShopItems, mockInventory, mockUserTasks, mockSubjects, mockQuestions, mockFeedItems, mockAdminUser } from './mockData';
import { db, seedDatabase } from './firebase';
import { 
    collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, runTransaction, orderBy, limit, writeBatch, documentId, collectionGroup
} from 'firebase/firestore';


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
  perm_boost: 'https://cdn.aistudio.dev/cohere-assets/sounds/upgrade.wav',
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

// --- FIREBASE PERSISTENCE ---

export const initializeApp = async () => {
    await seedDatabase();
}

// Helper to convert snapshot to object
const fromSnap = <T,>(snap: any): T => ({ id: snap.id, ...snap.data() } as T);


// --- AUTH FUNCTIONS ---
export const login = async (username: string, password?: string): Promise<Profile | null> => {
    // WARNING: Storing and checking plaintext passwords is NOT SECURE.
    // This is for demonstration purposes only. Use Firebase Authentication in a real app.
    const playersRef = collection(db, 'players');
    const q = query(playersRef, where('username', '==', username), where('password', '==', password));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return null;
    }
    return fromSnap<Profile>(querySnapshot.docs[0]);
};

export const updateBio = async (userId: string, newBio: string): Promise<Profile | null> => {
    const userRef = doc(db, 'players', userId);
    await updateDoc(userRef, { bio: newBio });
    const updatedUser = await getPlayerById(userId);
    return updatedUser;
}

export const getPlayerById = async (userId: string): Promise<Profile | null> => {
    const userRef = doc(db, 'players', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return fromSnap<Profile>(docSnap);
    }
    return null;
};


export const getPlayers = async (excludeId?: string): Promise<Profile[]> => {
    const playersRef = collection(db, 'players');
    const q = query(playersRef, where('role', '!=', 'admin'));
    const querySnapshot = await getDocs(q);
    
    let players: Profile[] = [];
    querySnapshot.forEach((doc) => {
        players.push(fromSnap<Profile>(doc));
    });

    if (excludeId) {
        players = players.filter(p => p.id !== excludeId);
    }
    return players;
};

export const getShopItems = async (): Promise<ShopItem[]> => {
    const itemsRef = collection(db, 'shopItems');
    const querySnapshot = await getDocs(itemsRef);
    const items: ShopItem[] = [];
    querySnapshot.forEach(doc => items.push(fromSnap<ShopItem>(doc)));
    return items;
}

export const getInventory = async (userId: string): Promise<InventoryItem[]> => {
    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const userInventory: InventoryItem[] = [];
    querySnapshot.forEach(doc => userInventory.push(fromSnap<InventoryItem>(doc)));

    // Fetch item details for each inventory item
    // In a larger app, this data would likely be denormalized for performance.
    for (const invItem of userInventory) {
        const itemRef = doc(db, 'shopItems', invItem.item_id);
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
            invItem.itemDetails = fromSnap<ShopItem>(itemSnap);
        }
    }
    return userInventory;
}

// --- Feed Service Functions ---
const addFeedItem = async (text: string, type: FeedItemType) => {
    await addDoc(collection(db, 'feedItems'), {
        timestamp: new Date().toISOString(),
        type: type,
        text: text,
        reactions: [
            { emoji: '🔥', count: 0 },
            { emoji: '💀', count: 0 },
            { emoji: '💰', count: 0 },
            { emoji: '😂', count: 0 },
        ],
    });
};

export const getFeed = async (): Promise<FeedItem[]> => {
    const feedRef = collection(db, 'feedItems');
    const q = query(feedRef, orderBy('timestamp', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    const feed: FeedItem[] = [];
    querySnapshot.forEach(doc => feed.push(fromSnap<FeedItem>(doc)));
    return feed;
};

export const reactToFeedItem = async (feedItemId: string, emoji: ReactionEmoji): Promise<FeedItem | null> => {
    const itemRef = doc(db, 'feedItems', feedItemId);
    await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) {
            throw "Document does not exist!";
        }
        const item = fromSnap<FeedItem>(itemDoc);
        const reaction = item.reactions.find(r => r.emoji === emoji);
        if (reaction) {
            reaction.count++;
        }
        transaction.update(itemRef, { reactions: item.reactions });
    });
    const updatedItemSnap = await getDoc(itemRef);
    return fromSnap<FeedItem>(updatedItemSnap);
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

  return {
    attacker_power: parseFloat(A_power.toFixed(2)),
    defender_power: parseFloat(D_power.toFixed(2)),
    win_prob: parseFloat(win_prob.toFixed(2)),
    stamina_cost,
  };
};

export const performHack = async (attacker: Profile, defender: Profile): Promise<HackResult> => {
  const emulation = await emulateHack(attacker, defender);
  const u = Math.random();
  const win = u <= emulation.win_prob;

  let loot = { creds: 0, xp: 0 };
  let attacker_xp_gain = 0;
  let defender_xp_gain = 0;

  try {
    await runTransaction(db, async (transaction) => {
        const attackerRef = doc(db, 'players', attacker.id);
        const defenderRef = doc(db, 'players', defender.id);

        const attackerDoc = await transaction.get(attackerRef);
        const defenderDoc = await transaction.get(defenderRef);

        if (!attackerDoc.exists() || !defenderDoc.exists()) {
            throw "Attacker or Defender not found!";
        }
        
        const mutableAttacker = fromSnap<Profile>(attackerDoc);
        const mutableDefender = fromSnap<Profile>(defenderDoc);

        transaction.update(attackerRef, { stamina: Math.max(0, mutableAttacker.stamina - emulation.stamina_cost) });

        if (win) {
            const base_loot_creds = Math.floor(Math.min(mutableDefender.creds * 0.05, 200 + 5 * mutableAttacker.hacking_skill));
            const loot_multiplier = 1 + (Math.random() - 0.5) * 0.2;
            loot.creds = Math.floor(Math.max(0, base_loot_creds * loot_multiplier));
            attacker_xp_gain = Math.floor(10 + (emulation.attacker_power / emulation.defender_power) * 5);
            loot.xp = attacker_xp_gain;
            
            transaction.update(attackerRef, {
                creds: mutableAttacker.creds + loot.creds,
                xp: mutableAttacker.xp + loot.xp
            });
            transaction.update(defenderRef, {
                creds: Math.max(0, mutableDefender.creds - loot.creds)
            });
        } else {
            defender_xp_gain = Math.floor(5 + 2);
            transaction.update(defenderRef, { xp: mutableDefender.xp + defender_xp_gain });
        }
    });

    const feedText = win
        ? `<strong>${attacker.display_name}</strong> just schooled <strong>${defender.display_name}</strong> and made off with <strong>$${loot.creds.toLocaleString()} creds!</strong>`
        : `<strong>${attacker.display_name}</strong>'s hack attempt on <strong>${defender.display_name}</strong> was a total fail! LOL.`;
    
    await addFeedItem(feedText, 'hack_result');

  } catch (e) {
      console.error("Hack transaction failed: ", e);
      return { win: false, loot: { creds: 0, xp: 0 }, attacker_xp_gain: 0, defender_xp_gain: 0, stamina_cost: emulation.stamina_cost };
  }
  
  return { win, loot, attacker_xp_gain, defender_xp_gain, stamina_cost: emulation.stamina_cost };
};

// --- Shop & Inventory Service ---
export const buyItem = async (user: Profile, item: ShopItem): Promise<{success: boolean, message: string, updatedUser: Profile | null}> => {
  try {
    await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'players', user.id);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists() || userDoc.data().creds < item.price_creds) {
            throw "Not enough creds!";
        }
        
        transaction.update(userRef, { creds: userDoc.data().creds - item.price_creds });

        if (item.payload.effect === 'stamina_refill') {
             const currentStamina = userDoc.data().stamina;
             const maxStamina = userDoc.data().stamina_max;
             transaction.update(userRef, { stamina: Math.min(maxStamina, currentStamina + item.payload.value) });
        } else {
            const inventoryRef = collection(db, 'inventory');
            const q = query(inventoryRef, where('user_id', '==', user.id), where('item_id', '==', item.id));
            const snapshot = await getDocs(q); // Note: getDocs inside transaction is not recommended, but query is complex.
            
            if (!snapshot.empty) {
                const existingItemDoc = snapshot.docs[0];
                transaction.update(existingItemDoc.ref, { qty: existingItemDoc.data().qty + 1 });
            } else {
                 // Firestore transactions require all reads before writes.
                 // This pattern is tricky. A better way would be a subcollection on the user.
                 // For now, we add a new doc outside the transaction after it succeeds, which is not ideal.
                 // The addDoc will be done after the transaction for simplicity here.
            }
        }
    });
    
    // Handle adding new item if it's not a consumable
    if (item.payload.effect !== 'stamina_refill') {
        const inventoryRef = collection(db, 'inventory');
        const q = query(inventoryRef, where('user_id', '==', user.id), where('item_id', '==', item.id));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            await addDoc(inventoryRef, {
                user_id: user.id,
                item_id: item.id,
                qty: 1,
                activated: false
            });
        }
    }

    const updatedUser = await getPlayerById(user.id);
    return { success: true, message: `Purchased ${item.title}!`, updatedUser };
  } catch (e: any) {
    return { success: false, message: e.toString(), updatedUser: null };
  }
}

export const activateItem = async (user: Profile, inventoryId: string): Promise<{success: boolean, message: string, updatedUser: Profile | null}> => {
    const itemRef = doc(db, 'inventory', inventoryId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists() || itemSnap.data().user_id !== user.id) {
        return { success: false, message: "Item not found!", updatedUser: user };
    }
    
    const item = fromSnap<InventoryItem>(itemSnap);
    if(item.activated) return { success: false, message: "Item already active!", updatedUser: user };

    const itemDetails = (await getDoc(doc(db, 'shopItems', item.item_id))).data() as ShopItem;
    item.itemDetails = itemDetails;

    // Handle permanent boosts
    if (item.itemDetails.item_type === 'permanent_boost') {
        try {
            await runTransaction(db, async (transaction) => {
                const playerRef = doc(db, 'players', user.id);
                const invItemRef = doc(db, 'inventory', inventoryId);
                const playerDoc = await transaction.get(playerRef);
                if (!playerDoc.exists()) throw "Player not found";

                let updateData = {};
                if (item.itemDetails.payload.effect === 'perm_hack_skill') {
                    updateData = { hacking_skill: playerDoc.data().hacking_skill + item.itemDetails.payload.value };
                } else if (item.itemDetails.payload.effect === 'perm_security_level') {
                    updateData = { security_level: playerDoc.data().security_level + item.itemDetails.payload.value };
                }
                transaction.update(playerRef, updateData);

                // Consume item
                if (item.qty > 1) {
                    transaction.update(invItemRef, { qty: item.qty - 1 });
                } else {
                    transaction.delete(invItemRef);
                }
            });
             await addFeedItem(`<strong>${user.display_name}</strong> permanently upgraded their mainframe with a <strong>${item.itemDetails.title}</strong>!`, 'permanent_upgrade');
             const updatedUser = await getPlayerById(user.id);
             return { success: true, message: `Used ${item.itemDetails.title} for a permanent boost!`, updatedUser };
        } catch (e) {
            console.error("Permanent boost failed:", e);
            return { success: false, message: "Failed to apply boost.", updatedUser: user };
        }
    }


    if (item.itemDetails?.item_type === 'consumable') {
        if(item.qty > 1) {
            await updateDoc(itemRef, { qty: item.qty - 1 });
        } else {
            await deleteDoc(itemRef);
        }
    } else {
        await updateDoc(itemRef, { activated: true });
    }
    
    const message = item.itemDetails?.item_type === 'consumable' ? `${item.itemDetails.title} consumed!` : `${item.itemDetails.title} activated!`;
    
    if (item.itemDetails && item.itemDetails.tier > 1) {
        await addFeedItem(`<strong>${user.display_name}</strong> just activated a <strong>${item.itemDetails.title}</strong>!`, 'item_activation');
    }
    
    return { success: true, message, updatedUser: user };
};

// --- Task Service Functions ---
export const getTasks = async (userId: string): Promise<UserTask[]> => {
    const tasksRef = collection(db, 'userTasks');
    const q = query(tasksRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);
    const tasks: UserTask[] = [];
    querySnapshot.forEach(doc => tasks.push(fromSnap<UserTask>(doc)));
    
    const templateIds = [...new Set(tasks.map(t => t.task_template_id))];
    if (templateIds.length > 0) {
        const templatesRef = collection(db, 'taskTemplates');
        const templatesQuery = query(templatesRef, where(documentId(), 'in', templateIds.slice(0, 30)));
        const templatesSnapshot = await getDocs(templatesQuery);
        const templatesMap = new Map<string, TaskTemplate>();
        templatesSnapshot.forEach(doc => templatesMap.set(doc.id, fromSnap<TaskTemplate>(doc)));

        tasks.forEach(task => {
            if (templatesMap.has(task.task_template_id)) {
                task.template = templatesMap.get(task.task_template_id)!;
            }
        });
    }

    return tasks;
};

export const acceptTask = async (userTaskId: string): Promise<{success: boolean, updatedTask: UserTask | null}> => {
    const taskRef = doc(db, 'userTasks', userTaskId);
    await updateDoc(taskRef, { status: 'in_progress' });
    const taskSnap = await getDoc(taskRef);
    const updatedTask = fromSnap<UserTask>(taskSnap);

    // Re-fetch template to return the full object
    const templateSnap = await getDoc(doc(db, 'taskTemplates', updatedTask.task_template_id));
    if (templateSnap.exists()) {
        updatedTask.template = fromSnap<TaskTemplate>(templateSnap);
    }

    return { success: true, updatedTask };
};

export const claimTaskReward = async (userTaskId: string, userId: string): Promise<{success: boolean, updatedTask: UserTask | null, reward: {creds: number, xp: number} | null}> => {
    let reward: {creds: number, xp: number} | null = null;
    try {
        await runTransaction(db, async (transaction) => {
            const taskRef = doc(db, 'userTasks', userTaskId);
            const userRef = doc(db, 'players', userId);
            
            const taskDoc = await transaction.get(taskRef);
            const userDoc = await transaction.get(userRef);

            if (!taskDoc.exists() || !userDoc.exists() || taskDoc.data().status !== 'completed') {
                throw "Task not ready to be claimed.";
            }
            
            const templateRef = doc(db, 'taskTemplates', taskDoc.data().task_template_id);
            const templateDoc = await transaction.get(templateRef);
            if (!templateDoc.exists()) {
                throw "Task template not found.";
            }
            const template = templateDoc.data();
            
            reward = {
                creds: template.reward_creds,
                xp: template.reward_xp,
            };

            transaction.update(taskRef, { status: 'claimed' });
            transaction.update(userRef, {
                creds: userDoc.data().creds + reward.creds,
                xp: userDoc.data().xp + reward.xp,
            });
        });

        const taskSnap = await getDoc(doc(db, 'userTasks', userTaskId));
        const updatedTask = fromSnap<UserTask>(taskSnap);

        // Re-fetch template to return the full object
        const finalTemplateSnap = await getDoc(doc(db, 'taskTemplates', updatedTask.task_template_id));
        if (finalTemplateSnap.exists()) {
            updatedTask.template = fromSnap<TaskTemplate>(finalTemplateSnap);
        }

        return { success: true, updatedTask, reward };
    } catch (e) {
        console.error("Claim reward failed:", e);
        return { success: false, updatedTask: null, reward: null };
    }
};

// --- Quiz Service Functions ---
export const getSubjects = async (): Promise<string[]> => {
  return [...mockSubjects];
};

export const getQuestions = async (subject: string): Promise<Question[]> => {
    const qRef = collection(db, 'questions');
    const q = query(qRef, where('subject', '==', subject));
    const snap = await getDocs(q);
    const questions: Question[] = [];
    snap.forEach(doc => questions.push(fromSnap<Question>(doc)));
    return questions;
};

export const submitAnswer = async (question: Question, answer: string, userId: string): Promise<{correct: boolean, reward: {creds: number, xp: number}}> => {
    const userRef = doc(db, 'players', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        return { correct: false, reward: { creds: 0, xp: 0 } };
    }
    const correct = question.correct_answer === answer;
    const reward = correct ? { creds: 20, xp: 10 } : { creds: -5, xp: 0 };
    
    await updateDoc(userRef, {
        creds: userSnap.data().creds + reward.creds,
        xp: userSnap.data().xp + reward.xp
    });
  
    return { correct, reward };
};

export const getAllQuestions = async(): Promise<Question[]> => {
    const qRef = collection(db, 'questions');
    const snap = await getDocs(qRef);
    const questions: Question[] = [];
    snap.forEach(doc => questions.push(fromSnap<Question>(doc)));
    return questions;
}

export const saveQuestion = async(questionData: Omit<Question, 'id' | 'correct_answer'> & {id?: string, correct_choice_index: number}): Promise<Question> => {
    const { id, correct_choice_index, ...data } = questionData;
    const dataToSave: Omit<Question, 'id'> = {
        ...data,
        correct_answer: data.choices[correct_choice_index],
    };

    if (id) {
        const qRef = doc(db, 'questions', id);
        await updateDoc(qRef, dataToSave);
        const snap = await getDoc(qRef);
        return fromSnap<Question>(snap);
    }
    const docRef = await addDoc(collection(db, 'questions'), dataToSave);
    const snap = await getDoc(docRef);
    return fromSnap<Question>(snap);
}

export const deleteQuestion = async(questionId: string): Promise<{success: boolean}> => {
    const qRef = doc(db, 'questions', questionId);
    await deleteDoc(qRef);
    return { success: true };
}

export const uploadQuestionsFromCSV = async (csvContent: string): Promise<{success: boolean, count: number}> => {
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    const batch = writeBatch(db);
    const questionsRef = collection(db, 'questions');
    let count = 0;

    lines.forEach(line => {
        const [prompt, correct_answer, choice2, choice3, choice4, subject] = line.split(',').map(s => s.trim());
        if (prompt && correct_answer && choice2 && choice3 && choice4 && subject) {
            const newQuestion: Omit<Question, 'id'> = {
                prompt,
                choices: [correct_answer, choice2, choice3, choice4],
                correct_answer,
                subject,
            };
            const docRef = doc(questionsRef);
            batch.set(docRef, newQuestion);
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        return { success: true, count };
    }

    return { success: false, count: 0 };
};

// --- ADMIN FUNCTIONS ---
export const addPlayer = async(playerData: Omit<Profile, 'id' | 'avatar_url' | 'last_online_at' | 'badges'>): Promise<Profile> => {
    const newPlayer: Omit<Profile, 'id'> = {
        ...playerData,
        avatar_url: `https://picsum.photos/seed/${Date.now()}/200`,
        last_online_at: new Date().toISOString(),
        badges: [],
        role: 'player',
    };
    const docRef = await addDoc(collection(db, 'players'), newPlayer);
    const snap = await getDoc(docRef);
    return fromSnap<Profile>(snap);
};

export const deletePlayer = async(playerId: string): Promise<{success: boolean}> => {
    await deleteDoc(doc(db, 'players', playerId));
    return { success: true };
};

export const addCreds = async(playerId: string, amount: number): Promise<Profile | null> => {
    const playerRef = doc(db, 'players', playerId);
    await runTransaction(db, async transaction => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) throw "Player not found";
        const newCreds = playerDoc.data().creds + amount;
        transaction.update(playerRef, { creds: newCreds });
    });
    return getPlayerById(playerId);
}

export const addXp = async(playerId: string, amount: number): Promise<Profile | null> => {
    const playerRef = doc(db, 'players', playerId);
     await runTransaction(db, async transaction => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) throw "Player not found";
        const currentXp = playerDoc.data().xp;
        const currentLevel = playerDoc.data().level;
        const newXp = currentXp + amount;
        
        const xpForNextLevel = Math.floor(100 * Math.pow(currentLevel + 1, 1.6));
        let newLevel = currentLevel;
        if (newXp >= xpForNextLevel) {
            newLevel += 1; // Simple level up, can be improved to handle multiple level ups
        }

        transaction.update(playerRef, { xp: newXp, level: newLevel });
    });
    return getPlayerById(playerId);
}

export const giveItem = async(playerId: string, itemId: string): Promise<InventoryItem | null> => {
    const itemDetailsSnap = await getDoc(doc(db, 'shopItems', itemId));
    if (!itemDetailsSnap.exists()) return null;

    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('user_id', '==', playerId), where('item_id', '==', itemId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const existingItemRef = snapshot.docs[0].ref;
        const currentQty = snapshot.docs[0].data().qty;
        await updateDoc(existingItemRef, { qty: currentQty + 1 });
        const updatedSnap = await getDoc(existingItemRef);
        return fromSnap<InventoryItem>(updatedSnap);
    } else {
        const newInvItem = {
            user_id: playerId,
            item_id: itemId,
            qty: 1,
            activated: false,
        };
        const docRef = await addDoc(inventoryRef, newInvItem);
        const snap = await getDoc(docRef);
        return fromSnap<InventoryItem>(snap);
    }
}

export const addBadge = async(playerId: string, badge: string): Promise<Profile | null> => {
    const playerRef = doc(db, 'players', playerId);
    await runTransaction(db, async transaction => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) throw "Player not found";
        const badges = playerDoc.data().badges || [];
        if (!badges.includes(badge)) {
            transaction.update(playerRef, { badges: [...badges, badge] });
        }
    });
    return getPlayerById(playerId);
}