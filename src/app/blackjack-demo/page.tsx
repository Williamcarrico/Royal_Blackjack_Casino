'use client';

import React, { useState } from 'react';
import BlackjackGameTable from '@/components/game/BlackjackGameTable';

export default function BlackjackDemoPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [_showSettings, setShowSettings] = useState(false);
  const [_showRules, setShowRules] = useState(false);

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    // In a real app, you would show a settings dialog here
    console.log('Opening settings modal');
  };

  const handleOpenRules = () => {
    setShowRules(true);
    // In a real app, you would show a rules dialog here
    console.log('Opening rules modal');
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      <BlackjackGameTable
        playerName="William Carrico"
        playerBalance={5000}
        tableVariant="green"
        onSettingsOpen={handleOpenSettings}
        onRulesOpen={handleOpenRules}
        onToggleSound={handleToggleSound}
        isSoundEnabled={soundEnabled}
        showSidebar={true}
      />
    </div>
  );
}