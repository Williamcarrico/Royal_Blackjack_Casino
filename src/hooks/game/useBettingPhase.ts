import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { GameStore as BaseGameStore, EnhancedSettingsStore as BaseEnhancedSettingsStore } from '@/types/storeTypes';

// Extend imported types to include the missing properties
interface GameStore extends BaseGameStore {
  gamePhase: string;
}

interface EnhancedSettingsStore extends BaseEnhancedSettingsStore {
  gameRules?: {
    insuranceAvailable: boolean;
  };
}

interface SideBetsStore {
  resetBets: () => void;
  setAvailableBet: (betType: string, available: boolean) => void;
  getTotalBetAmount: () => number;
  getBets: () => Array<{ type: string; amount: number }>;
  getAvailableBets: () => Record<string, boolean>;
}

export const useBettingPhase = (
  gameStore: GameStore,
  sideBetsStore: SideBetsStore,
  enhancedSettings: EnhancedSettingsStore
) => {
  const [showSideBets, setShowSideBets] = useState(false);
  const [sideBetTotalAmount, setSideBetTotalAmount] = useState(0);
  const [currentSideBets, setCurrentSideBets] = useState<Array<{ type: string; amount: number }>>([]);
  const [availableSideBets, setAvailableSideBets] = useState<Record<string, boolean>>({});

  // Helper function to determine if side bets should be enabled
  const shouldEnableSideBets = useCallback(() => {
    return gameStore.gamePhase === 'betting' && !showSideBets;
  }, [gameStore.gamePhase, showSideBets]);

  // Toggle side bets menu visibility
  const handleToggleSideBets = useCallback(() => {
    if (shouldEnableSideBets()) {
      setShowSideBets(true);
    } else {
      // Don't allow opening side bets outside betting phase
      toast.info("Side bets are only available during the betting phase");
    }
  }, [shouldEnableSideBets]);

  // Update side bets initialization
  useEffect(() => {
    if (showSideBets) {
      // Reset existing side bets
      sideBetsStore.resetBets();

      // Set available side bets based on game rules
      if (enhancedSettings.gameRules?.insuranceAvailable) {
        sideBetsStore.setAvailableBet('insurance', true);
      }

      // Enable standard side bets
      sideBetsStore.setAvailableBet('perfectPairs', true);
      sideBetsStore.setAvailableBet('21+3', true);
      sideBetsStore.setAvailableBet('luckyLadies', true);
    }
  }, [showSideBets, sideBetsStore, enhancedSettings.gameRules?.insuranceAvailable]);

  // Update side bet state from store
  useEffect(() => {
    // Track side bet total for UI updates
    const updateSideBetInfo = () => {
      const totalAmount = sideBetsStore.getTotalBetAmount();
      const bets = sideBetsStore.getBets();
      const available = sideBetsStore.getAvailableBets();

      setSideBetTotalAmount(totalAmount);
      setCurrentSideBets(bets);
      setAvailableSideBets(available);
    };

    // Initial update
    updateSideBetInfo();

    // Set up an interval to check for updates
    const interval = setInterval(updateSideBetInfo, 1000);

    return () => clearInterval(interval);
  }, [sideBetsStore]);

  // Update side bets status based on game phase
  useEffect(() => {
    // Reset side bets when entering a new betting round
    if (gameStore.gamePhase === 'betting') {
      // Only reset if we're starting a new betting round (not coming back from side bets menu)
      if (sideBetTotalAmount === 0) {
        sideBetsStore.resetBets();

        // Set up available side bets based on game rules
        if (enhancedSettings.gameRules?.insuranceAvailable) {
          sideBetsStore.setAvailableBet('insurance', true);
        }

        // Standard side bets that are always available
        sideBetsStore.setAvailableBet('perfectPairs', true);
        sideBetsStore.setAvailableBet('21+3', true);
        sideBetsStore.setAvailableBet('luckyLadies', true);
      }
    }
  }, [gameStore.gamePhase, sideBetTotalAmount, sideBetsStore, enhancedSettings.gameRules?.insuranceAvailable]);

  return {
    showSideBets,
    setShowSideBets,
    sideBetTotalAmount,
    setSideBetTotalAmount,
    currentSideBets,
    setCurrentSideBets,
    availableSideBets,
    setAvailableSideBets,
    handleToggleSideBets,
    shouldEnableSideBets
  };
};