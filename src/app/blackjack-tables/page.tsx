'use client';

import React, { useState } from 'react';
import RealisticBlackjackTable from '@/components/game/table/RealisticBlackjackTable';
import { cn } from '@/lib/utils/utils';

const BlackjackTables = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="container mx-auto p-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4 cinzel-decorative-bold text-gradient-gold">
            Royal Blackjack Tables
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Elegant and realistic blackjack table designs with attention to detail
            in surface textures, wooden borders, and professional casino typography.
          </p>

          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                isDarkMode ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-300"
              )}
            >
              {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </button>
          </div>
        </header>

        <div className="space-y-16">
          {/* Green Premium Table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-8 text-amber-300">Green Premium Felt</h2>
            <div className="max-w-6xl mx-auto">
              <RealisticBlackjackTable
                variant="green"
                darkMode={isDarkMode}
                woodVariant="premium"
                brandLogo="/logo-casino-gold.svg"
              />
            </div>
          </section>

          {/* Red Premium Table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-8 text-amber-300">Red Premium Felt</h2>
            <div className="max-w-6xl mx-auto">
              <RealisticBlackjackTable
                variant="red"
                darkMode={isDarkMode}
                woodVariant="premium"
              />
            </div>
          </section>

          {/* Green Standard Table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-8 text-amber-300">Green Standard Wooden Border</h2>
            <div className="max-w-6xl mx-auto">
              <RealisticBlackjackTable
                variant="green"
                darkMode={isDarkMode}
                woodVariant="standard"
              />
            </div>
          </section>

          {/* Red Standard Table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-8 text-amber-300">Red Standard Wooden Border</h2>
            <div className="max-w-6xl mx-auto">
              <RealisticBlackjackTable
                variant="red"
                darkMode={isDarkMode}
                woodVariant="standard"
              />
            </div>
          </section>
        </div>

        <footer className="mt-16 text-center text-sm text-slate-400 py-8">
          <p>Royal Casino Blackjack Tables &copy; {new Date().getFullYear()}</p>
          <p className="mt-2">Premium casino tables with realistic textures and professional design</p>
        </footer>
      </div>
    </div>
  );
};

export default BlackjackTables;