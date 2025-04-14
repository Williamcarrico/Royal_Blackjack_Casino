'use client';

// Import specific icons individually instead of importing the entire library
import {
    GiCoins,
    GiDiamonds,
    GiBallGlow,
    GiInfo,
    GiPerson,
    GiCrown,
    GiMoneyStack,
    GiCardAceSpades,
    GiCardAceClubs,
    GiCardAceHearts,
    GiPokerHand,
    GiRollingDices,
    GiCoinsPile,
    GiGoldBar,
    GiCardRandom,
    GiBrain,
    GiDiamondHard,
    GiHamburgerMenu
} from 'react-icons/gi';

// Re-export all icons
export {
    GiCoins,
    GiDiamonds,
    GiBallGlow,
    GiInfo,
    GiPerson,
    GiCrown,
    GiMoneyStack,
    GiCardAceSpades,
    GiCardAceClubs,
    GiCardAceHearts,
    GiPokerHand,
    GiRollingDices,
    GiCoinsPile,
    GiGoldBar,
    GiCardRandom,
    GiBrain,
    GiDiamondHard,
    GiHamburgerMenu
};

// Create a mapping for easy reference
export const IconMap = {
    coins: GiCoins,
    diamonds: GiDiamonds,
    ball: GiBallGlow,
    info: GiInfo,
    person: GiPerson,
    crown: GiCrown,
    moneyStack: GiMoneyStack,
    aceSpades: GiCardAceSpades,
    aceClubs: GiCardAceClubs,
    aceHearts: GiCardAceHearts,
    pokerHand: GiPokerHand,
    dice: GiRollingDices,
    rollingDices: GiRollingDices,
    coinsPile: GiCoinsPile,
    goldBar: GiGoldBar,
    cardRandom: GiCardRandom,
    brain: GiBrain,
    diamondHard: GiDiamondHard,
    menu: GiHamburgerMenu
};

// Helper function to get the icon by name
export function getIconByName(name: keyof typeof IconMap) {
    return IconMap[name];
}