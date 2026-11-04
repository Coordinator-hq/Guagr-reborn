import React from 'react';
import { User, Home, Trophy } from 'lucide-react';

export type NavTab = 'profile' | 'market' | 'leaderboard';

interface BottomNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  hasActiveStake?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab, hasActiveStake }) => {
  // Ordered strictly as requested:
  // Profile on the left, Home in the middle, Leaderboard on the right
  const tabs = [
    { id: 'profile' as NavTab, label: 'Profile', icon: User },
    { id: 'market' as NavTab, label: 'Home', icon: Home, hasDot: hasActiveStake },
    { id: 'leaderboard' as NavTab, label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/90 bg-white/95 backdrop-blur-md pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around px-6 py-2.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isHome = tab.id === 'market';

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'text-[#0066ff] font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                {isHome ? (
                  /* Highlighted central Home button */
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                      isActive
                        ? 'bg-[#0066ff] text-white shadow-md shadow-blue-500/25 scale-105'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="h-5 w-5 stroke-[2.5]" />
                  </div>
                ) : (
                  <Icon
                    className={`h-5 w-5 transition-transform ${
                      isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                    }`}
                  />
                )}

                {tab.hasDot && !isHome && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#0066ff] ring-2 ring-white" />
                )}
              </div>
              <span className={`mt-1 text-[11px] tracking-tight ${isHome && isActive ? 'font-bold text-[#0066ff]' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
