import React, { useState } from 'react';
import { MarketProvider, useMarket } from './context/MarketContext';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { MarketScreen } from './components/market/MarketScreen';
import { LeaderboardScreen } from './components/leaderboard/LeaderboardScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { ResolutionModal } from './components/market/ResolutionModal';
import { NotificationsModal } from './components/NotificationsModal';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('market');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const {
    hasUserParticipated,
    notifications,
    markAllNotificationsAsRead,
    clearAllNotifications,
  } = useMarket();

  return (
    <div className="min-h-screen bg-[#eef2f6] text-slate-900 flex flex-col items-center justify-start antialiased selection:bg-blue-500/20 selection:text-blue-600">
      {/* Mobile-first centered frame */}
      <div className="relative z-10 w-full max-w-lg min-h-screen flex flex-col bg-[#f4f6fa] shadow-xl sm:border-x sm:border-slate-200">
        {/* Top Header with improved guagr logo and actual notifications button */}
        <Header
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* Main Body Content: Profile, Home (Market), Leaderboard */}
        <main className="flex-1 px-4 py-2 overflow-y-auto">
          {currentTab === 'market' && <MarketScreen />}
          {currentTab === 'profile' && <ProfileScreen />}
          {currentTab === 'leaderboard' && <LeaderboardScreen />}
        </main>

        {/* 3 Bottom Navigation buttons: Profile (left), Home (middle), Leaderboard (right) */}
        <BottomNav
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          hasActiveStake={hasUserParticipated}
        />

        {/* Resolution Reveal Modal */}
        <ResolutionModal />

        {/* Actual Notifications Modal */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={markAllNotificationsAsRead}
          onClearAll={clearAllNotifications}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MarketProvider>
      <AppContent />
    </MarketProvider>
  );
}
