export interface FAQ {
	id: string
	question: string
	answer: string
	category: 'gameplay' | 'rules' | 'payouts' | 'account' | 'technical'
	details?: string[]
	relatedFAQs?: string[]
	popularity?: number // Added for tracking popular FAQs
	tags?: string[] // Added for advanced searching
}

export const faqs: FAQ[] = [
	{
		id: 'faq-1',
		question: 'How do I start playing blackjack?',
		answer:
			'To start playing blackjack, simply navigate to the game page and click the "Start Game" button. You\'ll be presented with options to select your betting amount, and then you can place your first bet to begin.',
		category: 'gameplay',
		details: [
			'Click on the "Game" navigation link',
			'Select your preferred chip values from the betting area',
			'Place your bets by clicking on the betting circle',
			'Click "Deal" to start the round',
		],
		popularity: 100,
		tags: ['beginner', 'start', 'betting', 'chips', 'deal'],
	},
	{
		id: 'faq-2',
		question: 'What are the basic rules of blackjack?',
		answer:
			'The objective of blackjack is to beat the dealer by having a hand value closer to 21 without exceeding it. Each player is dealt two cards, and can choose to "hit" (take another card) or "stand" (keep current hand). Cards 2-10 are worth their face value, face cards are worth 10, and Aces can be worth 1 or 11.',
		category: 'rules',
		details: [
			'Cards 2-10 are worth their face value',
			'Face cards (Jack, Queen, King) are worth 10 points',
			'Aces can be worth 1 or 11 points',
			'Dealer must hit on soft 17',
			'Blackjack pays 3:2',
		],
		relatedFAQs: ['faq-6', 'faq-7'],
		popularity: 95,
		tags: ['rules', 'basics', 'cards', 'value', 'points'],
	},
	{
		id: 'faq-3',
		question: 'What are the payout odds for blackjack?',
		answer:
			'A natural blackjack (an Ace with a 10-value card) typically pays 3:2. Regular wins pay 1:1, meaning you win an amount equal to your bet. Insurance bets pay 2:1 if the dealer has blackjack.',
		category: 'payouts',
		details: [
			'Blackjack pays 3:2',
			'Regular wins pay 1:1',
			'Insurance pays 2:1',
			'Push (tie) results in your bet being returned',
		],
		popularity: 85,
		tags: ['payouts', 'odds', 'winnings', 'insurance', 'bet'],
	},
	{
		id: 'faq-4',
		question: 'How do I create an account or save my progress?',
		answer:
			'Your progress is automatically saved to your browser\'s local storage. To create a full account with more features, click the "Sign Up" button in the top right corner of the screen and follow the registration process.',
		category: 'account',
		details: [
			'Click "Sign Up" in the navigation menu',
			'Enter your email and create a password',
			'Verify your email address',
			'Complete your profile with optional details',
		],
		popularity: 75,
		tags: ['account', 'signup', 'register', 'save', 'progress'],
	},
	{
		id: 'faq-5',
		question: 'What should I do if the game freezes or I encounter technical issues?',
		answer:
			'If you encounter technical issues, first try refreshing the page. If problems persist, clear your browser cache and cookies. For further assistance, contact our support team through the "Help" section.',
		category: 'technical',
		details: [
			'Refresh the page (press F5 or Ctrl+R)',
			'Clear browser cache and cookies',
			'Try a different browser',
			'Check your internet connection',
			'Contact support if issues persist',
		],
		popularity: 65,
		tags: ['troubleshooting', 'technical', 'issues', 'help', 'support'],
	},
	{
		id: 'faq-6',
		question: 'What does "doubling down" mean?',
		answer:
			'Doubling down allows you to double your initial bet in exchange for committing to stand after receiving exactly one more card. This option is typically available on your first two cards, and is a strategic move often used when you have a hand total of 10 or 11.',
		category: 'gameplay',
		details: [
			'Only available on your first two cards',
			'Doubles your bet and you receive exactly one more card',
			'Often used with hand totals of 10 or 11',
			'Cannot double down after hitting',
			'In our game, you can double down on any two cards',
		],
		relatedFAQs: ['faq-2'],
		popularity: 80,
		tags: ['gameplay', 'double-down', 'strategy', 'betting', 'cards'],
	},
	{
		id: 'faq-7',
		question: 'What is "splitting pairs"?',
		answer:
			'Splitting pairs allows you to divide a pair (two cards of the same value) into two separate hands, each with its own bet equal to your original wager. Each hand is played independently, giving you more opportunities to win against the dealer.',
		category: 'gameplay',
		details: [
			'Only available when your first two cards form a pair',
			'Creates two separate hands, each with an equal bet',
			'Each hand is played independently',
			'Aces can only be split once and receive one card each',
			'You can split up to three times (creating four hands)',
		],
		relatedFAQs: ['faq-2', 'faq-6'],
		popularity: 75,
		tags: ['gameplay', 'splitting', 'pairs', 'strategy', 'hands'],
	},
	{
		id: 'faq-8',
		question: 'What is the "insurance" bet?',
		answer:
			"Insurance is a side bet offered when the dealer shows an Ace. It costs half your original bet and pays 2:1 if the dealer has a blackjack. It's essentially a bet that the dealer has a 10-value card as their hole card, giving them a blackjack.",
		category: 'payouts',
		details: [
			'Only offered when dealer shows an Ace',
			'Costs half your original bet',
			'Pays 2:1 if dealer has blackjack',
			'Generally not recommended in basic strategy',
			'Insurance bet is resolved before the main hand',
		],
		popularity: 70,
		tags: ['insurance', 'side-bet', 'dealer-ace', 'payouts', 'strategy'],
	},
	{
		id: 'faq-9',
		question: 'Can I play on mobile devices?',
		answer:
			"Yes, our blackjack game is fully responsive and optimized for mobile play. The interface automatically adjusts to your screen size, providing an optimal experience whether you're on a smartphone, tablet, or desktop computer.",
		category: 'technical',
		details: [
			'Fully responsive design',
			'Touch-optimized controls',
			'Portrait and landscape orientations supported',
			'No app download required',
			'Works on iOS and Android devices',
		],
		popularity: 85,
		tags: ['mobile', 'responsive', 'smartphone', 'tablet', 'device'],
	},
	{
		id: 'faq-10',
		question: 'What is a "soft hand" vs a "hard hand"?',
		answer:
			'A "soft hand" contains an Ace being counted as 11 without busting (going over 21). A "hard hand" either has no Ace, or has an Ace that must be counted as 1 to avoid busting. This distinction is important for strategy decisions, as soft hands allow you to hit without risk of busting.',
		category: 'rules',
		details: [
			'Soft hand: Contains an Ace counted as 11',
			'Hard hand: Contains no Ace, or Ace counted as 1',
			'Soft hands give more flexibility for hitting',
			'Soft 17 (Ace-6) is treated differently by dealer rules',
			'Strategy often differs for soft vs hard hands of the same total',
		],
		popularity: 65,
		tags: ['soft-hand', 'hard-hand', 'ace', 'strategy', 'bust'],
	},
	{
		id: 'faq-11',
		question: 'Is card counting possible in this game?',
		answer:
			'While technically you could count cards in our digital blackjack game, it offers limited advantage because the deck is reshuffled after each hand by default. In multi-deck games with later shuffle points, counting would be possible but with diminished effectiveness compared to physical casinos.',
		category: 'gameplay',
		details: [
			'Cards are reshuffled after each hand by default',
			'Multi-deck shoe reduces counting effectiveness',
			'Game uses RNG (Random Number Generator) for true randomness',
			'Advanced settings allow for more realistic shuffle timing',
			'Focus on basic strategy for best results',
		],
		popularity: 60,
		tags: ['card-counting', 'strategy', 'advanced', 'shuffle', 'rng'],
	},
	{
		id: 'faq-12',
		question: 'How can I improve my blackjack strategy?',
		answer:
			'To improve your blackjack strategy, study and follow basic strategy charts which provide the mathematically optimal play for every possible hand. Our Strategy Guide section offers detailed advice, interactive training tools, and practice modes to help you master the fundamentals.',
		category: 'gameplay',
		details: [
			'Learn basic strategy for your specific rule set',
			'Use our interactive strategy trainer',
			'Practice in free play mode',
			'Review hand histories to analyze your decisions',
			'Visit our Strategy Guide for advanced techniques',
		],
		relatedFAQs: ['faq-2', 'faq-10'],
		popularity: 90,
		tags: ['strategy', 'basic-strategy', 'practice', 'training', 'improve'],
	},
	{
		id: 'faq-13',
		question: 'What is a "blackjack" or "natural"?',
		answer:
			'A "blackjack" or "natural" is a two-card hand consisting of an Ace and a 10-value card (10, Jack, Queen, or King). This special hand typically pays 3:2 and automatically wins unless the dealer also has a blackjack, in which case it\'s a push (tie).',
		category: 'rules',
		details: [
			'Consists of an Ace and a 10-value card',
			'Only applies to the first two cards dealt',
			'Pays 3:2 in most traditional games',
			'Beats any other hand except another blackjack',
			'Results in a push if dealer also has blackjack',
		],
		popularity: 85,
		tags: ['blackjack', 'natural', 'payouts', 'rules', 'ace'],
	},
	{
		id: 'faq-14',
		question: 'What are the different betting options in blackjack?',
		answer:
			'In blackjack, you can place the main bet before each hand begins. Additional betting options include insurance when the dealer shows an Ace, doubling down to increase your bet in exchange for one more card, and splitting pairs to create two separate hands with individual bets.',
		category: 'payouts',
		details: [
			'Main bet placed before cards are dealt',
			'Insurance: Side bet when dealer shows an Ace',
			'Double down: Increase your bet for one more card',
			'Split pairs: Create two hands from a pair',
			'Some casinos offer side bets like Perfect Pairs or 21+3',
		],
		popularity: 75,
		tags: ['betting', 'wager', 'options', 'insurance', 'double-down'],
	},
	{
		id: 'faq-15',
		question: 'What is the house edge in blackjack?',
		answer:
			'Blackjack has one of the lowest house edges of any casino game, typically between 0.5% and 1% when using basic strategy. This means that for every $100 wagered, the player can expect to lose between $0.50 and $1 in the long run. The exact house edge depends on the specific rules of the game being played.',
		category: 'rules',
		details: [
			'House edge ranges from 0.5% to 1% with basic strategy',
			'Lower than most other casino games',
			'Varies based on specific table rules',
			'Can be further reduced with card counting (in physical casinos)',
			'Without basic strategy, house edge increases dramatically',
		],
		popularity: 70,
		tags: ['house-edge', 'advantage', 'odds', 'strategy', 'basic-strategy'],
	},
	{
		id: 'faq-36',
		question: 'How can I contact the CEO directly?',
		answer:
			'You can contact our CEO directly via email at ceo@dmscasinogaming.com. For urgent matters or specific concerns that require executive attention, this direct line of communication ensures your feedback reaches the top leadership.',
		category: 'account',
		details: [
			'Email the CEO at ceo@dmscasinogaming.com',
			'Include your account details for reference',
			'Specify the nature of your inquiry',
			'Allow 24-48 hours for a response',
			'For general inquiries, our regular support team is still the fastest option',
		],
		popularity: 50,
		tags: ['contact', 'CEO', 'executive', 'feedback', 'support'],
		relatedFAQs: ['faq-5'],
	},
]

// Helper function to sort FAQs by popularity
export const getSortedFAQs = (sortBy: 'popularity' | 'category' = 'popularity') => {
	return [...faqs].sort((a, b) => {
		if (sortBy === 'popularity') {
			return (b.popularity ?? 0) - (a.popularity ?? 0)
		} else {
			return a.category.localeCompare(b.category)
		}
	})
}

// Helper function to get popular FAQs (top N)
export const getPopularFAQs = (count: number = 5) => {
	return getSortedFAQs('popularity').slice(0, count)
}

// Helper function to get related FAQs
export const getRelatedFAQs = (relatedIds?: string[]) => {
	if (!relatedIds || relatedIds.length === 0) return []
	return faqs.filter(faq => relatedIds.includes(faq.id))
}

// Blackjack glossary terms
export interface GlossaryTerm {
	term: string
	definition: string
}

export const glossaryTerms: GlossaryTerm[] = [
	{
		term: 'Blackjack',
		definition:
			'A two-card hand consisting of an Ace and a 10-value card (10, Jack, Queen, or King), typically paying 3:2.',
	},
	{
		term: 'Bust',
		definition: 'When a hand exceeds a total of 21, resulting in an automatic loss.',
	},
	{
		term: 'Double Down',
		definition: 'To double your bet and receive exactly one more card.',
	},
	{
		term: 'Hit',
		definition: 'To request another card from the dealer.',
	},
	{
		term: 'Insurance',
		definition:
			'A side bet offered when the dealer shows an Ace, paying 2:1 if the dealer has blackjack.',
	},
	{
		term: 'Push',
		definition: "A tie between the player and dealer, resulting in the return of the player's bet.",
	},
	{
		term: 'Soft Hand',
		definition: 'A hand containing an Ace counted as 11.',
	},
	{
		term: 'Hard Hand',
		definition: 'A hand with no Ace, or with an Ace counted as 1.',
	},
	{
		term: 'Split',
		definition: 'To separate a pair into two distinct hands, each with its own bet.',
	},
	{
		term: 'Stand',
		definition: 'To end your turn and keep your current hand total.',
	},
	{
		term: 'Surrender',
		definition: 'To forfeit half your bet and end the hand immediately (where available).',
	},
	{
		term: 'Natural',
		definition: 'Another term for a blackjack (Ace and 10-value card).',
	},
]
