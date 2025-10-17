
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Profile, ShopItem, InventoryItem, HackResult, UserTask, Question, FeedItem, ReactionEmoji, AccentColor } from './types';
import * as GameService from './services/gameService';
import PlayerCard from './components/PlayerCard';
import HackModal from './components/HackModal';
import RadialGauge from './components/RadialGauge';
import NeonCard from './components/NeonCard';

type View = 'home' | 'shop' | 'leaderboard' | 'profile' | 'tasks' | 'subjects' | 'quiz' | 'settings';
const VIEW_NAMES: Record<View, string> = {
    home: 'The Hunt',
    shop: 'Black Market',
    leaderboard: 'Hall of Honor',
    tasks: 'Bounties',
    profile: 'Safehouse',
    settings: 'Settings',
    subjects: 'Subjects',
    quiz: 'Quiz',
};

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(value);
    // Fix: Initialize useRef with null, assuming the error on a nearby line points to this.
    // This resolves potential issues with older @types/react versions not supporting parameter-less useRef.
    const animationRef = useRef<number | null>(null);
    const prevValueRef = useRef(value);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const endValue = value;

        if (startValue === endValue) return;

        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / 1000, 1);
            const current = Math.floor(progress * (endValue - startValue) + startValue);
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                prevValueRef.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            // Fix: Update check to be compatible with the new null initialization.
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
            prevValueRef.current = endValue;
        };
    }, [value]);

    return <span className="animate-[roll-in_0.3s_ease-out]">{displayValue.toLocaleString()}</span>;
};


const XPProgressBar: React.FC<{ xp: number, level: number }> = ({ xp, level }) => {
    const xpForNextLevel = Math.floor(100 * Math.pow(level + 1, 1.6));
    const xpForCurrentLevel = level > 1 ? Math.floor(100 * Math.pow(level, 1.6)) : 0;
    const levelXp = xp - xpForCurrentLevel;
    const requiredXpForLevel = xpForNextLevel - xpForCurrentLevel;
    const progress = requiredXpForLevel > 0 ? Math.max(0, Math.min(100, (levelXp / requiredXpForLevel) * 100)) : 100;

    return (
        <div className="w-full">
            <div className="flex justify-between items-center text-sm mb-1 text-gray-300">
                <span className="font-bold">Level {level}</span>
                <span className="font-mono">{xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                    className="bg-gradient-to-r from-cyan-400 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

const ProfileView: React.FC<{ user: Profile, inventory: InventoryItem[], onActivateItem: (itemId: string) => void, onEditBio: () => void }> = ({ user, inventory, onActivateItem, onEditBio }) => {
    const getStatusColor = () => {
        const lastSeen = new Date(user.last_online_at).getTime();
        const now = new Date().getTime();
        const diffMinutes = (now - lastSeen) / (1000 * 60);
        if (diffMinutes < 5) return 'bg-green-400';
        if (diffMinutes < 30) return 'bg-yellow-400';
        return 'bg-red-500';
    };

    return (
        <div className="p-4 space-y-6 max-w-4xl mx-auto">
            <NeonCard accent="cyan" className="p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                    <div className="relative">
                        <img src={user.avatar_url} alt={user.username} className="w-28 h-28 rounded-full border-4 border-white/10 ring-2 ring-cyan-400/50" />
                        <span className={`absolute bottom-1 right-1 block h-5 w-5 rounded-full ${getStatusColor()} border-2 border-gray-800`}></span>
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="font-orbitron text-3xl font-bold text-white neon-glow-cyan">{user.display_name}</h2>
                        <p className="text-lg text-gray-400">@{user.username}</p>
                        {user.badges && user.badges.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                                {user.badges.map(badge => (
                                    <span key={badge} className="text-xs font-semibold bg-gray-700 text-cyan-300 px-2 py-1 rounded-full">
                                        {badge.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="md:ml-auto">
                        <button onClick={onEditBio} className="btn-neon bg-gray-600 px-4 py-2 rounded">Edit Profile</button>
                    </div>
                </div>
            </NeonCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <NeonCard className="flex flex-col items-center justify-center p-4 md:col-span-1">
                    <XPProgressBar xp={user.xp} level={user.level} />
                </NeonCard>
                <NeonCard className="flex flex-col items-center justify-center p-4">
                    <span className="text-gray-400 text-sm">CREDS</span>
                    <span className="font-orbitron text-3xl font-bold text-yellow-400">$<AnimatedCounter value={user.creds} /></span>
                </NeonCard>
                <NeonCard className="flex flex-col items-center justify-center p-4">
                    <span className="text-gray-400 text-sm mb-1">STAMINA</span>
                    <RadialGauge value={user.stamina} max={user.stamina_max} size={80} strokeWidth={8} />
                </NeonCard>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <NeonCard className="flex flex-col items-center justify-center p-4">
                    <span className="text-gray-400 text-sm">HACKING SKILL</span>
                    <span className="font-orbitron text-4xl font-bold text-pink-400">{user.hacking_skill}</span>
                </NeonCard>
                <NeonCard className="flex flex-col items-center justify-center p-4">
                    <span className="text-gray-400 text-sm">SECURITY LEVEL</span>
                    <span className="font-orbitron text-4xl font-bold text-cyan-400">{user.security_level}</span>
                </NeonCard>
            </div>

            <NeonCard accent="purple">
                <h3 className="font-orbitron text-lg font-bold mb-2 neon-glow-purple">Bio</h3>
                <p className="text-gray-300 italic">"{user.bio}"</p>
            </NeonCard>

            <div>
                <h3 className="font-orbitron text-2xl mb-4 neon-glow-lime">Quick Inventory</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {inventory.length > 0 ? inventory.map(item => (
                        <NeonCard key={item.id} accent="lime" className="flex flex-col items-center text-center p-3">
                            <img src={item.itemDetails?.image_url} alt={item.itemDetails?.title} className="w-16 h-16 object-cover rounded-md mb-2" />
                            <h4 className="font-bold text-sm leading-tight h-8 flex items-center justify-center">{item.itemDetails?.title}</h4>
                            <p className="text-xl font-bold my-1">x{item.qty}</p>
                            <button
                                onClick={() => onActivateItem(item.id)}
                                disabled={item.activated}
                                className="btn-neon bg-lime-600 text-black text-xs font-bold px-3 py-1 rounded mt-1 w-full disabled:bg-gray-500 disabled:opacity-50"
                            >
                                {item.activated ? 'ACTIVE' : 'ACTIVATE'}
                            </button>
                        </NeonCard>
                    )) : <p className="text-gray-500 col-span-full">No items in inventory.</p>}
                </div>
            </div>
        </div>
    );
};

const ShopView: React.FC<{user: Profile, onPurchase: (item: ShopItem) => void}> = ({ user, onPurchase }) => {
    const [items, setItems] = useState<ShopItem[]>([]);
    useEffect(() => {
        GameService.getShopItems().then(setItems);
    }, []);

    return <div className="p-4">
        <h2 className="font-orbitron text-3xl mb-6 neon-glow-cyan">{VIEW_NAMES.shop}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
                <div key={item.id} className="neon-border accent-pink rounded-lg p-4 flex flex-col">
                    <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover rounded-md mb-4"/>
                    <h3 className="font-orbitron font-bold">{item.title}</h3>
                    <p className="text-sm text-gray-400 flex-grow">{item.description}</p>
                    <div className="flex justify-between items-center mt-4">
                        <span className="font-bold text-yellow-400">${item.price_creds.toLocaleString()} Creds</span>
                        <button onClick={() => onPurchase(item)} disabled={user.creds < item.price_creds} className="btn-neon bg-pink-600 px-4 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Buy</button>
                    </div>
                </div>
            ))}
        </div>
    </div>;
};

const FeedItemCard: React.FC<{
    item: FeedItem;
    players: Profile[];
    onReact: (feedItemId: string, emoji: ReactionEmoji) => void;
    onPlayerClick: (player: Profile) => void;
}> = ({ item, players, onReact, onPlayerClick }) => {
    const getFeedItemStyle = (text: string) => {
        if (text.includes('pwned') || text.includes('swiped') || text.includes('made off')) {
            return { accent: 'lime' as AccentColor, icon: '💰' };
        }
        if (text.includes('failed')) {
            return { accent: 'pink' as AccentColor, icon: '💀' };
        }
        if (text.includes('activated')) {
            return { accent: 'purple' as AccentColor, icon: '🔥' };
        }
        return { accent: 'cyan' as AccentColor, icon: 'ℹ️' };
    };

    const renderWithClickableNames = (text: string) => {
        const parts = text.split(/(<strong>.*?<\/strong>)/g);
        return parts.map((part, index) => {
            if (part.startsWith('<strong>')) {
                const playerName = part.replace(/<\/?strong>/g, '');
                const player = players.find(p => p.display_name === playerName);
                if (player) {
                    return <strong key={index} className="cursor-pointer hover:underline" onClick={() => onPlayerClick(player)}>{playerName}</strong>;
                }
            }
            return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        });
    };

    const style = getFeedItemStyle(item.text);
    return (
        <div className={`neon-border accent-${style.accent} rounded-lg p-3 mb-3 text-sm`}>
            <div className="flex items-start space-x-2">
                <span className="text-lg">{style.icon}</span>
                <p className="text-gray-300 flex-1">{renderWithClickableNames(item.text)}</p>
            </div>
            <div className="reaction-bar flex items-center space-x-3 border-t border-lime-500/20 pt-2 mt-2 ml-8">
                {item.reactions.map(reaction => (
                    <button key={reaction.emoji} onClick={() => onReact(item.id, reaction.emoji)} className="flex items-center space-x-1 text-gray-400 hover:text-white">
                        <span>{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const LeaderboardView: React.FC<{
    players: Profile[], 
    onReact: (feedItemId: string, emoji: ReactionEmoji) => void,
    feed: FeedItem[],
    onPlayerClick: (player: Profile) => void
}> = ({ players, onReact, feed, onPlayerClick }) => {
    const sortedPlayers = [...players].sort((a, b) => b.xp - a.xp);

    return (
        <div className="p-4">
            <h2 className="font-orbitron text-3xl mb-6 neon-glow-purple">{VIEW_NAMES.leaderboard}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 neon-border accent-purple rounded-lg p-4">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-purple-500/30">
                                <th className="p-2 font-bold">Rank</th>
                                <th className="p-2 font-bold">Player</th>
                                <th className="p-2 text-right font-bold">Level</th>
                                <th className="p-2 text-right font-bold">XP</th>
                                <th className="p-2 text-right font-bold">Creds</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPlayers.map((player, index) => (
                                <tr key={player.id} className={`border-b border-gray-700/50 hover:bg-purple-500/10`}>
                                    <td className="p-2 font-bold text-lg">{index + 1}</td>
                                    <td className="p-2 flex items-center space-x-3">
                                        <img src={player.avatar_url} alt={player.display_name} className="w-10 h-10 rounded-full" />
                                        <span onClick={() => onPlayerClick(player)} className="font-semibold cursor-pointer hover:underline">{player.display_name}</span>
                                    </td>
                                    <td className="p-2 text-right font-mono text-lg">{player.level}</td>
                                    <td className="p-2 text-right font-mono text-lg text-lime-400">{player.xp.toLocaleString()}</td>
                                    <td className="p-2 text-right font-mono text-lg text-yellow-400">${player.creds.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="lg:col-span-1">
                    <h3 className="font-orbitron text-2xl mb-4 neon-glow-lime">Live Feed</h3>
                    <div className="max-h-[600px] overflow-y-auto pr-2">
                       {feed.map(item => <FeedItemCard key={item.id} item={item} players={players} onReact={onReact} onPlayerClick={onPlayerClick} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskCard: React.FC<{ 
    task: UserTask,
    onAccept: (taskId: string) => void, 
    onClaim: (taskId: string) => void,
    acceptingTaskId: string | null,
    acceptanceStatus: { taskId: string; status: 'success' | 'error' } | null
}> = ({ task, onAccept, onClaim, acceptingTaskId, acceptanceStatus }) => {
    const accentColors: Record<string, string> = {
        daily: 'cyan',
        weekly: 'lime',
        oneoff: 'pink',
        challenge: 'purple',
        batch: 'purple',
    };
    
    const accentColor = accentColors[task.template.task_type] || 'cyan';

    const progress = (task.progress.current / task.progress.needed) * 100;
    const isAccepting = acceptingTaskId === task.id;
    const currentAcceptanceStatus = acceptanceStatus?.taskId === task.id ? acceptanceStatus.status : null;

    const renderActionButton = () => {
        if (isAccepting) {
            return (
                <div className="flex items-center justify-center h-[32px] w-[88px]">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            );
        }
        if (currentAcceptanceStatus === 'success') {
            return <div className="text-lime-400 font-bold h-[32px] flex items-center justify-center w-[88px]">ACCEPTED</div>;
        }
        if (currentAcceptanceStatus === 'error') {
             return <div className="text-red-500 font-bold h-[32px] flex items-center justify-center w-[88px]">ERROR</div>;
        }

        switch(task.status) {
            case 'available':
                return <button onClick={() => onAccept(task.id)} className="btn-neon bg-cyan-600 px-4 py-1 rounded">Accept</button>;
            case 'completed':
                return <button onClick={() => onClaim(task.id)} className="btn-neon bg-lime-500 px-4 py-1 rounded">Claim</button>;
            case 'claimed':
                return <span className="text-gray-500 font-bold">Claimed</span>;
            case 'in_progress':
                 return <span className="text-yellow-400 font-bold">In Progress</span>
            default:
                return null;
        }
    };
    
    const colorMap: Record<string, string> = {
        cyan: 'text-cyan-400',
        lime: 'text-lime-400',
        pink: 'text-pink-400',
        purple: 'text-purple-400',
    };

    return (
        <NeonCard accent={accentColor as any}>
            <div className="flex justify-between items-start">
                <div>
                    <span className={`text-xs uppercase font-bold ${colorMap[accentColor]}`}>{task.template.task_type}</span>
                    <h3 className="font-orbitron text-lg font-bold">{task.template.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{task.template.description}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-yellow-400">+{task.template.reward_creds} Creds</p>
                    <p className="font-bold text-lime-400">+{task.template.reward_xp} XP</p>
                </div>
            </div>
            <div className="mt-4">
                {task.status !== 'available' && task.status !== 'claimed' && (
                     <div className="w-full bg-white/10 rounded-full h-2.5">
                        <div className="bg-lime-400 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                    </div>
                )}
                <div className="flex justify-between items-center mt-2">
                    <p className="text-sm font-mono">{task.progress.current} / {task.progress.needed}</p>
                    {renderActionButton()}
                </div>
            </div>
        </NeonCard>
    );
};


const TasksView: React.FC<{ 
    tasks: UserTask[], 
    onAccept: (taskId: string) => void, 
    onClaim: (taskId: string) => void, 
    onSubjectsClick: () => void,
    acceptingTaskId: string | null,
    acceptanceStatus: { taskId: string; status: 'success' | 'error' } | null
}> = ({ tasks, onAccept, onClaim, onSubjectsClick, acceptingTaskId, acceptanceStatus }) => {
    return (
        <div className="p-4">
            <h2 className="font-orbitron text-3xl mb-6 neon-glow-cyan">{VIEW_NAMES.tasks}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map(task => <TaskCard key={task.id} task={task} onAccept={onAccept} onClaim={onClaim} acceptingTaskId={acceptingTaskId} acceptanceStatus={acceptanceStatus} />)}
                <NeonCard accent="purple" onClick={onSubjectsClick} className="flex flex-col items-center justify-center text-center">
                    <h3 className="font-orbitron text-2xl font-bold">Knowledge is Power</h3>
                    <p className="mt-2 text-gray-400">Answer quiz questions to earn extra creds and XP!</p>
                </NeonCard>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  // State management
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [view, setView] = useState<View>('home');
  const [isMuted, setIsMuted] = useState(GameService.isMuted());
  const [showLogout, setShowLogout] = useState(false);

  // Modal states
  const [hackTarget, setHackTarget] = useState<Profile | null>(null);
  const [showBioEditor, setShowBioEditor] = useState(false);
  const [bioText, setBioText] = useState('');
  const [playerPeek, setPlayerPeek] = useState<Profile | null>(null);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [acceptingTaskId, setAcceptingTaskId] = useState<string | null>(null);
  const [acceptanceStatus, setAcceptanceStatus] = useState<{ taskId: string; status: 'success' | 'error' } | null>(null);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Settings State
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsAccess, setSettingsAccess] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ username: '', password: '', display_name: '', bio: '', creds: 1000, xp: 0, level: 1, stamina: 100, stamina_max: 100, security_level: 10, hacking_skill: 10});
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [adminAmount, setAdminAmount] = useState<number>(0);
  const [adminItemId, setAdminItemId] = useState<string>('');
  const [adminBadge, setAdminBadge] = useState('');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  
  // Admin Question Management State
  const getInitialEditingQuestion = (): Omit<Question, 'id'> & { id?: string } => ({
    subject: subjects[0] || '',
    prompt: '',
    choices: ['', '', '', ''],
    correct_choice_index: 0,
  });
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState(getInitialEditingQuestion());


  // Sound preloading
  useEffect(() => {
    GameService.preloadSounds();
  }, []);
  
  useEffect(() => {
    if (settingsAccess) {
        GameService.getAllQuestions().then(setAllQuestions);
    }
  }, [settingsAccess])

  const loadUserData = useCallback(async (user: Profile) => {
    setCurrentUser(user);
    GameService.getPlayers(user.id).then(setPlayers);
    GameService.getInventory(user.id).then(setInventory);
    GameService.getTasks(user.id).then(setTasks);
    GameService.getFeed().then(setFeed);
    GameService.getSubjects().then(subjects => {
        setSubjects(subjects);
        setEditingQuestion(prev => ({...prev, subject: subjects[0] || ''}));
    });
    GameService.getShopItems().then(setShopItems);
  }, []);

  // Handlers
  const handleHack = (player: Profile) => {
    GameService.playSound('hack_start');
    setHackTarget(player);
  };
  
  const handleLogout = () => {
      setCurrentUser(null);
      setView('home');
      setUsername('');
      setPassword('');
      setLoginError('');
      setShowLogout(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      const user = await GameService.login(username, password);
      if (user) {
          GameService.playSound('task_accept');
          loadUserData(user);
      } else {
          GameService.playSound('hack_fail');
          setLoginError('Invalid username or password');
      }
  };

  const handleHackComplete = async (result: HackResult, defender: Profile) => {
    if (result.win) {
        GameService.playSound('hack_win');
    } else {
        GameService.playSound('hack_fail');
    }
    if (currentUser) {
        const updatedUser = await GameService.getPlayerById(currentUser.id);
        if (updatedUser) setCurrentUser(updatedUser);
    }
    GameService.getFeed().then(setFeed);
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!currentUser) return;
    const result = await GameService.buyItem(currentUser, item);
    if (result.success && result.updatedUser) {
        GameService.playSound('shop_buy');
        setCurrentUser(result.updatedUser);
        GameService.getInventory(currentUser.id).then(setInventory);
    } else {
        alert(result.message);
    }
  };

  const handleActivateItem = async (inventoryId: string) => {
    if (!currentUser) return;
    const result = await GameService.activateItem(currentUser, inventoryId);
    if (result.success) {
        GameService.playSound('item_activate');
        GameService.getInventory(currentUser.id).then(setInventory);
    } else {
        alert(result.message);
    }
  };

  const handleReactToFeed = async (feedItemId: string, emoji: ReactionEmoji) => {
    GameService.playSound('ui_click');
    await GameService.reactToFeedItem(feedItemId, emoji);
    GameService.getFeed().then(setFeed);
  };
  
  const handlePlayerClick = (player: Profile) => {
      GameService.playSound('ui_click');
      setPlayerPeek(player);
  }

  // Tasks Handlers
  const handleAcceptTask = async (taskId: string) => {
      setAcceptingTaskId(taskId);
      setAcceptanceStatus(null);
      GameService.playSound('task_accept');
      const res = await GameService.acceptTask(taskId);
      if (res.success && res.updatedTask) {
          setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? res.updatedTask! : t));
          setAcceptanceStatus({ taskId, status: 'success' });
      } else {
          setAcceptanceStatus({ taskId, status: 'error' });
      }
      setTimeout(() => {
        setAcceptingTaskId(null);
        setTimeout(() => setAcceptanceStatus(null), 1000);
      }, 500);
  };

  const handleClaimReward = async (taskId: string) => {
      if(!currentUser) return;
      GameService.playSound('task_claim');
      const res = await GameService.claimTaskReward(taskId);
      if (res.success && res.updatedTask && res.reward) {
          setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? res.updatedTask! : t));
          setCurrentUser(prevUser => prevUser ? { ...prevUser, creds: prevUser.creds + res.reward!.creds, xp: prevUser.xp + res.reward!.xp } : null);
      }
  };
  
  const handleStartQuiz = async (subject: string) => {
      const questions = await GameService.getQuestions(subject);
      setQuestions(questions);
      setCurrentSubject(subject);
      setCurrentQuestionIndex(0);
      setScore(0);
      setView('quiz');
  };
  
  const handleAnswer = async (answerIndex: number) => {
    if(!currentUser) return;
    const question = questions[currentQuestionIndex];
    const result = await GameService.submitAnswer(question.id, answerIndex);
    if (result.correct) {
        GameService.playSound('quiz_correct');
        setScore(s => s + 1);
        setCurrentUser({...currentUser, creds: currentUser.creds + result.reward.creds, xp: currentUser.xp + result.reward.xp });
    } else {
        GameService.playSound('quiz_incorrect');
        setCurrentUser({...currentUser, creds: currentUser.creds + result.reward.creds });
    }

    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
    } else {
        alert(`Quiz finished! You scored ${score + (result.correct ? 1 : 0)}/${questions.length}.`);
        setView('subjects');
    }
  };

  const handleToggleMute = () => {
    const newMutedState = GameService.toggleMute();
    setIsMuted(newMutedState);
  };
  
  const handleEditBio = () => {
    if (currentUser) {
      setBioText(currentUser.bio);
      setShowBioEditor(true);
    }
  };

  const handleSaveBio = async () => {
    if (currentUser) {
      const updatedUser = await GameService.updateBio(currentUser.id, bioText);
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
      setShowBioEditor(false);
    }
  };
  
  // Settings Handlers
  const handleSettingsAccess = () => {
      if (settingsPassword === 'sobbi-brain') {
          GameService.playSound('admin_action');
          setSettingsAccess(true);
      } else {
          GameService.playSound('hack_fail');
          alert('Incorrect password');
      }
  };
  
  const handleAddPlayer = async (e: React.FormEvent) => {
      e.preventDefault();
      await GameService.addPlayer(newPlayer);
      alert(`${newPlayer.username} created!`);
      // Reset form
      setNewPlayer({ username: '', password: '', display_name: '', bio: '', creds: 1000, xp: 0, level: 1, stamina: 100, stamina_max: 100, security_level: 10, hacking_skill: 10});
      GameService.getPlayers(currentUser?.id).then(setPlayers);
  };

  const handleAdminAction = async (action: 'addCreds' | 'addXp' | 'giveItem' | 'addBadge' | 'deletePlayer') => {
    if (!selectedPlayer) return;
    GameService.playSound('admin_action');
    switch (action) {
        case 'addCreds':
            await GameService.addCreds(selectedPlayer, adminAmount);
            alert(`Added ${adminAmount} creds`);
            break;
        case 'addXp':
            await GameService.addXp(selectedPlayer, adminAmount);
            alert(`Added ${adminAmount} XP`);
            break;
        case 'giveItem':
            if (adminItemId) await GameService.giveItem(selectedPlayer, adminItemId);
            break;
        case 'addBadge':
            if (adminBadge) await GameService.addBadge(selectedPlayer, adminBadge);
            break;
        case 'deletePlayer':
             if (window.confirm('Are you sure you want to delete this player? This cannot be undone.')) {
                await GameService.deletePlayer(selectedPlayer);
                alert('Player deleted.');
                setSelectedPlayer(null);
            }
            break;
    }
    GameService.getPlayers(currentUser?.id).then(setPlayers);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await GameService.saveQuestion(editingQuestion);
    setEditingQuestion(getInitialEditingQuestion());
    GameService.getAllQuestions().then(setAllQuestions);
    GameService.playSound('admin_action');
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
        await GameService.deleteQuestion(questionId);
        GameService.getAllQuestions().then(setAllQuestions);
        GameService.playSound('hack_fail');
    }
  };


  if (!currentUser) {
    return (
        <div className="h-screen w-full flex items-center justify-center hacker-bg">
            <NeonCard accent="cyan" className="w-full max-w-sm">
                <h2 className="font-orbitron text-3xl text-center mb-6 neon-glow-cyan">BRAIN HEIST</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-gray-800 text-white p-3 rounded-md border border-cyan-400/50 focus:ring-2 focus:ring-cyan-400 outline-none" required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-800 text-white p-3 rounded-md border border-cyan-400/50 focus:ring-2 focus:ring-cyan-400 outline-none" required />
                    {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                    <button type="submit" className="btn-neon w-full bg-cyan-600 font-bold p-3 rounded">Login</button>
                </form>
            </NeonCard>
        </div>
    );
  }
  
  const renderView = () => {
    switch(view) {
        case 'home':
            return (
                <div className="p-4">
                    <h2 className="font-orbitron text-3xl mb-6 neon-glow-cyan">{VIEW_NAMES.home}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {players.map(player => (
                            <PlayerCard key={player.id} player={player} onHack={handleHack} />
                        ))}
                    </div>
                </div>
            );
        case 'shop':
            return <ShopView user={currentUser} onPurchase={handlePurchase} />;
        case 'leaderboard':
            return <LeaderboardView players={[currentUser, ...players]} feed={feed} onReact={handleReactToFeed} onPlayerClick={handlePlayerClick} />;
        case 'profile':
            return <ProfileView user={currentUser} inventory={inventory} onActivateItem={handleActivateItem} onEditBio={handleEditBio} />;
        case 'tasks':
            return <TasksView tasks={tasks} onAccept={handleAcceptTask} onClaim={handleClaimReward} onSubjectsClick={() => setView('subjects')} acceptingTaskId={acceptingTaskId} acceptanceStatus={acceptanceStatus} />;
        case 'subjects':
            return (
                <div className="p-4">
                    <h2 className="font-orbitron text-3xl mb-6 neon-glow-lime">Knowledge Base</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {subjects.map(subject => (
                            <NeonCard key={subject} accent="lime" onClick={() => handleStartQuiz(subject)} className="text-center font-bold text-lg">
                                {subject}
                            </NeonCard>
                        ))}
                    </div>
                </div>
            );
        case 'quiz':
            const question = questions[currentQuestionIndex];
            if (!question) return <p>Loading question...</p>;
            return (
                <div className="p-4 max-w-2xl mx-auto">
                    <h2 className="font-orbitron text-2xl mb-2 neon-glow-purple">{currentSubject} Quiz</h2>
                    <p className="mb-6 text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    <NeonCard accent="purple">
                        <p className="text-xl mb-6">{question.prompt}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.choices.map((choice, index) => (
                                <button key={index} onClick={() => handleAnswer(index)} className="btn-neon bg-purple-600 p-3 rounded-lg text-left">
                                    {choice}
                                </button>
                            ))}
                        </div>
                    </NeonCard>
                </div>
            );
         case 'settings':
            if (!settingsAccess) {
                return (
                    <div className="flex items-center justify-center pt-10">
                        <NeonCard accent="pink" className="w-full max-w-sm">
                             <h2 className="font-orbitron text-2xl text-center mb-4 neon-glow-pink">Admin Access Required</h2>
                             <input type="password" placeholder="Enter Admin Password" value={settingsPassword} onChange={e => setSettingsPassword(e.target.value)} className="w-full bg-gray-800 text-white p-3 rounded-md border border-pink-400/50 focus:ring-2 focus:ring-pink-400 outline-none" />
                             <button onClick={handleSettingsAccess} className="btn-neon w-full bg-pink-600 font-bold p-3 rounded mt-4">Authenticate</button>
                        </NeonCard>
                    </div>
                );
            }
            return (
                <div className="p-4 space-y-8">
                    <h2 className="font-orbitron text-3xl mb-6 neon-glow-pink">Admin Panel</h2>
                    
                    <NeonCard accent="purple">
                        <h3 className="font-orbitron text-xl mb-4">Manage Questions</h3>
                        <form onSubmit={handleSaveQuestion} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Subject</label>
                                <select value={editingQuestion.subject} onChange={e => setEditingQuestion({...editingQuestion, subject: e.target.value})} className="bg-gray-800 p-2 rounded border border-purple-400/50 w-full">
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Prompt</label>
                                <textarea placeholder="Question Prompt" value={editingQuestion.prompt} onChange={e => setEditingQuestion({...editingQuestion, prompt: e.target.value})} className="bg-gray-800 p-2 rounded border border-purple-400/50 w-full" required />
                            </div>
                            {editingQuestion.choices.map((choice, index) => (
                                <div key={index}>
                                    <label className="block text-sm font-bold mb-1">Choice {index + 1} {editingQuestion.correct_choice_index === index && <span className="text-lime-400">(Correct)</span>}</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" name="correct_choice" checked={editingQuestion.correct_choice_index === index} onChange={() => setEditingQuestion({...editingQuestion, correct_choice_index: index})} />
                                        <input type="text" placeholder={`Answer Choice ${index + 1}`} value={choice} onChange={e => {
                                            const newChoices = [...editingQuestion.choices];
                                            newChoices[index] = e.target.value;
                                            setEditingQuestion({...editingQuestion, choices: newChoices});
                                        }} className="bg-gray-800 p-2 rounded border border-purple-400/50 w-full" required />
                                    </div>
                                </div>
                            ))}
                             <div className="flex gap-4">
                                <button type="submit" className="btn-neon bg-purple-600 flex-1 p-2 rounded">{editingQuestion.id ? 'Update Question' : 'Create Question'}</button>
                                {editingQuestion.id && <button type="button" onClick={() => setEditingQuestion(getInitialEditingQuestion())} className="btn-neon bg-gray-600 flex-1 p-2 rounded">Cancel Edit</button>}
                            </div>
                        </form>
                        <div className="mt-6">
                            <h4 className="font-orbitron text-lg mb-2">Existing Questions</h4>
                            <div className="max-h-60 overflow-y-auto pr-2">
                                {allQuestions.map(q => (
                                    <div key={q.id} className="bg-gray-800/50 p-2 rounded mb-2 flex justify-between items-center">
                                        <p className="text-sm flex-1"><strong className="text-purple-300">[{q.subject}]</strong> {q.prompt}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditQuestion(q)} className="text-xs bg-cyan-600 px-2 py-1 rounded">Edit</button>
                                            <button onClick={() => handleDeleteQuestion(q.id)} className="text-xs bg-red-600 px-2 py-1 rounded">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </NeonCard>

                    <NeonCard accent="cyan">
                        <h3 className="font-orbitron text-xl mb-4">Create New Player</h3>
                        <form onSubmit={handleAddPlayer} className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Username" value={newPlayer.username} onChange={e => setNewPlayer({...newPlayer, username: e.target.value})} className="bg-gray-800 p-2 rounded border border-cyan-400/50" required/>
                            <input type="password" placeholder="Password" value={newPlayer.password} onChange={e => setNewPlayer({...newPlayer, password: e.target.value})} className="bg-gray-800 p-2 rounded border border-cyan-400/50" required/>
                            <input type="text" placeholder="Display Name" value={newPlayer.display_name} onChange={e => setNewPlayer({...newPlayer, display_name: e.target.value})} className="bg-gray-800 p-2 rounded border border-cyan-400/50 col-span-2" required/>
                            <textarea placeholder="Bio" value={newPlayer.bio} onChange={e => setNewPlayer({...newPlayer, bio: e.target.value})} className="bg-gray-800 p-2 rounded border border-cyan-400/50 col-span-2" />
                            <input type="number" placeholder="Creds" value={newPlayer.creds} onChange={e => setNewPlayer({...newPlayer, creds: Number(e.target.value)})} className="bg-gray-800 p-2 rounded border border-cyan-400/50" />
                            <input type="number" placeholder="XP" value={newPlayer.xp} onChange={e => setNewPlayer({...newPlayer, xp: Number(e.target.value)})} className="bg-gray-800 p-2 rounded border border-cyan-400/50" />
                            <input type="number" placeholder="Level" value={newPlayer.level} onChange={e => setNewPlayer({...newPlayer, level: Number(e.target.value)})} className="bg-gray-800 p-2 rounded border border-cyan-400/50" />
                            <input type="number" placeholder="Hacking" value={newPlayer.hacking_skill} onChange={e => setNewPlayer({...newPlayer, hacking_skill: Number(e.target.value)})} className="bg-gray-800 p-2 rounded border border-cyan-400/50" />
                            <input type="number" placeholder="Security" value={newPlayer.security_level} onChange={e => setNewPlayer({...newPlayer, security_level: Number(e.target.value)})} className="bg-gray-800 p-2 rounded border border-cyan-400/50" />
                            <button type="submit" className="btn-neon bg-cyan-600 col-span-2 p-2 rounded">Create Player</button>
                        </form>
                    </NeonCard>

                    <NeonCard accent="lime">
                         <h3 className="font-orbitron text-xl mb-4">Manage Existing Player</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <select value={selectedPlayer || ''} onChange={e => setSelectedPlayer(e.target.value)} className="col-span-2 bg-gray-800 p-2 rounded border border-lime-400/50">
                                <option value="" disabled>Select a player</option>
                                {[currentUser, ...players].map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                            </select>
                            <input type="number" placeholder="Amount" value={adminAmount} onChange={e => setAdminAmount(Number(e.target.value))} className="bg-gray-800 p-2 rounded border border-lime-400/50" />
                             <div className="flex gap-2">
                                <button onClick={() => handleAdminAction('addCreds')} className="btn-neon bg-lime-600 flex-1 p-2 rounded" disabled={!selectedPlayer}>+ Creds</button>
                                <button onClick={() => handleAdminAction('addXp')} className="btn-neon bg-lime-600 flex-1 p-2 rounded" disabled={!selectedPlayer}>+ XP</button>
                             </div>
                             <select value={adminItemId} onChange={e => setAdminItemId(e.target.value)} className="bg-gray-800 p-2 rounded border border-lime-400/50">
                                <option value="" disabled>Select item</option>
                                {shopItems.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                            </select>
                            <button onClick={() => handleAdminAction('giveItem')} className="btn-neon bg-lime-600 p-2 rounded" disabled={!selectedPlayer || !adminItemId}>Give Item</button>
                            <input type="text" placeholder="badge_name" value={adminBadge} onChange={e => setAdminBadge(e.target.value)} className="bg-gray-800 p-2 rounded border border-lime-400/50" />
                            <button onClick={() => handleAdminAction('addBadge')} className="btn-neon bg-lime-600 p-2 rounded" disabled={!selectedPlayer || !adminBadge}>Add Badge</button>
                            <div className="col-span-2">
                                <button onClick={() => handleAdminAction('deletePlayer')} className="btn-neon bg-red-600 w-full p-2 rounded mt-4" disabled={!selectedPlayer || selectedPlayer === currentUser.id}>Delete Player</button>
                            </div>
                         </div>
                    </NeonCard>
                </div>
            );
    }
  };

  const navItems: View[] = ['home', 'tasks', 'leaderboard', 'shop', 'profile', 'settings'];

  return (
    <div className="h-screen w-full flex flex-col hacker-bg text-white">
        <header className="flex-shrink-0 bg-panel/80 backdrop-blur-sm border-b border-glass-border shadow-lg z-20">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-2">
                    <h1 className="font-orbitron text-xl md:text-2xl font-black neon-glow-cyan">BRAIN HEIST</h1>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <div className="hidden md:flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full">
                           <span className="text-yellow-400 font-bold">$</span>
                           <AnimatedCounter value={currentUser.creds} />
                        </div>
                         <div className="hidden md:flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full">
                           <span className="text-lime-400 font-bold">XP</span>
                           <AnimatedCounter value={currentUser.xp} />
                        </div>
                        <div className="relative">
                            <img src={currentUser.avatar_url} alt="You" className="w-10 h-10 rounded-full cursor-pointer" onClick={() => setShowLogout(!showLogout)}/>
                            {showLogout && (
                                <div className="absolute right-0 mt-2 w-48 bg-panel neon-border accent-pink rounded-md shadow-lg py-1">
                                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20">Logout</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
        <main className="flex-grow overflow-y-auto container mx-auto px-4 py-4">
            {renderView()}
        </main>
        <footer className="flex-shrink-0 bg-panel/80 backdrop-blur-sm border-t border-glass-border z-20 p-2">
             <div className="flex justify-center items-center space-x-2">
                {navItems.map(v => (
                    <button key={v} onClick={() => { setView(v); GameService.playSound('ui_click'); }} className={`px-3 py-2 text-xs md:px-4 md:text-sm font-bold uppercase rounded-md transition-colors ${view === v ? 'bg-cyan-500 text-black shadow-lg' : 'hover:bg-white/10'}`}>{VIEW_NAMES[v]}</button>
                ))}
                 <button onClick={handleToggleMute} className="px-3 py-2 text-xs md:px-4 md:text-sm rounded-md hover:bg-white/10">{isMuted ? '🔇' : '🔊'}</button>
            </div>
        </footer>
        {hackTarget && <HackModal attacker={currentUser} defender={hackTarget} onClose={() => setHackTarget(null)} onHackComplete={handleHackComplete}/>}
        {showBioEditor && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <NeonCard accent="purple" className="w-full max-w-lg">
                    <h3 className="font-orbitron text-xl mb-4">Update Bio</h3>
                    <textarea value={bioText} onChange={e => setBioText(e.target.value)} className="w-full h-32 bg-gray-800 p-2 rounded border border-purple-400/50" />
                    <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={() => setShowBioEditor(false)} className="btn-neon bg-gray-600 px-4 py-2 rounded">Cancel</button>
                        <button onClick={handleSaveBio} className="btn-neon bg-purple-600 px-4 py-2 rounded">Save</button>
                    </div>
                </NeonCard>
            </div>
        )}
        {playerPeek && (
             <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPlayerPeek(null)}>
                <div onClick={e => e.stopPropagation()}>
                    <PlayerCard player={playerPeek} onHack={p => { setPlayerPeek(null); handleHack(p); }} />
                </div>
             </div>
        )}
    </div>
  );
}

export default App;
