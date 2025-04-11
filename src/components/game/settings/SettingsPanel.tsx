'use client';

import React from 'react';
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
    return (
        <div className="flex flex-col gap-6 py-4">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Appearance</h3>

                <div className="space-y-2">
                    <Label htmlFor="table-variant">Table Variant</Label>
                    <Select value={tableVariant} onValueChange={onTableVariantChange}>
                        <SelectTrigger id="table-variant">
                            <SelectValue placeholder="Select table style" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="vegas">Vegas</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="chip-style">Chip Style</Label>
                    <Select value={chipStyle} onValueChange={onChipStyleChange}>
                        <SelectTrigger id="chip-style">
                            <SelectValue placeholder="Select chip style" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="vintage">Vintage</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Audio</h3>

                <div className="flex items-center justify-between">
                    <Label htmlFor="sound-toggle">Sound Effects</Label>
                    <Switch
                        id="sound-toggle"
                        checked={isSoundEnabled}
                        onCheckedChange={onToggleSound}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="sound-volume">Volume</Label>
                        <span className="text-sm text-muted-foreground">
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

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Game Options</h3>

                <div className="space-y-2">
                    <Label htmlFor="animation-speed">Animation Speed</Label>
                    <Select defaultValue={animationSpeed} disabled>
                        <SelectTrigger id="animation-speed">
                            <SelectValue placeholder="Select animation speed" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="slow">Slow</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="fast">Fast</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Side Bets</h3>

                <div className="flex items-center justify-between">
                    <Label htmlFor="perfect-pairs">Perfect Pairs</Label>
                    <Switch
                        id="perfect-pairs"
                        checked={sideBets.perfectPairs}
                        disabled
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label htmlFor="21+3">21+3</Label>
                    <Switch
                        id="21+3"
                        checked={sideBets.twentyOneThree}
                        disabled
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label htmlFor="lucky-ladies">Lucky Ladies</Label>
                    <Switch
                        id="lucky-ladies"
                        checked={sideBets.luckyLadies}
                        disabled
                    />
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;