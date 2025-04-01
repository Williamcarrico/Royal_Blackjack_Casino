'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useEnhancedSettingsStore } from '@/store/enhancedSettingsStore';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    CardDescription
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen,
    Settings2,
    Dices,
    CreditCard,
    Scale,
    Save,
    RotateCcw,
    CheckCircle
} from 'lucide-react';

interface GameRules {
    numberOfDecks: number;
    dealerHitsSoft17: boolean;
    blackjackPays: number;
    doubleAfterSplit: boolean;
    resplitAces: boolean;
    lateSurrender: boolean;
    maxSplitHands: number;
    minBet: number;
    maxBet: number;
    insuranceAvailable: boolean;
    dealerPeeks: boolean;
    surrenderAvailable: string;
    doubleAllowed: string;
}

interface RuleConfigurationProps {
    className?: string;
    onClose?: () => void;
    onRulesChanged?: () => void;
}

// Game rule presets
const rulePresets = {
    'vegas-strip': {
        name: 'Las Vegas Strip',
        description: 'Standard Las Vegas Strip rules with 4-8 decks',
        rules: {
            numberOfDecks: 6,
            dealerHitsSoft17: false,
            blackjackPays: 1.5,
            doubleAfterSplit: true,
            resplitAces: false,
            lateSurrender: true,
            maxSplitHands: 4,
            minBet: 10,
            maxBet: 1000
        }
    },
    'atlantic-city': {
        name: 'Atlantic City',
        description: 'Rules typically found in Atlantic City casinos',
        rules: {
            numberOfDecks: 8,
            dealerHitsSoft17: false,
            blackjackPays: 1.5,
            doubleAfterSplit: true,
            resplitAces: false,
            lateSurrender: true,
            maxSplitHands: 3,
            minBet: 15,
            maxBet: 2000
        }
    },
    'european': {
        name: 'European',
        description: 'Traditional European blackjack rules',
        rules: {
            numberOfDecks: 6,
            dealerHitsSoft17: true,
            blackjackPays: 1.5,
            doubleAfterSplit: true,
            resplitAces: false,
            lateSurrender: false,
            maxSplitHands: 4,
            minBet: 5,
            maxBet: 500
        }
    },
    'single-deck': {
        name: 'Single Deck',
        description: 'Single deck blackjack with player-favorable rules',
        rules: {
            numberOfDecks: 1,
            dealerHitsSoft17: false,
            blackjackPays: 1.5,
            doubleAfterSplit: true,
            resplitAces: false,
            lateSurrender: false,
            maxSplitHands: 2,
            minBet: 25,
            maxBet: 1000
        }
    },
    'six-to-five': {
        name: '6:5 Blackjack',
        description: 'Common modern rules with reduced blackjack payout',
        rules: {
            numberOfDecks: 6,
            dealerHitsSoft17: true,
            blackjackPays: 1.2,
            doubleAfterSplit: true,
            resplitAces: false,
            lateSurrender: false,
            maxSplitHands: 3,
            minBet: 5,
            maxBet: 500
        }
    }
};

// Extend the SettingsStore to include gameRules
type EnhancedSettingsWithGameRules = {
    gameRules?: GameRules;
    updateSettings: (settings: Partial<{ gameRules: GameRules }>) => void;
};

const RuleConfiguration: React.FC<RuleConfigurationProps> = ({
    className = '',
    onClose,
    onRulesChanged
}) => {
    const settings = useEnhancedSettingsStore() as EnhancedSettingsWithGameRules;
    const [activeTab, setActiveTab] = useState('general');
    const [changesApplied, setChangesApplied] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    // Create a gameRules property if it doesn't exist in settings
    const gameRules = (settings.gameRules || {
        numberOfDecks: 6,
        dealerHitsSoft17: false,
        blackjackPays: 1.5,
        doubleAfterSplit: true,
        resplitAces: false,
        lateSurrender: true,
        maxSplitHands: 4,
        minBet: 10,
        maxBet: 1000,
        insuranceAvailable: true,
        dealerPeeks: true,
        surrenderAvailable: 'late',
        doubleAllowed: 'any2'
    });

    // Apply a rule preset
    const applyPreset = (presetKey: string) => {
        const preset = rulePresets[presetKey as keyof typeof rulePresets];
        if (!preset) return;

        setSelectedPreset(presetKey);

        // Update settings with preset values
        const updatedRules: GameRules = {
            ...gameRules,
            ...preset.rules,
            numberOfDecks: preset.rules.numberOfDecks,
            dealerHitsSoft17: preset.rules.dealerHitsSoft17,
            blackjackPays: preset.rules.blackjackPays,
            doubleAfterSplit: preset.rules.doubleAfterSplit,
            resplitAces: preset.rules.resplitAces,
            lateSurrender: preset.rules.lateSurrender,
            maxSplitHands: preset.rules.maxSplitHands,
            minBet: preset.rules.minBet,
            maxBet: preset.rules.maxBet
        };

        // Save updated rules to the store
        settings.updateSettings({ gameRules: updatedRules });

        // Show applied notification
        setChangesApplied(true);
        setTimeout(() => setChangesApplied(false), 1500);

        // Notify parent component
        if (onRulesChanged) {
            onRulesChanged();
        }
    };

    // Handle rules change
    const handleRuleChange = (
        key: keyof typeof gameRules,
        value: string | number | boolean
    ) => {
        // Update rules in settings store
        const updatedRules = {
            ...gameRules,
            [key]: value
        };

        settings.updateSettings({ gameRules: updatedRules });
        setSelectedPreset(null);

        // Notify parent component
        if (onRulesChanged) {
            onRulesChanged();
        }
    };

    // Reset to default rules
    const resetToDefaults = () => {
        const defaultRules: GameRules = {
            numberOfDecks: 6,
            dealerHitsSoft17: false,
            blackjackPays: 1.5,
            doubleAfterSplit: true,
            resplitAces: false,
            lateSurrender: true,
            maxSplitHands: 4,
            minBet: 10,
            maxBet: 1000,
            insuranceAvailable: true,
            dealerPeeks: true,
            surrenderAvailable: 'late',
            doubleAllowed: 'any2'
        };

        settings.updateSettings({ gameRules: defaultRules });
        setSelectedPreset(null);

        // Show applied notification
        setChangesApplied(true);
        setTimeout(() => setChangesApplied(false), 1500);

        // Notify parent component
        if (onRulesChanged) {
            onRulesChanged();
        }
    };

    return (
        <Card className={`border bg-black/30 backdrop-blur-sm border-slate-700 ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    Game Rules Configuration
                </CardTitle>
                <CardDescription>
                    Customize the blackjack rules to your preference
                </CardDescription>
            </CardHeader>

            <CardContent className="pb-0">
                <div className="mb-6">
                    <h3 className="mb-2 text-sm font-medium text-gray-300">Rule Presets</h3>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {Object.entries(rulePresets).map(([key, preset]) => (
                            <Button
                                key={key}
                                variant={selectedPreset === key ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => applyPreset(key)}
                                className={`justify-start ${selectedPreset === key ? 'bg-amber-600 text-white' : 'bg-black/40 border-slate-600'}`}
                            >
                                <span className="truncate">{preset.name}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 mb-4 bg-slate-800 border-slate-700">
                        <TabsTrigger value="general">
                            <Settings2 className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">General</span>
                        </TabsTrigger>
                        <TabsTrigger value="betting">
                            <CreditCard className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Betting</span>
                        </TabsTrigger>
                        <TabsTrigger value="actions">
                            <Dices className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Actions</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                        {/* Number of Decks */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="decks" className="text-sm">Number of Decks</Label>
                                <Badge variant="outline" className="text-amber-300 border-amber-500/50">
                                    {gameRules.numberOfDecks}
                                </Badge>
                            </div>
                            <Slider
                                id="decks"
                                min={1}
                                max={8}
                                step={1}
                                value={[gameRules.numberOfDecks]}
                                onValueChange={(value) => handleRuleChange('numberOfDecks', value[0] ?? gameRules.numberOfDecks)}
                                aria-label="Number of decks"
                            />
                            <p className="text-xs text-gray-400">
                                More decks slightly increases house edge and makes card counting more difficult
                            </p>
                        </div>

                        {/* Dealer Hits Soft 17 */}
                        <div className="flex items-center justify-between space-x-2">
                            <div>
                                <Label htmlFor="hitSoft17" className="text-sm">Dealer Hits Soft 17</Label>
                                <p className="text-xs text-gray-400">
                                    If enabled, dealer must hit on soft 17 (increases house edge)
                                </p>
                            </div>
                            <Switch
                                id="hitSoft17"
                                checked={gameRules.dealerHitsSoft17}
                                onCheckedChange={(checked) => handleRuleChange('dealerHitsSoft17', checked)}
                                aria-label="Dealer hits soft 17"
                            />
                        </div>

                        {/* Blackjack Payout */}
                        <div className="space-y-1">
                            <Label htmlFor="blackjackPays" className="text-sm">Blackjack Payout</Label>
                            <Select
                                value={gameRules.blackjackPays.toString()}
                                onValueChange={(value) => handleRuleChange('blackjackPays', parseFloat(value))}
                            >
                                <SelectTrigger id="blackjackPays" className="bg-black/40 border-slate-600">
                                    <SelectValue placeholder="Select payout" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1.5">3:2 Payout (1.5x)</SelectItem>
                                    <SelectItem value="1.2">6:5 Payout (1.2x)</SelectItem>
                                    <SelectItem value="1">1:1 Payout (1x - Poor)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-400">
                                3:2 is traditional, 6:5 increases house edge significantly
                            </p>
                        </div>

                        {/* Dealer Peeks */}
                        <div className="flex items-center justify-between space-x-2">
                            <div>
                                <Label htmlFor="dealerPeeks" className="text-sm">Dealer Peeks</Label>
                                <p className="text-xs text-gray-400">
                                    Dealer checks for blackjack when showing an Ace or 10-value card
                                </p>
                            </div>
                            <Switch
                                id="dealerPeeks"
                                checked={gameRules.dealerPeeks}
                                onCheckedChange={(checked) => handleRuleChange('dealerPeeks', checked)}
                                aria-label="Dealer peeks for blackjack"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="betting" className="space-y-4">
                        {/* Bet Limits */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Bet Limits</h3>

                            {/* Minimum Bet */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="minBet" className="text-sm">Minimum Bet</Label>
                                    <Badge variant="outline" className="text-amber-300 border-amber-500/50">
                                        ${gameRules.minBet}
                                    </Badge>
                                </div>
                                <Slider
                                    id="minBet"
                                    min={1}
                                    max={100}
                                    step={5}
                                    value={[gameRules.minBet]}
                                    onValueChange={(value) => handleRuleChange('minBet', value[0] ?? gameRules.minBet)}
                                    aria-label="Minimum bet amount"
                                />
                            </div>

                            {/* Maximum Bet */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="maxBet" className="text-sm">Maximum Bet</Label>
                                    <Badge variant="outline" className="text-amber-300 border-amber-500/50">
                                        ${gameRules.maxBet}
                                    </Badge>
                                </div>
                                <Slider
                                    id="maxBet"
                                    min={100}
                                    max={10000}
                                    step={100}
                                    value={[gameRules.maxBet]}
                                    onValueChange={(value) => handleRuleChange('maxBet', value[0] ?? gameRules.maxBet)}
                                    aria-label="Maximum bet amount"
                                />
                            </div>
                        </div>

                        {/* Insurance Available */}
                        <div className="flex items-center justify-between space-x-2">
                            <div>
                                <Label htmlFor="insuranceAvailable" className="text-sm">Insurance Available</Label>
                                <p className="text-xs text-gray-400">
                                    Allow insurance bets when dealer shows an Ace
                                </p>
                            </div>
                            <Switch
                                id="insuranceAvailable"
                                checked={gameRules.insuranceAvailable}
                                onCheckedChange={(checked) => handleRuleChange('insuranceAvailable', checked)}
                                aria-label="Insurance available"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="actions" className="space-y-4">
                        {/* Double After Split */}
                        <div className="flex items-center justify-between space-x-2">
                            <div>
                                <Label htmlFor="doubleAfterSplit" className="text-sm">Double After Split</Label>
                                <p className="text-xs text-gray-400">
                                    Allow doubling down after splitting a pair
                                </p>
                            </div>
                            <Switch
                                id="doubleAfterSplit"
                                checked={gameRules.doubleAfterSplit}
                                onCheckedChange={(checked) => handleRuleChange('doubleAfterSplit', checked)}
                                aria-label="Double after split"
                            />
                        </div>

                        {/* Resplit Aces */}
                        <div className="flex items-center justify-between space-x-2">
                            <div>
                                <Label htmlFor="resplitAces" className="text-sm">Resplit Aces</Label>
                                <p className="text-xs text-gray-400">
                                    Allow splitting Aces more than once
                                </p>
                            </div>
                            <Switch
                                id="resplitAces"
                                checked={gameRules.resplitAces}
                                onCheckedChange={(checked) => handleRuleChange('resplitAces', checked)}
                                aria-label="Resplit aces"
                            />
                        </div>

                        {/* Surrender */}
                        <div className="space-y-1">
                            <Label htmlFor="surrenderAvailable" className="text-sm">Surrender Option</Label>
                            <Select
                                value={gameRules.surrenderAvailable || 'late'}
                                onValueChange={(value) => handleRuleChange('surrenderAvailable', value)}
                            >
                                <SelectTrigger id="surrenderAvailable" className="bg-black/40 border-slate-600">
                                    <SelectValue placeholder="Select surrender option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Surrender</SelectItem>
                                    <SelectItem value="late">Late Surrender</SelectItem>
                                    <SelectItem value="early">Early Surrender</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-400">
                                Early surrender is allowed before dealer checks for blackjack, late surrender after
                            </p>
                        </div>

                        {/* Doubling Allowed On */}
                        <div className="space-y-1">
                            <Label htmlFor="doubleAllowed" className="text-sm">Doubling Allowed On</Label>
                            <Select
                                value={gameRules.doubleAllowed || 'any2'}
                                onValueChange={(value) => handleRuleChange('doubleAllowed', value)}
                            >
                                <SelectTrigger id="doubleAllowed" className="bg-black/40 border-slate-600">
                                    <SelectValue placeholder="Select doubling option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any2">Any Two Cards</SelectItem>
                                    <SelectItem value="9-11">Hard 9-11 Only</SelectItem>
                                    <SelectItem value="10-11">Hard 10-11 Only</SelectItem>
                                    <SelectItem value="none">No Doubling</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-400">
                                Restricting doubling increases house edge
                            </p>
                        </div>

                        {/* Max Split Hands */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="maxSplitHands" className="text-sm">Maximum Split Hands</Label>
                                <Badge variant="outline" className="text-amber-300 border-amber-500/50">
                                    {gameRules.maxSplitHands}
                                </Badge>
                            </div>
                            <Slider
                                id="maxSplitHands"
                                min={1}
                                max={4}
                                step={1}
                                value={[gameRules.maxSplitHands]}
                                onValueChange={(value) => handleRuleChange('maxSplitHands', value[0] ?? gameRules.maxSplitHands)}
                                aria-label="Maximum split hands"
                            />
                            <p className="text-xs text-gray-400">
                                The maximum number of hands allowed after splitting
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CardFooter className="flex-col gap-3 pt-6 pb-4 mt-6 border-t border-slate-700">
                <div className="flex items-center w-full gap-3">
                    <Button onClick={resetToDefaults} variant="outline" className="flex-1 bg-black/40 border-slate-600">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                    <Button onClick={onClose} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Close
                    </Button>
                </div>

                {/* Notification when changes are applied */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: changesApplied ? 1 : 0, y: changesApplied ? 0 : 10 }}
                    className="flex items-center w-full gap-2 p-2 text-sm text-green-400 rounded-md bg-green-500/10"
                >
                    <CheckCircle className="w-4 h-4" />
                    <span>Rules updated successfully!</span>
                </motion.div>

                {/* House edge indicator */}
                <div className="flex items-center w-full gap-2 p-2 text-xs rounded-md bg-slate-800/50">
                    <Scale className="w-4 h-4 mr-1 text-amber-400" />
                    <div>
                        <p className="font-medium">Estimated House Edge:</p>
                        <p className="text-gray-400">
                            {(() => {
                                if (gameRules.blackjackPays === 1.5 && !gameRules.dealerHitsSoft17 && gameRules.doubleAfterSplit) {
                                    return 'Low (≈0.5%)';
                                } else if (gameRules.blackjackPays === 1.2 || gameRules.dealerHitsSoft17) {
                                    return 'High (≈1.5-2%)';
                                } else {
                                    return 'Medium (≈0.8%)';
                                }
                            })()}
                        </p>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
};

export { RuleConfiguration };