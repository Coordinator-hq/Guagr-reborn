import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// 90-second recurring market duration
const ROUND_DURATION_MS = 90 * 1000;

interface UserState {
  userId: string;
  username: string;
  avatar: string;
  virtualBalance: number;
  totalProfit: number;
  totalRounds: number;
  winningRounds: number;
  isSimulated?: boolean;
}

interface MarketState {
  roundId: string;
  roundNumber: number;
  startTime: number;
  endTime: number;
  status: 'active' | 'resolved' | 'rollover';
  yesTotal: number;
  noTotal: number;
  totalPot: number;
  winningOption: 'YES' | 'NO' | 'TIE' | null;
  rolloverAmount: number;
  platformFee: number;
  distributablePot: number;
  resolvedAt?: number;
}

interface ParticipationRecord {
  participationId: string;
  userId: string;
  roundId: string;
  selectedOption: 'YES' | 'NO';
  stake: number;
  payout: number;
  result: 'PENDING' | 'WIN' | 'LOSS' | 'ROLLOVER';
  timestamp: number;
  username: string;
  avatar: string;
}

interface TransactionRecord {
  transactionId: string;
  userId: string;
  amount: number;
  type: 'INITIAL_GRANT' | 'STAKE' | 'PAYOUT' | 'ROLLOVER_REFUND';
  roundId?: string;
  timestamp: number;
  description: string;
}

interface LiveFeedItem {
  id: string;
  username: string;
  avatar: string;
  option: 'YES' | 'NO';
  stake: number;
  timestamp: number;
}

interface ResolutionSummary {
  roundId: string;
  roundNumber: number;
  winningOption: 'YES' | 'NO' | 'TIE';
  yesTotal: number;
  noTotal: number;
  totalPot: number;
  rolloverAmountNext: number;
  userParticipations: { [userId: string]: { payout: number; netProfit: number; stake: number } };
}

// In-Memory Global Server State (Shared across all connected players)
class MarketEngine {
  users: Map<string, UserState> = new Map();
  markets: MarketState[] = [];
  participations: ParticipationRecord[] = [];
  transactions: TransactionRecord[] = [];
  liveFeed: LiveFeedItem[] = [];
  currentRound: MarketState;
  lastResolution: ResolutionSummary | null = null;
  sseClients: Set<express.Response> = new Set();

  constructor() {
    this.seedUsers();
    const now = Date.now();
    this.currentRound = {
      roundId: 'R-1001',
      roundNumber: 1001,
      startTime: now,
      endTime: now + ROUND_DURATION_MS,
      status: 'active',
      yesTotal: 0,
      noTotal: 0,
      totalPot: 0,
      winningOption: null,
      rolloverAmount: 0,
      platformFee: 0,
      distributablePot: 0,
    };
    this.markets.push(this.currentRound);

    // Authoritative 1-second interval loop
    setInterval(() => this.tick(), 1000);

    // Organic bot bets to keep gameplay dynamic & lively (FAST: 1000ms)
    setInterval(() => this.simulateBotBet(), 1000);
  }

  seedUsers() {
    const bots: UserState[] = [
      {
        userId: 'bot_whale_delta',
        username: 'WhaleDelta',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WhaleDelta&backgroundColor=1e293b',
        virtualBalance: 320000,
        totalProfit: 120000,
        totalRounds: 38,
        winningRounds: 24,
        isSimulated: true,
      },
      {
        userId: 'bot_quant_alpha',
        username: 'QuantAlpha',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantAlpha&backgroundColor=022c22',
        virtualBalance: 240000,
        totalProfit: 75000,
        totalRounds: 32,
        winningRounds: 21,
        isSimulated: true,
      },
      {
        userId: 'bot_lagos_trader',
        username: 'LagosTrader',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LagosTrader&backgroundColor=172554',
        virtualBalance: 185000,
        totalProfit: 55000,
        totalRounds: 28,
        winningRounds: 18,
        isSimulated: true,
      },
      {
        userId: 'bot_satoshi_pulse',
        username: 'SatoshiPulse',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SatoshiPulse&backgroundColor=451a03',
        virtualBalance: 165000,
        totalProfit: 35000,
        totalRounds: 26,
        winningRounds: 15,
        isSimulated: true,
      },
      {
        userId: 'bot_naija_bull',
        username: 'NaijaBull',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NaijaBull&backgroundColor=3b0764',
        virtualBalance: 140000,
        totalProfit: 20000,
        totalRounds: 22,
        winningRounds: 13,
        isSimulated: true,
      },
      {
        userId: 'bot_kano_delta',
        username: 'DeltaKano',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DeltaKano&backgroundColor=134e4a',
        virtualBalance: 110000,
        totalProfit: 8000,
        totalRounds: 18,
        winningRounds: 10,
        isSimulated: true,
      },
      {
        userId: 'bot_apex_scalper',
        username: 'ApexScalper',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexScalper&backgroundColor=0f172a',
        virtualBalance: 290000,
        totalProfit: 98000,
        totalRounds: 35,
        winningRounds: 22,
        isSimulated: true,
      },
      {
        userId: 'bot_eko_whale',
        username: 'EkoWhale',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=EkoWhale&backgroundColor=0369a1',
        virtualBalance: 215000,
        totalProfit: 68000,
        totalRounds: 30,
        winningRounds: 19,
        isSimulated: true,
      },
      {
        userId: 'bot_abuja_trader',
        username: 'AbujaTrader',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AbujaTrader&backgroundColor=047857',
        virtualBalance: 155000,
        totalProfit: 31000,
        totalRounds: 25,
        winningRounds: 15,
        isSimulated: true,
      },
      {
        userId: 'bot_sigma_hedger',
        username: 'SigmaHedger',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SigmaHedger&backgroundColor=6d28d9',
        virtualBalance: 130000,
        totalProfit: 18000,
        totalRounds: 20,
        winningRounds: 12,
        isSimulated: true,
      },
      {
        userId: 'bot_zaria_alpha',
        username: 'ZariaAlpha',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ZariaAlpha&backgroundColor=b91c1c',
        virtualBalance: 95000,
        totalProfit: -5000,
        totalRounds: 16,
        winningRounds: 7,
        isSimulated: true,
      },
      {
        userId: 'bot_ibadan_bull',
        username: 'IbadanBull',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=IbadanBull&backgroundColor=c2410c',
        virtualBalance: 88000,
        totalProfit: -12000,
        totalRounds: 15,
        winningRounds: 6,
        isSimulated: true,
      },
    ];
    bots.forEach(b => this.users.set(b.userId, b));
  }

  getOrCreateUser(userId: string, username?: string, avatar?: string): UserState {
    let user = this.users.get(userId);
    if (!user) {
      user = {
        userId,
        username: username || `Trader_${userId.slice(-4)}`,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}&backgroundColor=0f172a`,
        virtualBalance: 100000,
        totalProfit: 0,
        totalRounds: 0,
        winningRounds: 0,
      };
      this.users.set(userId, user);
      this.transactions.push({
        transactionId: `tx-init-${Date.now()}-${userId}`,
        userId,
        amount: 100000,
        type: 'INITIAL_GRANT',
        timestamp: Date.now(),
        description: 'Initial 100,000 Beta Credits',
      });
    }
    return user;
  }

  tick() {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((this.currentRound.endTime - now) / 1000));

    if (remaining <= 0 && this.currentRound.status === 'active') {
      this.resolveRound();
    }
  }

  resolveRound() {
    const round = this.currentRound;
    const now = Date.now();

    const yesTotal = round.yesTotal;
    const noTotal = round.noTotal;
    const totalPot = yesTotal + noTotal + (round.rolloverAmount || 0);

    let winningOption: 'YES' | 'NO' | 'TIE';
    let nextRollover = 0;
    let platformFee = 0;
    let distributablePot = 0;

    if (yesTotal > noTotal) {
      winningOption = 'YES';
      platformFee = Math.round(totalPot * 0.10);
      distributablePot = totalPot - platformFee;
    } else if (noTotal > yesTotal) {
      winningOption = 'NO';
      platformFee = Math.round(totalPot * 0.10);
      distributablePot = totalPot - platformFee;
    } else {
      winningOption = 'TIE';
      nextRollover = totalPot;
      platformFee = 0;
      distributablePot = 0;
    }

    round.status = winningOption === 'TIE' ? 'rollover' : 'resolved';
    round.winningOption = winningOption;
    round.totalPot = totalPot;
    round.platformFee = platformFee;
    round.distributablePot = distributablePot;
    round.resolvedAt = now;

    // Distribute payouts to winning participants
    const roundParticipations = this.participations.filter(p => p.roundId === round.roundId);
    const userSummary: { [userId: string]: { payout: number; netProfit: number; stake: number } } = {};

    for (const p of roundParticipations) {
      if (!userSummary[p.userId]) {
        userSummary[p.userId] = { payout: 0, netProfit: 0, stake: 0 };
      }
      userSummary[p.userId].stake += p.stake;

      let payout = 0;
      let result: 'WIN' | 'LOSS' | 'ROLLOVER' = 'LOSS';

      if (winningOption === 'TIE') {
        result = 'ROLLOVER';
      } else if (p.selectedOption === winningOption) {
        result = 'WIN';
        const winningSideTotal = winningOption === 'YES' ? yesTotal : noTotal;
        if (winningSideTotal > 0) {
          payout = Math.round((p.stake / winningSideTotal) * distributablePot);
        }
      }

      p.payout = payout;
      p.result = result;

      userSummary[p.userId].payout += payout;

      const user = this.users.get(p.userId);
      if (user) {
        user.totalRounds += 1;
        if (result === 'WIN') {
          user.winningRounds += 1;
          user.virtualBalance += payout;
          user.totalProfit += (payout - p.stake);
          this.transactions.unshift({
            transactionId: `tx-win-${Date.now()}-${p.participationId}`,
            userId: p.userId,
            amount: payout,
            type: 'PAYOUT',
            roundId: round.roundId,
            timestamp: now,
            description: `Round #${round.roundNumber} Payout (${winningOption})`,
          });
        } else if (result === 'LOSS') {
          user.totalProfit -= p.stake;
        }
      }
    }

    for (const uId in userSummary) {
      userSummary[uId].netProfit = userSummary[uId].payout - userSummary[uId].stake;
    }

    this.lastResolution = {
      roundId: round.roundId,
      roundNumber: round.roundNumber,
      winningOption,
      yesTotal,
      noTotal,
      totalPot,
      rolloverAmountNext: nextRollover,
      userParticipations: userSummary,
    };

    // Create next 90-second round immediately
    const nextNumber = round.roundNumber + 1;
    this.currentRound = {
      roundId: `R-${nextNumber}`,
      roundNumber: nextNumber,
      startTime: now,
      endTime: now + ROUND_DURATION_MS,
      status: 'active',
      yesTotal: 0,
      noTotal: 0,
      totalPot: nextRollover,
      winningOption: null,
      rolloverAmount: nextRollover,
      platformFee: 0,
      distributablePot: 0,
    };
    this.markets.push(this.currentRound);

    this.broadcast({
      type: 'ROUND_RESOLVED',
      resolution: this.lastResolution,
      nextRound: this.getPublicRoundData(),
    });
  }

  placeStake(userId: string, option: 'YES' | 'NO', stakeAmount: number): { success: boolean; error?: string } {
    if (this.currentRound.status !== 'active') {
      return { success: false, error: 'Current market is not active.' };
    }
    if (stakeAmount <= 0) {
      return { success: false, error: 'Stake must be greater than ₦0.' };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }
    if (user.virtualBalance < stakeAmount) {
      return { success: false, error: 'Insufficient virtual credits.' };
    }

    const now = Date.now();
    user.virtualBalance -= stakeAmount;

    if (option === 'YES') {
      this.currentRound.yesTotal += stakeAmount;
    } else {
      this.currentRound.noTotal += stakeAmount;
    }
    this.currentRound.totalPot = this.currentRound.yesTotal + this.currentRound.noTotal + (this.currentRound.rolloverAmount || 0);

    const newPart: ParticipationRecord = {
      participationId: `part-${now}-${userId}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      roundId: this.currentRound.roundId,
      selectedOption: option,
      stake: stakeAmount,
      payout: 0,
      result: 'PENDING',
      timestamp: now,
      username: user.username,
      avatar: user.avatar,
    };
    this.participations.push(newPart);

    this.transactions.unshift({
      transactionId: `tx-stake-${now}-${userId}`,
      userId,
      amount: -stakeAmount,
      type: 'STAKE',
      roundId: this.currentRound.roundId,
      timestamp: now,
      description: `Round #${this.currentRound.roundNumber} Stake on ${option}`,
    });

    const feedItem: LiveFeedItem = {
      id: newPart.participationId,
      username: user.username,
      avatar: user.avatar,
      option,
      stake: stakeAmount,
      timestamp: now,
    };
    this.liveFeed.unshift(feedItem);
    if (this.liveFeed.length > 20) this.liveFeed.pop();

    this.broadcast({
      type: 'STAKE_PLACED',
      round: this.getPublicRoundData(),
      feedItem,
      userId,
      newBalance: user.virtualBalance,
    });

    return { success: true };
  }

  simulateBotBet() {
    if (this.currentRound.status !== 'active') return;
    const now = Date.now();
    const remainingSecs = Math.max(0, Math.floor((this.currentRound.endTime - now) / 1000));
    if (remainingSecs <= 3) return; // Freeze bets in final 3 seconds

    const bots = Array.from(this.users.values()).filter(u => u.isSimulated);
    if (bots.length === 0) return;

    // Fast activity: 1-2 bot stakes per second
    const count = Math.random() > 0.35 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)];
      const side: 'YES' | 'NO' = Math.random() > 0.48 ? 'YES' : 'NO';
      const stakeAmounts = [1000, 2500, 5000, 10000, 15000, 25000];
      const stake = stakeAmounts[Math.floor(Math.random() * stakeAmounts.length)];

      if (bot.virtualBalance < stake) {
        bot.virtualBalance += 50000;
      }
      this.placeStake(bot.userId, side, stake);
    }
  }

  getPublicRoundData() {
    const now = Date.now();
    return {
      roundId: this.currentRound.roundId,
      roundNumber: this.currentRound.roundNumber,
      startTime: this.currentRound.startTime,
      endTime: this.currentRound.endTime,
      status: this.currentRound.status,
      yesTotal: this.currentRound.yesTotal,
      noTotal: this.currentRound.noTotal,
      totalPot: this.currentRound.totalPot,
      rolloverAmount: this.currentRound.rolloverAmount,
      timeRemaining: Math.max(0, Math.floor((this.currentRound.endTime - now) / 1000)),
      serverTime: now,
    };
  }

  broadcast(message: any) {
    const dataStr = `data: ${JSON.stringify(message)}\n\n`;
    for (const res of this.sseClients) {
      try {
        res.write(dataStr);
      } catch {
        this.sseClients.delete(res);
      }
    }

    const wsStr = JSON.stringify(message);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(wsStr);
        } catch {
          // ignore dead ws
        }
      }
    });
  }
}

const engine = new MarketEngine();

// REST API Endpoints
app.get('/api/market/state', (req, res) => {
  const userId = (req.query.userId as string) || 'user_main';
  const username = req.query.username as string | undefined;
  const avatar = req.query.avatar as string | undefined;

  const user = engine.getOrCreateUser(userId, username, avatar);
  const userParts = engine.participations.filter(p => p.roundId === engine.currentRound.roundId && p.userId === userId);
  const userPastParts = engine.participations.filter(p => p.userId === userId).slice(-30).reverse();
  const userTxs = engine.transactions.filter(t => t.userId === userId).slice(-30);

  const pastMarkets = engine.markets
    .filter(m => m.status !== 'active')
    .slice(-10)
    .reverse();

  const leaderboard = Array.from(engine.users.values())
    .map(u => ({
      userId: u.userId,
      username: u.username,
      avatar: u.avatar,
      virtualBalance: u.virtualBalance,
      totalProfit: u.totalProfit,
      totalRounds: u.totalRounds,
      winningRounds: u.winningRounds,
      winRate: u.totalRounds > 0 ? Math.round((u.winningRounds / u.totalRounds) * 100) : 0,
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .map((u, idx) => ({ ...u, rank: idx + 1, isCurrentUser: u.userId === userId }));

  res.json({
    round: engine.getPublicRoundData(),
    user,
    userCurrentParticipations: userParts,
    userHistory: {
      participations: userPastParts,
      transactions: userTxs,
    },
    leaderboard,
    pastMarkets,
    liveFeed: engine.liveFeed,
    allUsers: Array.from(engine.users.values()),
    lastResolution: engine.lastResolution,
  });
});

app.post('/api/market/stake', (req, res) => {
  const { userId, option, stakeAmount, username, avatar } = req.body;
  if (!userId || !option || !stakeAmount) {
    return res.status(400).json({ success: false, error: 'Missing parameters.' });
  }

  engine.getOrCreateUser(userId, username, avatar);
  const result = engine.placeStake(userId, option, Number(stakeAmount));
  res.json(result);
});

// Update guest / anonymous profile handle and avatar
app.post('/api/market/profile', (req, res) => {
  const { userId, username, avatar } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }

  let user = engine.users.get(userId);
  if (!user) {
    user = engine.getOrCreateUser(userId, username, avatar);
  } else {
    if (username && typeof username === 'string' && username.trim().length > 0) {
      user.username = username.trim().slice(0, 24);
    }
    if (avatar && typeof avatar === 'string') {
      user.avatar = avatar;
    }
  }

  return res.json({ success: true, user });
});

// SSE Real-Time Stream for instant sub-second broadcast across all devices
app.get('/api/market/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  engine.sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', serverTime: Date.now() })}\n\n`);

  req.on('close', () => {
    engine.sseClients.delete(res);
  });
});

// Vite mounting
async function startServer() {
  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : undefined;
  const PORT = portFromArg || (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  VITE v6.1.1  ready in 180 ms\n\n  ➜  Local:   http://localhost:${PORT}/\n  ➜  Network: http://0.0.0.0:${PORT}/\n`);
    console.log(`guagr multiplayer server running on http://0.0.0.0:${PORT} (90s rounds)`);
  });
}

startServer();
