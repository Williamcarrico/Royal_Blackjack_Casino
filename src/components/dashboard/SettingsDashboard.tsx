'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export function SettingsDashboard() {
    const [audioEnabled, setAudioEnabled] = useState(true)
    const [animationSpeed, setAnimationSpeed] = useState([50])
    const [dealerSpeed, setDealerSpeed] = useState("medium")
    const [showHints, setShowHints] = useState(true)
    const [autoStand, setAutoStand] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const [tableColor, setTableColor] = useState("green")

    const handleSaveSettings = () => {
        toast.success("Settings saved successfully", {
            description: "Your preferences have been updated",
        })
    }

    const handleResetSettings = () => {
        setAudioEnabled(true)
        setAnimationSpeed([50])
        setDealerSpeed("medium")
        setShowHints(true)
        setAutoStand(false)
        setDarkMode(false)
        setTableColor("green")
        toast.info("Settings reset to defaults")
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Game Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Customize your Royal Edge Blackjack experience
                </p>
            </div>

            <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="visual">Visual Settings</TabsTrigger>
                    <TabsTrigger value="gameplay">Gameplay Settings</TabsTrigger>
                    <TabsTrigger value="audio">Audio Settings</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Visual Preferences</CardTitle>
                            <CardDescription>
                                Customize how the game looks and feels
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="dark-mode">Dark Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Switch between light and dark themes
                                    </p>
                                </div>
                                <Switch
                                    id="dark-mode"
                                    checked={darkMode}
                                    onCheckedChange={setDarkMode}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="table-color">Table Color</Label>
                                <Select value={tableColor} onValueChange={setTableColor}>
                                    <SelectTrigger id="table-color">
                                        <SelectValue placeholder="Select table color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="green">Classic Green</SelectItem>
                                        <SelectItem value="blue">Royal Blue</SelectItem>
                                        <SelectItem value="red">Vegas Red</SelectItem>
                                        <SelectItem value="purple">Luxury Purple</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label htmlFor="animation-speed">Animation Speed</Label>
                                    <span className="text-sm text-muted-foreground">{animationSpeed}%</span>
                                </div>
                                <Slider
                                    id="animation-speed"
                                    min={0}
                                    max={100}
                                    step={10}
                                    value={animationSpeed}
                                    onValueChange={setAnimationSpeed}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="gameplay" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gameplay Settings</CardTitle>
                            <CardDescription>
                                Adjust how the game plays
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="show-hints">Strategy Hints</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show optimal play suggestions
                                    </p>
                                </div>
                                <Switch
                                    id="show-hints"
                                    checked={showHints}
                                    onCheckedChange={setShowHints}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="auto-stand">Auto-Stand on 17+</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically stand when your hand is 17 or higher
                                    </p>
                                </div>
                                <Switch
                                    id="auto-stand"
                                    checked={autoStand}
                                    onCheckedChange={setAutoStand}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="dealer-speed">Dealer Speed</Label>
                                <Select value={dealerSpeed} onValueChange={setDealerSpeed}>
                                    <SelectTrigger id="dealer-speed">
                                        <SelectValue placeholder="Select dealer speed" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="slow">Slow</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="fast">Fast</SelectItem>
                                        <SelectItem value="instant">Instant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audio" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Audio Settings</CardTitle>
                            <CardDescription>
                                Configure sound options
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="audio-enabled">Game Audio</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable or disable all game sounds
                                    </p>
                                </div>
                                <Switch
                                    id="audio-enabled"
                                    checked={audioEnabled}
                                    onCheckedChange={setAudioEnabled}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label htmlFor="volume-slider">Master Volume</Label>
                                    <span className="text-sm text-muted-foreground">{animationSpeed}%</span>
                                </div>
                                <Slider
                                    id="volume-slider"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={animationSpeed}
                                    onValueChange={setAnimationSpeed}
                                    disabled={!audioEnabled}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Advanced Options</CardTitle>
                            <CardDescription>
                                Fine-tune your gaming experience
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-muted-foreground">
                                Advanced settings coming soon...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 mt-8">
                <Button variant="outline" onClick={handleResetSettings}>
                    Reset to Defaults
                </Button>
                <Button onClick={handleSaveSettings}>
                    Save Settings
                </Button>
            </div>
        </div>
    )
}