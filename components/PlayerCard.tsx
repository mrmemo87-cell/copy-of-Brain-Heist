
import React from 'react';
import { Profile } from '../types';
import NeonCard from './NeonCard';

interface PlayerCardProps {
  player: Profile;
  onHack: (player: Profile) => void;
  isCurrentUser?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onHack, isCurrentUser = false }) => {
    
  const getStatusColor = () => {
    const lastSeen = new Date(player.last_online_at).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    if (diffMinutes < 5) return 'bg-green-400';
    if (diffMinutes < 30) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  return (
    <NeonCard accent="purple" className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
            <img src={player.avatar_url} alt={player.username} className="w-16 h-16 rounded-full border-2 border-cyan-400/50" />
            <span className={`absolute bottom-0 right-0 block h-4 w-4 rounded-full ${getStatusColor()} border-2 border-gray-800`}></span>
        </div>
        <div>
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
          <span className="text-gray-400">Coins</span>
          <span className="font-bold text-lg text-yellow-400">{player.coins.toLocaleString()}</span>
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
      {!isCurrentUser && (
        <button
          onClick={() => onHack(player)}
          className="btn-neon w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-pink-500/50"
        >
          HACK
        </button>
      )}
    </NeonCard>
  );
};

export default PlayerCard;
