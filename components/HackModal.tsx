
import React, { useState, useEffect } from 'react';
import { Profile, HackEmulationResult, HackResult } from '../types';
import { emulateHack, performHack } from '../services/gameService';
import NeonCard from './NeonCard';
import RadialGauge from './RadialGauge';

interface HackModalProps {
  attacker: Profile;
  defender: Profile;
  onClose: () => void;
  onHackComplete: (result: HackResult, defender: Profile) => void;
}

type HackStage = 'emulating' | 'ready' | 'hacking' | 'result';

const HackModal: React.FC<HackModalProps> = ({ attacker, defender, onClose, onHackComplete }) => {
  const [stage, setStage] = useState<HackStage>('emulating');
  const [emulation, setEmulation] = useState<HackEmulationResult | null>(null);
  const [result, setResult] = useState<HackResult | null>(null);

  useEffect(() => {
    const runEmulation = async () => {
      const emuResult = await emulateHack(attacker, defender);
      setEmulation(emuResult);
      setStage('ready');
    };
    runEmulation();
  }, [attacker, defender]);

  const handleConfirmHack = async () => {
    if (!emulation) return;
    if (attacker.stamina < emulation.stamina_cost) {
        alert("Not enough stamina!");
        return;
    }
    setStage('hacking');
    const hackResult = await performHack(attacker, defender);
    setResult(hackResult);
    onHackComplete(hackResult, defender);
    setStage('result');
  };

  const renderContent = () => {
    switch (stage) {
      case 'emulating':
        return <div className="text-center p-8">
            <p className="font-orbitron text-lg animate-pulse text-cyan-400">Analyzing Defenses...</p>
        </div>;

      case 'ready':
        return (
          emulation && (
            <div className="flex flex-col items-center space-y-6 p-6">
              <h2 className="font-orbitron text-2xl font-bold neon-glow-pink">Hack Preview</h2>
              <RadialGauge
                value={emulation.win_prob * 100}
                max={100}
                size={150}
                strokeWidth={12}
                label="Win Chance %"
                colorFrom="#FF2D91"
                colorTo="#A6FF4D"
              />
              <div className="text-center text-sm">
                <p>Attacker Power: <span className="text-lime-400 font-bold">{emulation.attacker_power}</span></p>
                <p>Defender Power: <span className="text-pink-400 font-bold">{emulation.defender_power}</span></p>
                <p>Stamina Cost: <span className="text-yellow-400 font-bold">{emulation.stamina_cost}</span></p>
              </div>
              <button onClick={handleConfirmHack} className="btn-neon w-full bg-gradient-to-r from-lime-500 to-cyan-500 text-black font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-lime-500/50 text-xl">
                INITIATE HACK
              </button>
            </div>
          )
        );

      case 'hacking':
         return <div className="text-center p-8">
            <p className="font-orbitron text-lg animate-pulse text-red-500">BREACHING FIREWALL...</p>
        </div>;

      case 'result':
        return (
            result && (
                <div className={`text-center p-6 space-y-4 ${result.win ? 'text-lime-400' : 'text-red-500'}`}>
                    <h2 className={`font-orbitron text-4xl font-black ${result.win ? 'neon-glow-lime' : 'neon-glow-pink'}`}>
                        {result.win ? 'SUCCESS' : 'FAILURE'}
                    </h2>
                    {result.win ? (
                        <div>
                            <p>Looted <span className="font-bold">{result.loot.coins.toLocaleString()} Coins</span></p>
                            <p>Gained <span className="font-bold">{result.loot.xp} XP</span></p>
                        </div>
                    ) : (
                        <p>Firewall held. No loot gained.</p>
                    )}
                     <p className="text-sm text-gray-400">Stamina Used: {result.stamina_cost}</p>
                    <button onClick={onClose} className="btn-neon w-full bg-gray-600 text-white font-bold py-2 mt-4 rounded-lg">
                        Close
                    </button>
                </div>
            )
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
        <NeonCard accent={result?.win ? 'lime' : 'pink'} className="w-full max-w-sm">
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white">&times;</button>
          {renderContent()}
        </NeonCard>
    </div>
  );
};

export default HackModal;
