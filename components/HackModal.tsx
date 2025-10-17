import React, { useState, useEffect, useRef } from 'react';
import { Profile, HackEmulationResult, HackResult } from '../types';
import { emulateHack, performHack, playSound } from '../services/gameService';
import NeonCard from './NeonCard';
import RadialGauge from './RadialGauge';

interface HackModalProps {
  attacker: Profile;
  defender: Profile;
  onClose: () => void;
  onHackComplete: (result: HackResult, defender: Profile) => void;
}

type HackStage = 'emulating' | 'ready' | 'breaching' | 'hacking' | 'result';

const HACK_TERMINAL_LINES = [
    'Initiating connection to target...',
    'Scanning for open ports... 22, 80, 443...',
    'Firewall detected. Deploying ICE Breaker v2.1...',
    'Bypassing intrusion detection systems...',
    'Accessing root directory... SUCCESS.',
    'Downloading target data...',
    'Covering tracks... deleting logs...',
    'BREACH COMPLETE.',
];

const HackModal: React.FC<HackModalProps> = ({ attacker, defender, onClose, onHackComplete }) => {
  const [stage, setStage] = useState<HackStage>('emulating');
  const [emulation, setEmulation] = useState<HackEmulationResult | null>(null);
  const [result, setResult] = useState<HackResult | null>(null);
  const [terminalText, setTerminalText] = useState<string[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const runEmulation = async () => {
      const emuResult = await emulateHack(attacker, defender);
      setEmulation(emuResult);
      setStage('ready');
    };
    runEmulation();

    return () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };
  }, [attacker, defender]);
  
  const startBreachSequence = () => {
    setStage('breaching');
    playSound('glitch');
    setTerminalText([]);
    let lineIndex = 0;
    intervalRef.current = window.setInterval(() => {
        setTerminalText(prev => [...prev, HACK_TERMINAL_LINES[lineIndex]]);
        lineIndex++;
        if (lineIndex >= HACK_TERMINAL_LINES.length) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            handleConfirmHack();
        }
    }, 600);
  };


  const handleConfirmHack = async () => {
    if (!emulation) return;
    if (attacker.stamina < emulation.stamina_cost) {
        alert("Whoa there, hacker! Your brain is fried. Refill your stamina or take a nap before you short-circuit.");
        onClose();
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
            <p className="font-orbitron text-lg animate-pulse text-cyan-400">ANALYZING DEFENSES...</p>
        </div>;
      
      case 'breaching':
        return <div className="p-6 bg-black rounded-lg">
            <p className="font-orbitron text-lg mb-4 text-red-500 animate-text-glitch">!! BREACHING FIREWALL !!</p>
            <div className="font-mono text-sm text-lime-400 h-48 overflow-hidden">
                {terminalText.map((line, i) => <p key={i} className="whitespace-nowrap overflow-hidden animate-typing">{`> ${line}`}</p>)}
            </div>
        </div>

      case 'ready':
        return (
          emulation && (
            <div className="flex flex-col items-center space-y-6 p-6">
              <h2 className="font-orbitron text-2xl font-bold neon-glow-pink text-center">PREPARING ASSAULT ON <br/> <span className="text-cyan-400">{defender.display_name}</span></h2>
              <RadialGauge
                value={emulation.win_prob * 100}
                max={100}
                size={150}
                strokeWidth={12}
                label="Success Chance %"
                colorFrom="#FF2D91"
                colorTo="#A6FF4D"
              />
              <div className="text-center text-sm">
                <p>Your Power: <span className="text-lime-400 font-bold">{emulation.attacker_power}</span></p>
                <p>Their Security: <span className="text-pink-400 font-bold">{emulation.defender_power}</span></p>
                <p className="text-yellow-400 font-bold">Cost: {emulation.stamina_cost} Stamina</p>
              </div>
              <button onClick={startBreachSequence} className="btn-neon w-full bg-gradient-to-r from-lime-500 to-cyan-500 text-black font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-lime-500/50 text-xl">
                UNLEASH THE CHAOS
              </button>
            </div>
          )
        );

      case 'hacking':
         return <div className="text-center p-8">
            <p className="font-orbitron text-2xl animate-pulse text-red-500 animate-text-glitch">HACK IN PROGRESS...</p>
        </div>;

      case 'result':
        return (
            result && (
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {result.win ? (
                            <div className="w-24 h-24 bg-lime-500/50 rounded-full animate-glow-pulse"></div>
                        ) : (
                            <div className="w-full h-full bg-pink-500 animate-red-flash"></div>
                        )}
                    </div>
                    <div className={`relative z-10 text-center p-6 space-y-4 ${result.win ? 'text-lime-400' : 'text-red-500'}`}>
                        <h2 className={`font-orbitron text-5xl font-black ${result.win ? 'neon-glow-lime' : 'neon-glow-pink'}`}>
                            {result.win ? 'PWNED!' : 'ACCESS DENIED'}
                        </h2>
                        {result.win ? (
                            <div>
                                <p className="text-lg">You looted <span className="font-bold text-yellow-300">{result.loot.creds.toLocaleString()} Creds!</span></p>
                                <p className="text-lg">You gained <span className="font-bold">{result.loot.xp} XP!</span></p>
                            </div>
                        ) : (
                            <p className="text-lg">Their firewall was too strong! You got nothing but digital dust.</p>
                        )}
                        <p className="text-sm text-gray-400">Stamina Used: {result.stamina_cost}</p>
                        <button onClick={onClose} className="btn-neon w-full bg-gray-600 text-white font-bold py-2 mt-4 rounded-lg">
                            NEXT VICTIM
                        </button>
                    </div>
                </div>
            )
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
        <NeonCard accent={result?.win ? 'lime' : 'pink'} className={`w-full max-w-md transition-all duration-300 ${stage === 'breaching' ? 'animate-glitch' : ''}`}>
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white z-20 text-2xl">&times;</button>
          {renderContent()}
        </NeonCard>
    </div>
  );
};

export default HackModal;