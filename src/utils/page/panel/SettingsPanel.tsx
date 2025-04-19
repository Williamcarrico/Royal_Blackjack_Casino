'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Palette,
    Music,
    Gauge,
    Coins,
    Sparkles,
    SlidersHorizontal,
    Cog
} from 'lucide-react';

interface SettingsPanelProps {
    tableVariant: string;
    onTableVariantChange: (variant: string) => void;
    chipStyle: string;
    onChipStyleChange: (style: string) => void;
    animationSpeed: string;
    soundVolume: number;
    isSoundEnabled: boolean;
    onToggleSound: () => void;
    sideBets: {
        perfectPairs: boolean;
        twentyOneThree: boolean;
        luckyLadies: boolean;
    };
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    tableVariant,
    onTableVariantChange,
    chipStyle,
    onChipStyleChange,
    animationSpeed,
    soundVolume,
    isSoundEnabled,
    onToggleSound,
    sideBets,
}) => {
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const sectionVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        }
    };

    // Helper to get table preview color based on variant
    const getTablePreviewColor = (variant: string): string => {
        const variantMap: Record<string, string> = {
            'classic': 'bg-emerald-800',
            'modern': 'bg-blue-800',
            'vegas': 'bg-red-800',
            'luxury': 'bg-amber-900'
        };
        return variantMap[variant] || 'bg-emerald-800';
    };

    // Helper to get chip preview color based on style
    const getChipPreviewColor = (style: string): string => {
        const styleMap: Record<string, string> = {
            'classic': 'bg-red-600',
            'modern': 'bg-blue-700',
            'vintage': 'bg-amber-700'
        };
        return styleMap[style] || 'bg-red-600';
    };

    return (
        <motion.div
            className="flex flex-col gap-6 py-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Appearance Section */}
            <motion.div className="space-y-4" variants={sectionVariants}>
                <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-medium text-amber-300">Appearance</h3>
                </div>

                <div className="p-4 space-y-4 rounded-xl border border-amber-900/40 bg-black/30 backdrop-blur-sm">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="table-variant" className="text-sm text-amber-100">Table Variant</Label>
                            <div className={`w-6 h-6 rounded-full border border-white/20 ${getTablePreviewColor(tableVariant)}`}></div>
                        </div>
                        <Select value={tableVariant} onValueChange={onTableVariantChange}>
                            <SelectTrigger id="table-variant" className="bg-black/40 border-amber-900/40 text-amber-100">
                                <SelectValue placeholder="Select table style" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 border-amber-900/40">
                                <SelectItem value="classic">Classic</SelectItem>
                                <SelectItem value="modern">Modern</SelectItem>
                                <SelectItem value="vegas">Vegas</SelectItem>
                                <SelectItem value="luxury">Luxury</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="chip-style" className="text-sm text-amber-100">Chip Style</Label>
                            <div className={`w-6 h-6 rounded-full border-2 border-white/30 ${getChipPreviewColor(chipStyle)}`}></div>
                        </div>
                        <Select value={chipStyle} onValueChange={onChipStyleChange}>
                            <SelectTrigger id="chip-style" className="bg-black/40 border-amber-900/40 text-amber-100">
                                <SelectValue placeholder="Select chip style" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 border-amber-900/40">
                                <SelectItem value="classic">Classic</SelectItem>
                                <SelectItem value="modern">Modern</SelectItem>
                                <SelectItem value="vintage">Vintage</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </motion.div>

            <Separator className="bg-amber-900/30" />

            {/* Audio Section */}
            <motion.div className="space-y-4" variants={sectionVariants}>
                <div className="flex items-center gap-2 mb-2">
                    <Music className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-medium text-amber-300">Audio</h3>
                </div>

                <div className="p-4 space-y-4 rounded-xl border border-amber-900/40 bg-black/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="sound-toggle" className="text-sm text-amber-100">Sound Effects</Label>
                        <Switch
                            id="sound-toggle"
                            checked={isSoundEnabled}
                            onCheckedChange={onToggleSound}
                            className="data-[state=checked]:bg-amber-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="sound-volume" className="text-sm text-amber-100">Volume</Label>
                            <span className="text-sm text-amber-300">
                                {Math.round(soundVolume * 100)}%
                            </span>
                        </div>
                        <Slider
                            id="sound-volume"
                            disabled={!isSoundEnabled}
                            min={0}
                            max={1}
                            step={0.01}
                            value={[soundVolume]}
                            className="w-full"
                        />
                    </div>
                </div>
            </motion.div>

            <Separator className="bg-amber-900/30" />

            {/* Game Options Section */}
            <motion.div className="space-y-4" variants={sectionVariants}>
                <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-medium text-amber-300">Game Options</h3>
                </div>

                <div className="p-4 space-y-4 rounded-xl border border-amber-900/40 bg-black/30 backdrop-blur-sm">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="animation-speed" className="text-sm text-amber-100">Animation Speed</Label>
                            <Badge variant="outline" className="bg-black/40 text-amber-300 border-amber-900/40">
                                {animationSpeed.charAt(0).toUpperCase() + animationSpeed.slice(1)}
                            </Badge>
                        </div>
                        <Select defaultValue={animationSpeed} disabled>
                            <SelectTrigger id="animation-speed" className="bg-black/40 border-amber-900/40 text-amber-100">
                                <SelectValue placeholder="Select animation speed" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 border-amber-900/40">
                                <SelectItem value="slow">Slow</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="fast">Fast</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </motion.div>

            <Separator className="bg-amber-900/30" />

            {/* Side Bets Section */}
            <motion.div className="space-y-4" variants={sectionVariants}>
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-medium text-amber-300">Side Bets</h3>
                </div>

                <div className="p-4 space-y-4 rounded-xl border border-amber-900/40 bg-black/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-amber-400" />
                            <Label htmlFor="perfect-pairs" className="text-sm text-amber-100">Perfect Pairs</Label>
                        </div>
                        <Switch
                            id="perfect-pairs"
                            checked={sideBets.perfectPairs}
                            disabled
                            className="data-[state=checked]:bg-amber-600"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Cog className="w-4 h-4 text-amber-400" />
                            <Label htmlFor="21+3" className="text-sm text-amber-100">21+3</Label>
                        </div>
                        <Switch
                            id="21+3"
                            checked={sideBets.twentyOneThree}
                            disabled
                            className="data-[state=checked]:bg-amber-600"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                            <Label htmlFor="lucky-ladies" className="text-sm text-amber-100">Lucky Ladies</Label>
                        </div>
                        <Switch
                            id="lucky-ladies"
                            checked={sideBets.luckyLadies}
                            disabled
                            className="data-[state=checked]:bg-amber-600"
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SettingsPanel;