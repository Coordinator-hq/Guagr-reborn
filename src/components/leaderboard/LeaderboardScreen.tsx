import React, { useState } from 'react';
import { useMarket } from '../../context/MarketContext';
import { LeaderboardTimeframe } from '../../types/market';
import { Trophy, Medal, Award, TrendingUp, Target } from 'lucide-react';

export const LeaderboardScreen: React.FC = () => {
  const { getLeaderboard, currentUser } = useMarket();
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('all-time');

  const leaderboard = getLeaderboard(timeframe);
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  const currentUserEntry = leaderboard.find(e => e.isCurrentUser);
  const isCurrentUserInTopThree = currentUserEntry && currentUserEntry.rank <= 3;

  const formatCredits = (num: number) => new Intl.NumberFormat('en-US').format(num);

  return (
    <div className="pb-28 pt-2 text-slate-800">
      {/* Header & Category Switcher */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Leaderboard</h2>
            <p className="text-xs text-slate-500">
              Ranked by cumulative net profit in virtual credits
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-500">
            <Trophy className="h-5 w-5" />
          </div>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          {(['all-time', 'weekly', 'daily'] as LeaderboardTimeframe[]).map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-all ${
                timeframe === t
                  ? 'bg-white text-[#0080ff] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      <div className="mt-5 grid grid-cols-3 gap-2 items-end">
        {/* Rank 2 */}
        {topThree[1] && (
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-xs">
            <div className="relative mb-2">
              <div className="h-12 w-12 rounded-full border-2 border-slate-300 overflow-hidden bg-slate-100">
                <img
                  src={topThree[1].avatar}
                  alt={topThree[1].username}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-900 text-[10px] font-black">
                2
              </div>
            </div>
            <div className="font-bold text-xs text-slate-800 truncate w-full">
              {topThree[1].username}
            </div>
            <div className="font-mono text-xs font-bold text-emerald-600 tabular-nums mt-0.5">
              +₦{formatCredits(topThree[1].totalProfit)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {topThree[1].winRate}% WR
            </div>
          </div>
        )}

        {/* Rank 1 (Gold Champion) */}
        {topThree[0] && (
          <div className="flex flex-col items-center rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/60 to-white p-3.5 text-center shadow-md relative -translate-y-2">
            <div className="absolute -top-3 flex items-center justify-center rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-slate-900 shadow">
              <Trophy className="h-2.5 w-2.5 mr-1" /> #1 TRADER
            </div>
            <div className="relative mb-2 mt-1">
              <div className="h-14 w-14 rounded-full border-2 border-amber-400 overflow-hidden bg-slate-100 ring-4 ring-amber-200/50">
                <img
                  src={topThree[0].avatar}
                  alt={topThree[0].username}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                1
              </div>
            </div>
            <div className="font-bold text-xs text-slate-900 truncate w-full">
              {topThree[0].username}
            </div>
            <div className="font-mono text-sm font-extrabold text-[#0080ff] tabular-nums mt-0.5">
              +₦{formatCredits(topThree[0].totalProfit)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {topThree[0].winRate}% Win Rate · {topThree[0].winningRounds}W
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {topThree[2] && (
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-xs">
            <div className="relative mb-2">
              <div className="h-12 w-12 rounded-full border-2 border-amber-600/40 overflow-hidden bg-slate-100">
                <img
                  src={topThree[2].avatar}
                  alt={topThree[2].username}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white text-[10px] font-black">
                3
              </div>
            </div>
            <div className="font-bold text-xs text-slate-800 truncate w-full">
              {topThree[2].username}
            </div>
            <div className="font-mono text-xs font-bold text-emerald-600 tabular-nums mt-0.5">
              +₦{formatCredits(topThree[2].totalProfit)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {topThree[2].winRate}% WR
            </div>
          </div>
        )}
      </div>

      {/* REMAINING RANKINGS */}
      <div className="mt-5 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Rankings
        </span>

        <div className="space-y-1.5">
          {remaining.map(entry => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between rounded-2xl border p-3 transition-colors ${
                entry.isCurrentUser
                  ? 'border-blue-300 bg-blue-50/60 shadow-xs'
                  : 'border-slate-200/90 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-slate-400 w-6 text-center">
                  #{entry.rank}
                </span>

                <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={entry.avatar}
                    alt={entry.username}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">
                      {entry.username}
                    </span>
                    {entry.isCurrentUser && (
                      <span className="text-[10px] font-bold text-[#0080ff] bg-blue-100 px-1.5 py-0.2 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>{entry.winningRounds} wins</span>
                    <span>·</span>
                    <span>{entry.winRate}% win rate</span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="text-right">
                <div
                  className={`font-mono text-xs font-bold tabular-nums ${
                    entry.totalProfit > 0
                      ? 'text-emerald-600'
                      : entry.totalProfit < 0
                      ? 'text-rose-600'
                      : 'text-slate-400'
                  }`}
                >
                  {entry.totalProfit > 0 ? `+₦${formatCredits(entry.totalProfit)}` : `₦${formatCredits(entry.totalProfit)}`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  ₦{formatCredits(entry.virtualBalance)} bal
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PINNED CURRENT USER POSITION IF OUTSIDE TOP THREE */}
      {!isCurrentUserInTopThree && currentUserEntry && (
        <div className="fixed bottom-16 left-0 right-0 z-20 px-4">
          <div className="mx-auto max-w-lg rounded-2xl border-2 border-[#0080ff] bg-white p-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0080ff] text-white font-black text-xs">
                  #{currentUserEntry.rank}
                </div>
                <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={currentUserEntry.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <span>Your Standing</span>
                    <span className="text-[10px] font-normal text-slate-400">(Rank #{currentUserEntry.rank})</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUserEntry.winRate}% Win Rate · {currentUserEntry.winningRounds} Wins
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`font-mono text-sm font-bold tabular-nums ${
                    currentUserEntry.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {currentUserEntry.totalProfit >= 0 ? `+₦${formatCredits(currentUserEntry.totalProfit)}` : `₦${formatCredits(currentUserEntry.totalProfit)}`}
                </div>
                <span className="text-[10px] text-slate-400">Net Profit</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
