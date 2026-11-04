import React, { useState } from 'react';
import { useMarket } from '../../context/MarketContext';
import { Clock, ArrowUpRight, ArrowDownRight, RotateCw, History } from 'lucide-react';

type ActivityFilter = 'ALL' | 'WINS' | 'LOSSES';

export const ActivityScreen: React.FC = () => {
  const { getUserHistory, pastRounds } = useMarket();
  const [filter, setFilter] = useState<ActivityFilter>('ALL');

  const { participations } = getUserHistory();

  const formatCredits = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filtered = participations.filter(p => {
    if (filter === 'WINS') return p.result === 'WIN';
    if (filter === 'LOSSES') return p.result === 'LOSS';
    return true;
  });

  return (
    <div className="pb-28 pt-2 text-slate-800">
      {/* Header */}
      <div className="flex flex-col gap-2.5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Portfolio & Activity</h2>
          <p className="text-xs text-slate-500">
            Review your past market predictions and payouts
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({participations.length})
          </button>
          <button
            onClick={() => setFilter('WINS')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              filter === 'WINS'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            Wins ({participations.filter(p => p.result === 'WIN').length})
          </button>
          <button
            onClick={() => setFilter('LOSSES')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              filter === 'LOSSES'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-500 hover:text-rose-600'
            }`}
          >
            Losses ({participations.filter(p => p.result === 'LOSS').length})
          </button>
        </div>
      </div>

      {/* Activity Cards List */}
      <div className="mt-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
            <History className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <div className="text-sm font-bold text-slate-800">No activity yet</div>
            <p className="mt-1 text-xs text-slate-500">
              {filter === 'ALL'
                ? 'Take a position in the active 5-minute round to begin.'
                : `No ${filter.toLowerCase()} recorded in your history.`}
            </p>
          </div>
        ) : (
          filtered.map(p => {
            const roundData = pastRounds.find(r => r.roundId === p.roundId);
            const winningOpt = roundData?.winningOption || (p.result === 'WIN' ? p.selectedOption : '---');
            const netProfit = p.result === 'WIN' ? p.payout - p.stake : -p.stake;

            return (
              <div
                key={p.participationId}
                className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {p.roundId}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {formatTime(p.timestamp)}
                    </span>
                  </div>

                  {/* Outcome Tag */}
                  <div>
                    {p.result === 'WIN' ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 text-xs font-bold font-mono border border-emerald-200">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        WON
                      </span>
                    ) : p.result === 'LOSS' ? (
                      <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 text-xs font-bold font-mono border border-rose-200">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                        LOST
                      </span>
                    ) : p.result === 'ROLLOVER' ? (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 text-xs font-bold font-mono border border-amber-200">
                        <RotateCw className="h-3.5 w-3.5" />
                        ROLLOVER
                      </span>
                    ) : (
                      <span className="text-amber-600 text-xs font-bold font-mono animate-pulse">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Your Side</span>
                    <span
                      className={`font-mono font-bold ${
                        p.selectedOption === 'YES' ? 'text-[#0080ff]' : 'text-[#e11d48]'
                      }`}
                    >
                      {p.selectedOption}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Winning Side</span>
                    <span className="font-mono font-bold text-slate-800">
                      {winningOpt}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Stake</span>
                    <span className="font-mono text-slate-800 font-semibold tabular-nums">
                      ₦{formatCredits(p.stake)}
                    </span>
                  </div>
                </div>

                {/* Net PnL row */}
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <span className="text-slate-400 text-[11px] font-medium">Net Profit / Loss</span>
                  <div className="text-right">
                    {p.result === 'PENDING' ? (
                      <span className="text-slate-400 font-mono text-xs">In play</span>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        {p.result === 'WIN' && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Payout: ₦{formatCredits(p.payout)}
                          </span>
                        )}
                        <span
                          className={`font-mono text-sm font-bold tabular-nums ${
                            netProfit > 0
                              ? 'text-emerald-600'
                              : netProfit < 0
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {netProfit > 0 ? `+₦${formatCredits(netProfit)}` : `₦${formatCredits(netProfit)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
