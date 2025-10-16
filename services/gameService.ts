
import { Profile, HackEmulationResult, HackResult, ShopItem, InventoryItem } from '../types';
import { mockCurrentUser, mockPlayers, mockShopItems, mockInventory } from './mockData';

const SIMULATED_DELAY = 500;

// Helper to simulate network delay
const delay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), SIMULATED_DELAY));

export const getCurrentUser = async (): Promise<Profile> => {
  return delay(JSON.parse(JSON.stringify(mockCurrentUser)));
};

export const getPlayers = async (): Promise<Profile[]> => {
  return delay(JSON.parse(JSON.stringify(mockPlayers)));
};

export const getShopItems = async (): Promise<ShopItem[]> => {
  return delay(JSON.parse(JSON.stringify(mockShopItems)));
}

export const getInventory = async (): Promise<InventoryItem[]> => {
  return delay(JSON.parse(JSON.stringify(mockInventory)));
}


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

  let loot = { coins: 0, xp: 0 };
  let attacker_xp_gain = 0;
  let defender_xp_gain = 0;

  if (win) {
    const base_loot_coins = Math.floor(Math.min(defender.coins * 0.05, 200 + 5 * attacker.hacking_skill));
    const loot_multiplier = 1 + (Math.random() - 0.5) * 0.2;
    loot.coins = Math.floor(base_loot_coins * loot_multiplier);
    attacker_xp_gain = Math.floor(10 + (emulation.attacker_power / emulation.defender_power) * 5);
    loot.xp = attacker_xp_gain;
  } else {
    defender_xp_gain = Math.floor(5 + 2);
  }

  return delay({
    win,
    loot,
    attacker_xp_gain,
    defender_xp_gain,
    stamina_cost: emulation.stamina_cost,
  });
};

export const buyItem = async (user: Profile, item: ShopItem): Promise<{success: boolean, message: string}> => {
  if (user.coins < item.price_coins) {
    return delay({ success: false, message: "Not enough coins!" });
  }
  // In a real app, this would update the backend
  user.coins -= item.price_coins;
  const existingItem = mockInventory.find(i => i.item_id === item.id);
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
  return delay({ success: true, message: `Purchased ${item.title}!` });
}
