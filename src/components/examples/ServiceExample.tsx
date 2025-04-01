'use client';

import React, { useEffect, useState } from 'react';
import { useServiceProvider } from '../../hooks/useServiceProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
// Import the actual values, not just the type
import { BUTTON_CLICK, WIN, ERROR, GAME_START } from '../../services/audio/soundEffects';

export default function ServiceExample() {
    const { services, isLoading, errors } = useServiceProvider();
    const [volume, setVolume] = useState(0.7);

    // Example of using the local storage service
    useEffect(() => {
        if (services.storage.isAvailable) {
            // Save volume to localStorage
            services.storage.setItem('audio_volume', volume);
        }
    }, [volume, services.storage]);

    // Example of loading volume from localStorage
    useEffect(() => {
        if (services.storage.isAvailable) {
            const savedVolume = services.storage.getNumber('audio_volume', 0.7);
            setVolume(savedVolume);

            if (services.audio.service) {
                services.audio.setMasterVolume(savedVolume);
            }
        }
    }, [services.storage, services.audio]);

    // Example of tracking a button click
    const handleClick = () => {
        if (services.analytics.service) {
            services.analytics.trackButtonClick('example_button', 'Example Button');
        }

            services.audio.playSound(BUTTON_CLICK);
        if (services.audio.service) {
            services.audio.playSound(BUTTON_CLICK);
        }
    };

    // Example of checking authentication
    const handleLogin = async () => {
        if (services.auth.service) {
            const result = await services.auth.login({
                email: 'example@example.com',
                password: 'password123'
            });

            if (result.success) {
                    services.audio.playSound(WIN);
                if (services.audio.service) {
                    services.audio.playSound(WIN);
                }
            } else {
                    services.audio.playSound(ERROR);
                if (services.audio.service) {
                    services.audio.playSound(ERROR);
                }
            }
        }
    };

    // Example of creating a game
    const createGame = async () => {
        if (services.game.service) {
            const result = await services.game.createGame({
                type: 'standard',
                betMin: 5,
                betMax: 1000
            });

            if (result.success) {
                    services.audio.playSound(GAME_START);
                if (services.audio.service) {
                    services.audio.playSound(GAME_START);
                }
            }
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center p-8">Loading services...</div>;
    }

    if (errors) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-red-500">
                    Error loading services:
                    <pre className="mt-2 text-sm">
                        {errors.map((error: Error) => (
                            <div key={`error-${error.name}-${error.message}`}>{error.message}</div>
                        ))}
                    </pre>
                </div>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Service Example</CardTitle>
                <CardDescription>Demonstrating service integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">Audio</h3>
                    <div className="flex items-center mt-2 space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => services.audio.toggleAudio()}
                        >
                            {services.audio.settings.audioEnabled ? 'Mute' : 'Unmute'}
                        </Button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => {
                                const newVolume = parseFloat(e.target.value);
                                setVolume(newVolume);
                                services.audio.setMasterVolume(newVolume);
                            }}
                            className="w-full"
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium">Authentication</h3>
                    <div className="mt-2">
                        {services.auth.isAuthenticated ? (
                            <div className="flex space-x-2">
                                <span>Logged in as {services.auth.user?.username || 'User'}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => services.auth.logout()}
                                >
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={handleLogin}>
                                Login (Demo)
                            </Button>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium">Game</h3>
                    <div className="mt-2">
                        {services.game.currentGame ? (
                            <div className="space-y-2">
                                <div>Active Game: {services.game.currentGame.id}</div>
                                <Button
                                    variant="outline"
                                    onClick={() => services.game.endGame()}
                                >
                                    End Game
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={createGame}>
                                Create Game
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleClick} className="w-full">
                    Test Services
                </Button>
            </CardFooter>
        </Card>
    );
}