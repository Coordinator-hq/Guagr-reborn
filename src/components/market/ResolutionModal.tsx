import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useMarket } from '../../context/MarketContext';
import { Trophy, ArrowRight, TrendingUp, ShieldAlert, RotateCw } from 'lucide-react';

export const ResolutionModal: React.FC = () => {
  const { resolutionSummary, closeResolutionModal, currentRound } = useMarket();

  useEffect(() => {
    if (resolutionSummary && resolutionSummary.payout > 0) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0062ff', '#10b981', '#34d399', '#fbbf24'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [resolutionSummary]);

  if (!resolutionSummary) return null;

  const {
    roundNumber,
    winningOption,
    yesTotal,
    noTotal,
    totalPot,
    userParticipations,
    rolloverAmountNext,
    payout,
    netProfit,
  } = resolutionSummary;

  const isTie = winningOption === 'TIE';
  const hasUserPlayed = userParticipations && userParticipations.length > 0;
  const isUserWinner = payout > 0;
  const totalUserStake = userParticipations?.reduce((sum, p) => sum + p.stake, 0) || 0;

  const formatCredits = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const winningTotal = winningOption === 'YES' ? yesTotal : noTotal;
  const losingTotal = winningOption === 'YES' ? noTotal : yesTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl text-slate-800">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center">
          {isTie ? (
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-500">
              <RotateCw className="h-7 w-7 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          ) : isUserWinner ? (
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-500">
              <Trophy className="h-7 w-7 text-emerald-500" />
            </div>
          ) : hasUserPlayed ? (
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-500">
              <ShieldAlert className="h-7 w-7 text-rose-500" />
            </div>
          ) : (
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-[#0062ff]">
              <TrendingUp className="h-7 w-7" />
            </div>
          )}

          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Round #{roundNumber} Resolved
          </span>

          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {isTie
              ? 'Equal Stakes: Pot Rollover!'
              : winningOption === 'YES'
              ? 'YES Attracted Most Money'
              : 'NO Attracted Most Money'}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {isTie
              ? 'Both YES and NO wagered identical capital. 100% of the pot rolls over.'
              : `${winningOption} won with ₦${formatCredits(winningTotal)} vs ₦${formatCredits(losingTotal)}.`}
          </p>
        </div>

        {/* User Result Section */}
        {hasUserPlayed ? (
          <div className={`mt-4 rounded-2xl p-3.5 border ${
            isTie
              ? 'bg-amber-50/70 border-amber-200'
              : isUserWinner
              ? 'bg-emerald-50/80 border-emerald-200'
              : 'bg-rose-50/70 border-rose-200'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Your Wager</span>
              <span className="font-bold text-slate-800">
                {userParticipations.map(p => `${p.selectedOption}: ₦${formatCredits(p.stake)}`).join(' · ')}
              </span>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Your Outcome</span>
              <div className="text-right">
                {isTie ? (
                  <span className="font-mono text-sm font-bold text-amber-600">
                    Rolled Over
                  </span>
                ) : isUserWinner ? (
                  <div>
                    <span className="font-mono text-base font-extrabold text-emerald-600 tabular-nums">
                      +₦{formatCredits(netProfit)}
                    </span>
                    <div className="text-[10px] text-emerald-700 font-mono">
                      Payout: ₦{formatCredits(payout)}
                    </div>
                  </div>
                ) : (
                  <span className="font-mono text-base font-bold text-rose-600 tabular-nums">
                    -₦{formatCredits(totalUserStake)}
                  </span>
                )}
              </div>
            </div>

            {isUserWinner && winningTotal > 0 && (
              <div className="mt-2 rounded-xl bg-white px-2.5 py-1 text-[10px] text-emerald-700 font-mono text-center border border-emerald-200/60">
                Proportional share of 90% pool credited to your balance
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
            You did not participate in Round #{roundNumber}. Next 90s round is active!
          </div>
        )}

        {/* Financial Breakdown */}
        <div className="mt-3.5 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>YES Total:</span>
            <span className="font-mono text-slate-800 tabular-nums font-semibold">
              ₦{formatCredits(yesTotal)}
            </span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>NO Total:</span>
            <span className="font-mono text-slate-800 tabular-nums font-semibold">
              ₦{formatCredits(noTotal)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-800 font-bold">
            <span>Total Pot Resolved:</span>
            <span className="font-mono text-slate-900 tabular-nums">
              ₦{formatCredits(totalPot)}
            </span>
          </div>
          {rolloverAmountNext > 0 && (
            <div className="flex justify-between text-amber-700 text-[11px] font-bold pt-1">
              <span>Rollover to Next Round:</span>
              <span className="font-mono tabular-nums">
                +₦{formatCredits(rolloverAmountNext)}
              </span>
            </div>
          )}
        </div>

        {/* Action Button: Continue into Current Round */}
        <button
          onClick={closeResolutionModal}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0062ff] py-3.5 text-sm font-bold text-white hover:bg-blue-600 active:scale-98 transition-all shadow-md shadow-blue-500/20"
        >
          <span>Enter Round #{currentRound?.roundNumber || roundNumber + 1}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
