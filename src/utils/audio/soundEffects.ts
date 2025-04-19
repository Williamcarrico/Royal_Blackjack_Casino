/**
 * Sound effect categories and definitions
 */

export enum SoundCategory {
    UI = 'ui',
    GAME = 'game',
    CARDS = 'cards',
    CHIPS = 'chips',
    DEALER = 'dealer',
    AMBIENT = 'ambient'
}

// Define the sound effect keys as a union type
export type SoundEffect =
    // UI sounds
    'buttonClick' | 'buttonHover' | 'menuOpen' | 'menuClose' | 'notification' |
    // Card sounds
    'cardDeal' | 'cardFlip' | 'cardSlide' | 'shuffle' |
    // Chip sounds
    'chipStack' | 'chipPlace' | 'chipCollect' | 'chipRattle' |
    // Game sounds
    'win' | 'lose' | 'push' | 'blackjack' | 'bust' |
    // Dealer sounds
    'dealerTalk1' | 'dealerTalk2' | 'dealerLaugh' |
    // Ambient sounds
    'crowdBg' | 'musicBg';

// Sound effect definitions
interface SoundEffectData {
    name: string;
    src: string;
    category: SoundCategory;
}

// Map of all sound effects
export const soundEffects: Record<SoundEffect, SoundEffectData> = {
    // UI sounds
    buttonClick: {
        name: 'Button Click',
        src: '/audio/ui/button-click.mp3',
        category: SoundCategory.UI
    },
    buttonHover: {
        name: 'Button Hover',
        src: '/audio/ui/button-hover.mp3',
        category: SoundCategory.UI
    },
    menuOpen: {
        name: 'Menu Open',
        src: '/audio/ui/menu-open.mp3',
        category: SoundCategory.UI
    },
    menuClose: {
        name: 'Menu Close',
        src: '/audio/ui/menu-close.mp3',
        category: SoundCategory.UI
    },
    notification: {
        name: 'Notification',
        src: '/audio/ui/notification.mp3',
        category: SoundCategory.UI
    },

    // Card sounds
    cardDeal: {
        name: 'Card Deal',
        src: '/audio/cards/card-deal.mp3',
        category: SoundCategory.CARDS
    },
    cardFlip: {
        name: 'Card Flip',
        src: '/audio/cards/card-flip.mp3',
        category: SoundCategory.CARDS
    },
    cardSlide: {
        name: 'Card Slide',
        src: '/audio/cards/card-slide.mp3',
        category: SoundCategory.CARDS
    },
    shuffle: {
        name: 'Shuffle',
        src: '/audio/cards/shuffle.mp3',
        category: SoundCategory.CARDS
    },

    // Chip sounds
    chipStack: {
        name: 'Chip Stack',
        src: '/audio/chips/chip-stack.mp3',
        category: SoundCategory.CHIPS
    },
    chipPlace: {
        name: 'Chip Place',
        src: '/audio/chips/chip-place.mp3',
        category: SoundCategory.CHIPS
    },
    chipCollect: {
        name: 'Chip Collect',
        src: '/audio/chips/chip-collect.mp3',
        category: SoundCategory.CHIPS
    },
    chipRattle: {
        name: 'Chip Rattle',
        src: '/audio/chips/chip-rattle.mp3',
        category: SoundCategory.CHIPS
    },

    // Game sounds
    win: {
        name: 'Win',
        src: '/audio/game/win.mp3',
        category: SoundCategory.GAME
    },
    lose: {
        name: 'Lose',
        src: '/audio/game/lose.mp3',
        category: SoundCategory.GAME
    },
    push: {
        name: 'Push',
        src: '/audio/game/push.mp3',
        category: SoundCategory.GAME
    },
    blackjack: {
        name: 'Blackjack',
        src: '/audio/game/blackjack.mp3',
        category: SoundCategory.GAME
    },
    bust: {
        name: 'Bust',
        src: '/audio/game/bust.mp3',
        category: SoundCategory.GAME
    },

    // Dealer sounds
    dealerTalk1: {
        name: 'Dealer Talk 1',
        src: '/audio/dealer/dealer-talk1.mp3',
        category: SoundCategory.DEALER
    },
    dealerTalk2: {
        name: 'Dealer Talk 2',
        src: '/audio/dealer/dealer-talk2.mp3',
        category: SoundCategory.DEALER
    },
    dealerLaugh: {
        name: 'Dealer Laugh',
        src: '/audio/dealer/dealer-laugh.mp3',
        category: SoundCategory.DEALER
    },

    // Ambient sounds
    crowdBg: {
        name: 'Crowd Background',
        src: '/audio/ambient/crowd-bg.mp3',
        category: SoundCategory.AMBIENT
    },
    musicBg: {
        name: 'Music Background',
        src: '/audio/ambient/music-bg.mp3',
        category: SoundCategory.AMBIENT
    }
};

// Maps each category to a list of sound IDs in that category
export const soundsByCategory: Record<SoundCategory, SoundEffect[]> = {
    [SoundCategory.CARDS]: ['cardDeal', 'cardSlide', 'cardFlip', 'shuffle'],
    [SoundCategory.CHIPS]: ['chipStack', 'chipPlace', 'chipCollect', 'chipRattle'],
    [SoundCategory.GAME]: ['win', 'lose', 'push', 'blackjack', 'bust'],
    [SoundCategory.DEALER]: ['dealerTalk1', 'dealerTalk2', 'dealerLaugh'],
    [SoundCategory.AMBIENT]: ['crowdBg', 'musicBg'],
    [SoundCategory.UI]: ['buttonClick', 'buttonHover', 'menuOpen', 'menuClose', 'notification']
};

// Default volume for sound categories
export const categoryVolumes: Record<SoundCategory, number> = {
    [SoundCategory.CARDS]: 0.7,
    [SoundCategory.CHIPS]: 0.8,
    [SoundCategory.GAME]: 1.0,
    [SoundCategory.DEALER]: 0.7,
    [SoundCategory.AMBIENT]: 0.5,
    [SoundCategory.UI]: 0.6
};

// Export specific sound effect constants for direct import
export const BUTTON_CLICK: SoundEffect = 'buttonClick';
export const WIN: SoundEffect = 'win';
export const ERROR: SoundEffect = 'alertError';
export const GAME_START: SoundEffect = 'ambienceCasino';