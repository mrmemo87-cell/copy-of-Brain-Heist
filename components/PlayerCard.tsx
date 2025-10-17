import React, { useState } from 'react';
import { Profile, HackEmulationResult } from '../types';
import NeonCard from './NeonCard';
import { emulateHack } from '../services/gameService';

interface PlayerCardProps {
  attacker: Profile;
  player: Profile; // This is the defender
  onHack: (player: Profile) => void;
  onViewProfile: (player: Profile) => void;
  isCurrentUser?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ attacker, player, onHack, onViewProfile, isCurrentUser = false }) => {
    
  const [isProbing, setIsProbing] = useState(false);
  const [emulation, setEmulation] = useState<HackEmulationResult | null>(null);

  const getStatusColor = () => {
    const lastSeen = new Date(player.last_online_at).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    if (diffMinutes < 5) return 'bg-green-400';
    if (diffMinutes < 30) return 'bg-yellow-400';
    return 'bg-red-500';
  };
  
  const handleProbe = async () => {
    setIsProbing(true);
    const emuResult = await emulateHack(attacker, player);
    setEmulation(emuResult);
    setIsProbing(false);
  };

  const handleCancel = () => {
    setEmulation(null);
  };

  return (
    <NeonCard accent="purple" className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative cursor-pointer" onClick={() => onViewProfile(player)}>
            <img src={player.avatar_url} alt={player.username} className="w-16 h-16 rounded-full border-2 border-cyan-400/50" />
            <span className={`absolute bottom-0 right-0 block h-4 w-4 rounded-full ${getStatusColor()} border-2 border-gray-800`}></span>
        </div>
        <div className="cursor-pointer" onClick={() => onViewProfile(player)}>
          <h3 className="font-orbitron text-lg font-bold text-white neon-glow-cyan">{player.display_name}</h3>
          <p className="text-sm text-gray-400">@{player.username}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-400">Level</span>
          <span className="font-bold text-lg text-lime-400">{player.level}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400">Creds</span>
          <span className="font-bold text-lg text-yellow-400">{player.creds.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400">Hacking Skill</span>
          <span className="font-bold text-lg text-pink-400">{player.hacking_skill}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400">Security</span>
          <span className="font-bold text-lg text-cyan-400">{player.security_level}</span>
        </div>
      </div>
       {player.badges && player.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {player.badges.map(badge => (
            <span key={badge} className="text-xs font-semibold bg-gray-700 text-cyan-300 px-2 py-1 rounded-full">
              {badge.replace(/_/g, ' ').toUpperCase()}
            </span>
          ))}
        </div>
      )}
      {!isCurrentUser && !emulation && (
        <button
          onClick={handleProbe}
          disabled={isProbing}
          className="btn-neon w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-cyan-500/50"
        >
          {isProbing ? 'PROBING...' : 'PROBE DEFENSES'}
        </button>
      )}
      {emulation && (
        <div className="bg-black/30 p-3 rounded-lg space-y-3">
            <div className="text-center">
                <p className="text-xs uppercase">Success Chance</p>
                <p className="font-orbitron text-2xl font-bold text-lime-400">{Math.round(emulation.win_prob * 100)}%</p>
            </div>
            <p className="text-center text-xs text-yellow-400">Cost: {emulation.stamina_cost} Stamina</p>
            <div className="flex gap-2">
                <button onClick={handleCancel} className="btn-neon w-full bg-gray-600 text-white font-bold py-2 rounded text-sm">CHICKEN OUT</button>
                <button onClick={() => onHack(player)} className="btn-neon w-full bg-gradient-to-r from-pink-500 to-red-600 text-white font-bold py-2 rounded text-sm">INITIATE HACK</button>
            </div>
        </div>
      )}
    </NeonCard>
  );
};

export default PlayerCard;
