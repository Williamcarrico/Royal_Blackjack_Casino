/**
 * Sound Effects definitions for the Blackjack game
 */

export type SoundCategory =
    | 'cards'
    | 'chips'
    | 'buttons'
    | 'win'
    | 'lose'
    | 'ui'
    | 'ambience'
    | 'alerts';

export type SoundEffect =
    // Card sounds
    | 'cardDeal'
    | 'cardSlide'
    | 'cardFlip'
    | 'cardShuffle'
    | 'cardRiff'
    | 'deckCut'

    // Chip sounds
    | 'chipSingle'
    | 'chipStack'
    | 'chipToss'
    | 'betPlaced'
    | 'betCollect'
    | 'betPush'

    // Game outcome sounds
    | 'win'
    | 'winSmall'
    | 'winMedium'
    | 'winLarge'
    | 'winBlackjack'
    | 'lose'
    | 'push'
    | 'bust'

    // UI sounds
    | 'buttonClick'
    | 'buttonHover'
    | 'menuOpen'
    | 'menuClose'
    | 'timerTick'
    | 'timerExpire'

    // Action sounds
    | 'hit'
    | 'stand'
    | 'double'
    | 'split'
    | 'insurance'
    | 'surrender'

    // Alert sounds
    | 'alert'
    | 'alertError'
    | 'alertSuccess'
    | 'alertInfo'

    // Ambient sounds
    | 'ambienceCasino'
    | 'ambienceNight'
    | 'ambienceJazz';

export interface SoundData {
    src: string;
    name: string;
    category: SoundCategory;
    volume?: number;
    playbackRate?: number;
}

export const soundEffects: Record<SoundEffect, SoundData> = {
    // Card sounds
    cardDeal: {
        src: '/audio/cards/card_deal.mp3',
        name: 'Card Deal',
        category: 'cards'
    },
    cardSlide: {
        src: '/audio/cards/card_slide.mp3',
        name: 'Card Slide',
        category: 'cards'
    },
    cardFlip: {
        src: '/audio/cards/card_flip.mp3',
        name: 'Card Flip',
        category: 'cards'
    },
    cardShuffle: {
        src: '/audio/cards/card_shuffle.mp3',
        name: 'Card Shuffle',
        category: 'cards'
    },
    cardRiff: {
        src: '/audio/cards/card_riff.mp3',
        name: 'Card Riff',
        category: 'cards'
    },
    deckCut: {
        src: '/audio/cards/deck_cut.mp3',
        name: 'Deck Cut',
        category: 'cards'
    },

    // Chip sounds
    chipSingle: {
        src: '/audio/chips/chip_single.mp3',
        name: 'Chip Single',
        category: 'chips'
    },
    chipStack: {
        src: '/audio/chips/chip_stack.mp3',
        name: 'Chip Stack',
        category: 'chips'
    },
    chipToss: {
        src: '/audio/chips/chip_toss.mp3',
        name: 'Chip Toss',
        category: 'chips'
    },
    betPlaced: {
        src: '/audio/chips/bet_placed.mp3',
        name: 'Bet Placed',
        category: 'chips'
    },
    betCollect: {
        src: '/audio/chips/bet_collect.mp3',
        name: 'Bet Collect',
        category: 'chips'
    },
    betPush: {
        src: '/audio/chips/bet_push.mp3',
        name: 'Bet Push',
        category: 'chips'
    },

    // Game outcome sounds
    win: {
        src: '/audio/outcomes/win.mp3',
        name: 'Win',
        category: 'win'
    },
    winSmall: {
        src: '/audio/outcomes/win_small.mp3',
        name: 'Win Small',
        category: 'win'
    },
    winMedium: {
        src: '/audio/outcomes/win_medium.mp3',
        name: 'Win Medium',
        category: 'win'
    },
    winLarge: {
        src: '/audio/outcomes/win_large.mp3',
        name: 'Win Large',
        category: 'win'
    },
    winBlackjack: {
        src: '/audio/outcomes/win_blackjack.mp3',
        name: 'Blackjack',
        category: 'win'
    },
    lose: {
        src: '/audio/outcomes/lose.mp3',
        name: 'Lose',
        category: 'lose'
    },
    push: {
        src: '/audio/outcomes/push.mp3',
        name: 'Push',
        category: 'ui'
    },
    bust: {
        src: '/audio/outcomes/bust.mp3',
        name: 'Bust',
        category: 'lose'
    },

    // UI sounds
    buttonClick: {
        src: '/audio/ui/button_click.mp3',
        name: 'Button Click',
        category: 'ui'
    },
    buttonHover: {
        src: '/audio/ui/button_hover.mp3',
        name: 'Button Hover',
        category: 'ui',
        volume: 0.5
    },
    menuOpen: {
        src: '/audio/ui/menu_open.mp3',
        name: 'Menu Open',
        category: 'ui'
    },
    menuClose: {
        src: '/audio/ui/menu_close.mp3',
        name: 'Menu Close',
        category: 'ui'
    },
    timerTick: {
        src: '/audio/ui/timer_tick.mp3',
        name: 'Timer Tick',
        category: 'ui',
        volume: 0.4
    },
    timerExpire: {
        src: '/audio/ui/timer_expire.mp3',
        name: 'Timer Expire',
        category: 'ui'
    },

    // Action sounds
    hit: {
        src: '/audio/actions/hit.mp3',
        name: 'Hit',
        category: 'ui'
    },
    stand: {
        src: '/audio/actions/stand.mp3',
        name: 'Stand',
        category: 'ui'
    },
    double: {
        src: '/audio/actions/double.mp3',
        name: 'Double',
        category: 'ui'
    },
    split: {
        src: '/audio/actions/split.mp3',
        name: 'Split',
        category: 'ui'
    },
    insurance: {
        src: '/audio/actions/insurance.mp3',
        name: 'Insurance',
        category: 'ui'
    },
    surrender: {
        src: '/audio/actions/surrender.mp3',
        name: 'Surrender',
        category: 'ui'
    },

    // Alert sounds
    alert: {
        src: '/audio/alerts/alert.mp3',
        name: 'Alert',
        category: 'alerts'
    },
    alertError: {
        src: '/audio/alerts/alert_error.mp3',
        name: 'Alert Error',
        category: 'alerts'
    },
    alertSuccess: {
        src: '/audio/alerts/alert_success.mp3',
        name: 'Alert Success',
        category: 'alerts'
    },
    alertInfo: {
        src: '/audio/alerts/alert_info.mp3',
        name: 'Alert Info',
        category: 'alerts'
    },

    // Ambient sounds
    ambienceCasino: {
        src: '/audio/ambience/ambience_casino.mp3',
        name: 'Casino Ambience',
        category: 'ambience'
    },
    ambienceNight: {
        src: '/audio/ambience/ambience_night.mp3',
        name: 'Night Ambience',
        category: 'ambience'
    },
    ambienceJazz: {
        src: '/audio/ambience/ambience_jazz.mp3',
        name: 'Jazz Ambience',
        category: 'ambience'
    }
};

// Maps each category to a list of sound IDs in that category
export const soundsByCategory: Record<SoundCategory, SoundEffect[]> = {
    cards: ['cardDeal', 'cardSlide', 'cardFlip', 'cardShuffle', 'cardRiff', 'deckCut'],
    chips: ['chipSingle', 'chipStack', 'chipToss', 'betPlaced', 'betCollect', 'betPush'],
    win: ['win', 'winSmall', 'winMedium', 'winLarge', 'winBlackjack'],
    lose: ['lose', 'bust'],
    ui: ['buttonClick', 'buttonHover', 'menuOpen', 'menuClose', 'timerTick', 'timerExpire', 'push', 'hit', 'stand', 'double', 'split', 'insurance', 'surrender'],
    alerts: ['alert', 'alertError', 'alertSuccess', 'alertInfo'],
    ambience: ['ambienceCasino', 'ambienceNight', 'ambienceJazz'],
    buttons: ['buttonClick', 'buttonHover']
};

// Default volume for sound categories
export const categoryVolumes: Record<SoundCategory, number> = {
    cards: 0.7,
    chips: 0.8,
    win: 1.0,
    lose: 0.7,
    ui: 0.6,
    alerts: 0.9,
    ambience: 0.5,
    buttons: 0.6
};