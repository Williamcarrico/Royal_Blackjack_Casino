'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Bell,
    BellRing,
    Mail,
    Volume2,
    Eye,
    Info,
    Save,
    RotateCcw,
    CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { useNotifications } from '@/hooks/services/useNotifications'
import type {
    NotificationPreferences,
    NotificationType,
    NotificationPriority
} from '@/types/notifications'
import { Button } from '@/components/ui/layout/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    GiCoins,
    GiDiamonds,
    GiBallGlow,
    GiInfo,
    GiPerson,
    GiCrown,
    GiMoneyStack
} from 'react-icons/gi'
import { TimePicker } from '@/components/ui/time-picker'

interface NotificationTypeConfig {
    type: NotificationType;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

// Array of notification types with display information
const notificationTypes: NotificationTypeConfig[] = [
    {
        type: 'bonus',
        label: 'Bonuses',
        description: 'Daily rewards, special promotions and chip bonuses',
        icon: <GiCoins className="w-5 h-5 text-yellow-400" />,
        color: 'bg-yellow-400'
    },
    {
        type: 'tournament',
        label: 'Tournaments',
        description: 'Tournament announcements, standings and results',
        icon: <GiDiamonds className="w-5 h-5 text-blue-400" />,
        color: 'bg-blue-400'
    },
    {
        type: 'promo',
        label: 'Promotions',
        description: 'Special offers, limited-time events and casino promotions',
        icon: <span className="w-5 h-5 text-green-400">%</span>,
        color: 'bg-green-400'
    },
    {
        type: 'achievement',
        label: 'Achievements',
        description: 'Game achievements, milestones and personal records',
        icon: <span className="w-5 h-5 text-purple-400">🏆</span>,
        color: 'bg-purple-400'
    },
    {
        type: 'game',
        label: 'Games',
        description: 'Game events, results, big wins and new game releases',
        icon: <GiBallGlow className="w-5 h-5 text-cyan-400" />,
        color: 'bg-cyan-400'
    },
    {
        type: 'system',
        label: 'System',
        description: 'Account security, maintenance and important updates',
        icon: <GiInfo className="w-5 h-5 text-gray-400" />,
        color: 'bg-gray-400'
    },
    {
        type: 'account',
        label: 'Account',
        description: 'Account balance, deposit and withdrawal notifications',
        icon: <GiPerson className="w-5 h-5 text-orange-400" />,
        color: 'bg-orange-400'
    },
    {
        type: 'vip',
        label: 'VIP',
        description: 'VIP program updates, exclusive benefits and events',
        icon: <GiCrown className="w-5 h-5 text-amber-400" />,
        color: 'bg-amber-400'
    },
    {
        type: 'reward',
        label: 'Rewards',
        description: 'Loyalty points, reward redemptions and special offers',
        icon: <GiMoneyStack className="w-5 h-5 text-emerald-400" />,
        color: 'bg-emerald-400'
    }
];

// Helper function for color transformation
const getIconContainerClass = (color: string) => {
    return color.replace('text-', 'bg-').replace('400', '900/60');
};

// Priority options for dropdown
const priorityOptions: { value: NotificationPriority; label: string }[] = [
    { value: 'low', label: 'All (Including Low Priority)' },
    { value: 'medium', label: 'Medium & Higher' },
    { value: 'high', label: 'High & Critical Only' },
    { value: 'critical', label: 'Critical Only' }
];

interface NotificationTypeSettingProps {
    config: NotificationTypeConfig;
    preferences: NotificationPreferences;
    onChange: (type: NotificationType, changes: Partial<NotificationPreferences['typePreferences'][NotificationType]>) => void;
}

// Component for individual notification type settings
const NotificationTypeSetting: React.FC<NotificationTypeSettingProps> = ({
    config,
    preferences,
    onChange
}) => {
    const typePrefs = preferences.typePreferences[config.type];

    return (
        <div className="mb-6 last:mb-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", getIconContainerClass(config.color))}>
                        {config.icon}
                    </div>
                    <div>
                        <h4 className="font-medium text-amber-200">{config.label}</h4>
                        <p className="text-xs text-gray-400">{config.description}</p>
                    </div>
                </div>
                <Switch
                    checked={typePrefs.enabled}
                    onCheckedChange={(checked) => onChange(config.type, { enabled: checked })}
                    className="data-[state=checked]:bg-amber-600"
                />
            </div>

            {typePrefs.enabled && (
                <div className="mt-4 space-y-4 pl-11">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`${config.type}-push`} className="text-sm font-normal text-gray-300">
                                    <Bell className="w-3.5 h-3.5 inline-block mr-1.5" />
                                    Push Notifications
                                </Label>
                                <Switch
                                    id={`${config.type}-push`}
                                    checked={typePrefs.pushEnabled}
                                    disabled={!typePrefs.enabled}
                                    onCheckedChange={(checked) => onChange(config.type, { pushEnabled: checked })}
                                    className="data-[state=checked]:bg-amber-600 h-5 w-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`${config.type}-email`} className="text-sm font-normal text-gray-300">
                                    <Mail className="w-3.5 h-3.5 inline-block mr-1.5" />
                                    Email Digests
                                </Label>
                                <Switch
                                    id={`${config.type}-email`}
                                    checked={typePrefs.emailEnabled}
                                    disabled={!typePrefs.enabled}
                                    onCheckedChange={(checked) => onChange(config.type, { emailEnabled: checked })}
                                    className="data-[state=checked]:bg-amber-600 h-5 w-9"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${config.type}-priority`} className="text-sm text-gray-300">
                            Minimum Priority
                        </Label>
                        <Select
                            value={typePrefs.minPriority}
                            onValueChange={(value) => onChange(config.type, { minPriority: value as NotificationPriority })}
                            disabled={!typePrefs.enabled}
                        >
                            <SelectTrigger className="w-full text-sm bg-black/50 border-amber-900/50">
                                <SelectValue placeholder="Select minimum priority" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 border-amber-900/50">
                                {priorityOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="text-gray-200">
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    );
};

interface NotificationPreferencesProps {
    /**
     * Whether the component is in dialog mode
     */
    isDialog?: boolean;

    /**
     * If in dialog mode, whether the dialog is open
     */
    isOpen?: boolean;

    /**
     * If in dialog mode, callback when dialog closes
     */
    onCloseAction?: () => void;
}

export function NotificationPreferences({
    isDialog = false,
    isOpen = false,
    onCloseAction = () => { }
}: NotificationPreferencesProps) {
    // Access notification preferences from the store
    const { preferences, updatePreferences } = useNotifications();

    // Local state for form values
    const [formValues, setFormValues] = useState<NotificationPreferences>(preferences);

    // Status for saving preferences
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Update form when preferences change
    useEffect(() => {
        setFormValues(preferences);
    }, [preferences]);

    // Handle form submission
    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setIsSaving(true);
        setSaveStatus('idle');

        try {
            await updatePreferences(formValues);
            setSaveStatus('success');

            // Reset status after delay
            setTimeout(() => {
                setSaveStatus('idle');
                if (isDialog) {
                    onCloseAction();
                }
            }, 1500);
        } catch (error) {
            console.error('Failed to save preferences:', error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle changes to master toggles
    const handleMasterToggle = (key: keyof NotificationPreferences, value: boolean) => {
        setFormValues(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Handle changes to type-specific settings
    const handleTypeChange = (
        type: NotificationType,
        changes: Partial<NotificationPreferences['typePreferences'][NotificationType]>
    ) => {
        setFormValues(prev => ({
            ...prev,
            typePreferences: {
                ...prev.typePreferences,
                [type]: {
                    ...prev.typePreferences[type],
                    ...changes
                }
            }
        }));
    };

    // Reset to defaults
    const handleReset = () => {
        setFormValues(preferences);
    };

    // Conditional rendering for dialog vs. standard component
    const renderContent = () => {
        // Extract nested ternary for button content
        const getSaveButtonContent = () => {
            if (saveStatus === 'success') {
                return (
                    <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Saved
                    </>
                );
            } else if (saveStatus === 'error') {
                return 'Error!';
            } else {
                return (
                    <>
                        <Save className="w-4 h-4 mr-1" />
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </>
                );
            }
        };

        return (
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text">
                        Notification Preferences
                    </h3>

                    <p className="text-sm text-gray-400">
                        Customize how and when you receive notifications from Royal Edge Blackjack.
                    </p>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full h-10 grid-cols-2 bg-black/40">
                        <TabsTrigger
                            value="general"
                            className="text-sm text-gray-400 data-[state=active]:text-amber-300 data-[state=active]:bg-amber-900/30"
                        >
                            General Settings
                        </TabsTrigger>
                        <TabsTrigger
                            value="types"
                            className="text-sm text-gray-400 data-[state=active]:text-amber-300 data-[state=active]:bg-amber-900/30"
                        >
                            Notification Types
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-6 space-y-6">
                        {/* Master toggle */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="text-base font-medium text-amber-200">All Notifications</h4>
                                <p className="text-sm text-gray-400">Master toggle for all notifications</p>
                            </div>
                            <Switch
                                checked={formValues.enabled}
                                onCheckedChange={(checked) => handleMasterToggle('enabled', checked)}
                                className="data-[state=checked]:bg-amber-600"
                            />
                        </div>

                        <Separator className="bg-amber-900/30" />

                        {/* General notification settings */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-amber-300">Notification Channels</h4>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BellRing className="w-4 h-4 text-amber-400" />
                                        <Label htmlFor="push-notifications" className="text-gray-300">Push Notifications</Label>
                                    </div>
                                    <Switch
                                        id="push-notifications"
                                        checked={formValues.pushEnabled}
                                        disabled={!formValues.enabled}
                                        onCheckedChange={(checked) => handleMasterToggle('pushEnabled', checked)}
                                        className="data-[state=checked]:bg-amber-600"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-amber-400" />
                                        <Label htmlFor="email-notifications" className="text-gray-300">Email Notifications</Label>
                                    </div>
                                    <Switch
                                        id="email-notifications"
                                        checked={formValues.emailEnabled}
                                        disabled={!formValues.enabled}
                                        onCheckedChange={(checked) => handleMasterToggle('emailEnabled', checked)}
                                        className="data-[state=checked]:bg-amber-600"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Volume2 className="w-4 h-4 text-amber-400" />
                                        <Label htmlFor="sound-notifications" className="text-gray-300">Sound Effects</Label>
                                    </div>
                                    <Switch
                                        id="sound-notifications"
                                        checked={formValues.soundEnabled}
                                        disabled={!formValues.enabled}
                                        onCheckedChange={(checked) => handleMasterToggle('soundEnabled', checked)}
                                        className="data-[state=checked]:bg-amber-600"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-amber-400" />
                                        <Label htmlFor="preview-notifications" className="text-gray-300">Show Content Preview</Label>
                                    </div>
                                    <Switch
                                        id="preview-notifications"
                                        checked={formValues.showPreview}
                                        disabled={!formValues.enabled}
                                        onCheckedChange={(checked) => handleMasterToggle('showPreview', checked)}
                                        className="data-[state=checked]:bg-amber-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-amber-900/30" />

                        {/* Do Not Disturb */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-amber-300">Do Not Disturb</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dnd-start" className="text-sm text-gray-300">Start Time</Label>
                                    <TimePicker
                                        setTimeAction={(time: string) => setFormValues(prev => ({
                                            ...prev,
                                            doNotDisturbStart: time
                                        }))}
                                        value={formValues.doNotDisturbStart || '22:00'}
                                        disabled={!formValues.enabled}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dnd-end" className="text-sm text-gray-300">End Time</Label>
                                    <TimePicker
                                        setTimeAction={(time: string) => setFormValues(prev => ({
                                            ...prev,
                                            doNotDisturbEnd: time
                                        }))}
                                        value={formValues.doNotDisturbEnd || '08:00'}
                                        disabled={!formValues.enabled}
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                <Info className="inline w-3 h-3 mr-1" />
                                During Do Not Disturb hours, you&apos;ll still receive notifications but they won&apos;t make sounds or show previews.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="types" className="mt-6 space-y-6">
                        <div className="space-y-6">
                            <Accordion type="single" collapsible className="w-full space-y-2">
                                {notificationTypes.map((config) => (
                                    <AccordionItem
                                        key={config.type}
                                        value={config.type}
                                        className="mb-2 overflow-hidden border border-b-0 rounded-md border-amber-900/30 bg-black/20"
                                    >
                                        <AccordionTrigger className="px-4 py-3 hover:bg-amber-900/10 hover:no-underline">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", getIconContainerClass(config.color))}>
                                                    {config.icon}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-medium text-amber-200">{config.label}</h4>
                                                    <p className="text-xs text-gray-400">{config.description}</p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4">
                                            <NotificationTypeSetting
                                                config={config}
                                                preferences={formValues}
                                                onChange={handleTypeChange}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between pt-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    className="text-amber-400 border-amber-800/40 hover:bg-amber-900/20 hover:text-amber-300"
                                >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Reset
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs bg-black/90 border-amber-800/50 text-amber-200">
                                Reset to current settings
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button
                        onClick={() => handleSubmit()}
                        disabled={isSaving}
                        className={cn(
                            "relative overflow-hidden",
                            saveStatus === 'success' && "bg-green-600 hover:bg-green-700",
                            saveStatus === 'error' && "bg-red-600 hover:bg-red-700"
                        )}
                    >
                        {getSaveButtonContent()}

                        {/* Premium gold shimmer for save button */}
                        {(() => {
                            const animationProps = !isSaving && saveStatus === 'idle'
                                ? {
                                    translateX: ['100%', '-100%'],
                                    opacity: [0, 0.5, 0]
                                }
                                : {};

                            return (
                                <motion.div
                                    className="absolute inset-0 -translate-x-full opacity-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
                                    initial={false}
                                    animate={animationProps}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                                />
                            );
                        })()}
                    </Button>
                </div>
            </div>
        );
    };

    // Render as dialog or standard component
    return isDialog ? (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="bg-gradient-to-b from-black to-gray-900/95 border-amber-800/30 max-w-[550px] p-6">
                <DialogTitle className="text-xl font-semibold text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text">
                    Notification Preferences
                </DialogTitle>

                {renderContent()}

                <DialogFooter className="flex justify-end gap-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={onCloseAction}
                        className="text-gray-300 border-gray-700 hover:bg-gray-900/50"
                    >
                        Cancel
                    </Button>

                    {/* Extract nested ternary into separate variable */}
                    {(() => {
                        const buttonText = saveStatus === 'success'
                            ? 'Saved!'
                            : (isSaving ? 'Saving...' : 'Save Preferences');

                        const buttonClassName = saveStatus === 'success'
                            ? "bg-green-600 hover:bg-green-700"
                            : "";

                        return (
                            <Button
                                onClick={() => handleSubmit()}
                                disabled={isSaving}
                                className={buttonClassName}
                            >
                                {buttonText}
                            </Button>
                        );
                    })()}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ) : (
        <div className="p-6 border rounded-lg bg-gradient-to-b from-black to-gray-900/95 border-amber-800/30">
            {renderContent()}
        </div>
    );
}

export default NotificationPreferences;