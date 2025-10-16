
import React, { useState, useEffect, useCallback } from 'react';
import { Profile, ShopItem, InventoryItem, HackResult } from './types';
import * as GameService from './services/gameService';
import PlayerCard from './components/PlayerCard';
import HackModal from './components/HackModal';
import RadialGauge from './components/RadialGauge';

type View = 'home' | 'shop' | 'inventory' | 'leaderboard';

const ShopView: React.FC<{user: Profile, onPurchase: (item: ShopItem) => void}> = ({ user, onPurchase }) => {
    const [items, setItems] = useState<ShopItem[]>([]);
    useEffect(() => {
        GameService.getShopItems().then(setItems);
    }, []);

    return <div className="p-4">
        <h2 className="font-orbitron text-3xl mb-6 neon-glow-cyan">Shop</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
                <div key={item.id} className="neon-border accent-pink rounded-lg p-4 flex flex-col">
                    <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover rounded-md mb-4"/>
                    <h3 className="font-orbitron font-bold">{item.title}</h3>
                    <p className="text-sm text-gray-400 flex-grow">{item.description}</p>
                    <div className="flex justify-between items-center mt-4">
                        <span className="font-bold text-yellow-400">{item.price_coins.toLocaleString()} Coins</span>
                        <button onClick={() => onPurchase(item)} disabled={user.coins < item.price_coins} className="btn-neon bg-pink-600 px-4 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Buy</button>
                    </div>
                </div>
            ))}
        </div>
    </div>;
}

const InventoryView: React.FC<{}> = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    useEffect(() => {
        GameService.getInventory().then(setItems);
    }, []);

    return <div className="p-4">
        <h2 className="font-orbitron text-3xl mb-6 neon-glow-lime">Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {items.map(item => (
                <div key={item.id} className="neon-border accent-lime rounded-lg p-4 flex flex-col text-center">
                    <img src={item.itemDetails?.image_url} alt={item.itemDetails?.title} className="w-24 h-24 object-cover rounded-md mb-4 mx-auto"/>
                    <h3 className="font-orbitron font-bold">{item.itemDetails?.title}</h3>
                    <p className="text-4xl font-bold mt-2">x{item.qty}</p>
                    <button className="btn-neon bg-lime-600 px-4 py-1 rounded mt-4">Activate</button>
                </div>
            ))}
        </div>
    </div>;
}


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [hackingTarget, setHackingTarget] = useState<Profile | null>(null);
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    GameService.getCurrentUser().then(setCurrentUser);
    GameService.getPlayers().then(setPlayers);
  }, []);

  const handleHack = (player: Profile) => {
    setHackingTarget(player);
  };

  const handleCloseModal = () => {
    setHackingTarget(null);
  };

  const handleHackComplete = useCallback((result: HackResult, defender: Profile) => {
    setCurrentUser(prev => {
        if (!prev) return null;
        const newUser = { ...prev };
        newUser.stamina -= result.stamina_cost;
        if (result.win) {
            newUser.coins += result.loot.coins;
            newUser.xp += result.loot.xp;
        }
        return newUser;
    });

    setPlayers(prev => prev.map(p => {
        if (p.id === defender.id) {
            const newDefender = { ...p };
            if(result.win) {
                newDefender.coins -= result.loot.coins;
            } else {
                newDefender.xp += result.defender_xp_gain;
            }
            return newDefender;
        }
        return p;
    }));
  }, []);

  const handlePurchase = async (item: ShopItem) => {
      if(!currentUser) return;
      const res = await GameService.buyItem(currentUser, item);
      if(res.success) {
        alert(res.message);
        setCurrentUser(prev => prev ? {...prev, coins: prev.coins - item.price_coins} : null);
      } else {
        alert(res.message);
      }
  }

  if (!currentUser) {
    return (
        <div className="h-screen w-full flex items-center justify-center">
            <p className="font-orbitron text-2xl animate-pulse text-cyan-400">Loading Mainframe...</p>
        </div>
    );
  }

  const renderView = () => {
      switch(view) {
          case 'shop':
              return <ShopView user={currentUser} onPurchase={handlePurchase} />;
          case 'inventory':
              return <InventoryView />;
          case 'home':
          default:
            return (
                <div className="p-4">
                    <h2 className="font-orbitron text-3xl mb-6 neon-glow-cyan">Targets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {players.map(player => (
                        <PlayerCard key={player.id} player={player} onHack={handleHack} />
                    ))}
                    </div>
                </div>
            );
      }
  }

  return (
    <>
      <div className="hacker-bg"></div>
      <div className="min-h-screen text-white relative z-10">
        <header className="p-4 border-b border-cyan-400/20 flex justify-between items-center sticky top-0 bg-black/50 backdrop-blur-md">
          <h1 className="font-orbitron text-2xl font-black neon-glow-cyan tracking-widest">BRAIN HEIST</h1>
          <div className="flex items-center space-x-4">
            <div className="text-right">
                <p className="font-bold">{currentUser.display_name}</p>
                <p className="text-sm text-yellow-400">{currentUser.coins.toLocaleString()} Coins</p>
            </div>
            <RadialGauge value={currentUser.stamina} max={currentUser.stamina_max} size={60} strokeWidth={5} label="Stamina" />
          </div>
        </header>
        
        <nav className="flex justify-center space-x-4 p-4 bg-black/30">
            <button onClick={() => setView('home')} className={`font-orbitron px-4 py-2 rounded ${view === 'home' ? 'bg-cyan-500 text-black' : 'hover:bg-cyan-500/20'}`}>Home</button>
            <button onClick={() => setView('shop')} className={`font-orbitron px-4 py-2 rounded ${view === 'shop' ? 'bg-cyan-500 text-black' : 'hover:bg-cyan-500/20'}`}>Shop</button>
            <button onClick={() => setView('inventory')} className={`font-orbitron px-4 py-2 rounded ${view === 'inventory' ? 'bg-cyan-500 text-black' : 'hover:bg-cyan-500/20'}`}>Inventory</button>
        </nav>

        <main className="container mx-auto">
          {renderView()}
        </main>

        {hackingTarget && (
          <HackModal
            attacker={currentUser}
            defender={hackingTarget}
            onClose={handleCloseModal}
            onHackComplete={handleHackComplete}
          />
        )}
      </div>
    </>
  );
};

export default App;
