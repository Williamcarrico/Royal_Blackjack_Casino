'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Icons
import {
    ChevronRight,
    PlayCircle,
    Info,
    Award,
    DollarSign,
    Sparkles,
    BookOpen,
    Zap,
    ArrowRight,
    Check
} from 'lucide-react';

// Tutorial Components
import TutorialStep from '@/components/tutorial/TutorialStep';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: (custom: number) => ({
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24,
            delay: custom * 0.1
        }
    }),
    hover: {
        y: -10,
        scale: 1.03,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 10
        }
    },
    tap: {
        scale: 0.98,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        transition: {
            type: "spring",
            stiffness: 500,
            damping: 10
        }
    }
};

const floatingCardVariants = {
    initial: { y: 0 },
    float: {
        y: [-10, 10],
        transition: {
            y: {
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
            }
        }
    }
};

const shimmerVariants = {
    initial: { x: "-100%", opacity: 0 },
    animate: {
        x: "100%",
        opacity: [0, 1, 0],
        transition: {
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
        }
    }
};

// Create ambient particles effect
const Particles = () => {
    // Generate stable IDs for particles
    const particleIds = useRef(Array.from({ length: 30 }, () => crypto.randomUUID()));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particleIds.current.map((id) => (
                <motion.div
                    key={id}
                    className="absolute w-1 h-1 rounded-full bg-amber-500/20"
                    initial={{
                        x: Math.random() * 100 + "%",
                        y: -10,
                        opacity: Math.random() * 0.5 + 0.3
                    }}
                    animate={{
                        y: "120%",
                        opacity: 0
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        delay: Math.random() * 5
                    }}
                    style={{ left: `${Math.random() * 100}%` }}
                />
            ))}
        </div>
    );
};

// Define tutorial steps
const tutorialSteps = [
    {
        id: 'welcome',
        title: 'Welcome to Royal Blackjack',
        description: 'Learn the rules and strategies to conquer the blackjack tables with finesse and precision.'
    },
    {
        id: 'objective',
        title: 'Game Objective',
        description: 'Beat the dealer by getting a hand value closer to 21 without going over.'
    },
    {
        id: 'card-values',
        title: 'Card Values',
        description: 'Number cards are worth their number, face cards are worth 10, and Aces can be worth 1 or 11.'
    },
    {
        id: 'gameplay',
        title: 'Gameplay Flow',
        description: 'First place your bet, receive two cards, then decide whether to hit, stand, double down, or split.'
    },
    {
        id: 'actions',
        title: 'Player Actions',
        description: 'Learn what each action does and when to use it strategically.'
    },
    {
        id: 'strategy',
        title: 'Basic Strategy',
        description: 'Learn the mathematically optimal decisions for every possible hand combination.'
    },
    {
        id: 'advanced',
        title: 'Advanced Techniques',
        description: 'Explore card counting, betting strategies, and other professional techniques.'
    }
];

const TutorialPage = () => {
    const router = useRouter();
    const _controls = useAnimation();
    const [currentStep, setCurrentStep] = useState(0);
    const [activeTab, setActiveTab] = useState('learn');
    const [isIntroAnimationComplete, setIsIntroAnimationComplete] = useState(false);
    const [showGuidedTutorial, setShowGuidedTutorial] = useState(false);
    const [progress, setProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle intro animation completion
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsIntroAnimationComplete(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Update progress based on current step
    useEffect(() => {
        setProgress((currentStep / (tutorialSteps.length - 1)) * 100);
    }, [currentStep]);

    // Handle next step
    const handleNextStep = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setShowGuidedTutorial(false);
        }
    };

    // Handle previous step
    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Handle skip tutorial
    const handleSkipTutorial = () => {
        setShowGuidedTutorial(false);
    };

    // Handle start game
    const handleStartGame = () => {
        router.push('/game/blackjack');
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-black">
            {/* Ambient lighting and effects */}
            <div
                className="absolute inset-0 pointer-events-none bg-blend-overlay"
                style={{
                    backgroundImage: `radial-gradient(circle at 50% 20%, rgba(236, 72, 153, 0.15), transparent 70%),
                            radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.15), transparent 50%)`,
                    opacity: 0.7,
                    mixBlendMode: 'color-dodge'
                }}
            />

            <Particles />

            {/* Vegas-style decorative elements */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />

            {/* Header with logo */}
            <header className="relative z-10 flex items-center justify-center p-6 md:p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative"
                >
                    <Image
                        src="/images/Royal-Blackjack-Logo.png"
                        alt="Royal Edge Casino"
                        width={180}
                        height={60}
                        className="w-auto h-12 md:h-16"
                        priority
                    />
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={shimmerVariants.animate}
                        initial={shimmerVariants.initial}
                        style={{ maskImage: 'linear-gradient(to right, transparent, black, transparent)' }}
                    />
                </motion.div>
            </header>

            {/* Main content */}
            <main
                ref={containerRef}
                className="container relative z-10 px-4 pt-4 pb-20 mx-auto"
            >
                {/* Intro animation */}
                <AnimatePresence>
                    {!isIntroAnimationComplete && (
                        <motion.div
                            className="absolute inset-0 z-50 flex items-center justify-center bg-black"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.2, opacity: 0 }}
                                transition={{ duration: 1.2 }}
                                className="text-center"
                            >
                                <Image
                                    src="/images/Royal-Blackjack-Logo.png"
                                    alt="Royal Edge Casino"
                                    width={300}
                                    height={100}
                                    className="w-auto h-32 mx-auto mb-6 md:h-40"
                                    priority
                                />
                                <motion.h1
                                    className="font-serif text-2xl md:text-3xl text-amber-400"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    Master the Art of Blackjack
                                </motion.h1>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs navigation */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="max-w-4xl mx-auto mt-4 mb-8"
                >
                    <TabsList className="grid w-full grid-cols-3 mb-8 border bg-black/50 border-slate-700 backdrop-blur-sm">
                        <TabsTrigger value="learn" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                            Learn
                        </TabsTrigger>
                        <TabsTrigger value="practice" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                            Practice
                        </TabsTrigger>
                        <TabsTrigger value="advanced" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                            Advanced
                        </TabsTrigger>
                    </TabsList>

                    {/* Learn Tab Content */}
                    <TabsContent value="learn">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-8"
                        >
                            {/* Hero section */}
                            <motion.div
                                variants={itemVariants}
                                className="relative overflow-hidden border bg-gradient-to-br from-black to-slate-800 rounded-2xl border-slate-700 backdrop-blur-md"
                            >
                                <div className="absolute inset-0 overflow-hidden">
                                    <Image
                                        src="/public/images/classic-blackjack.png"
                                        alt="Blackjack cards"
                                        fill
                                        className="object-cover opacity-20"
                                    />
                                </div>
                                <div className="relative z-10 flex flex-col items-center p-6 md:p-10 md:flex-row">
                                    <div className="mb-6 md:w-1/2 md:mb-0 md:pr-8">
                                        <Badge
                                            className="px-3 py-1 mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30"
                                        >
                                            Interactive Tutorial
                                        </Badge>
                                        <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                                            Master the Art of <span className="text-amber-400">Blackjack</span>
                                        </h1>
                                        <p className="mb-6 text-slate-300">
                                            From novice to high-roller, our comprehensive tutorial will guide you through the
                                            rules, strategies, and techniques used by casino professionals.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <Button
                                                onClick={() => setShowGuidedTutorial(true)}
                                                className="font-medium text-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                                            >
                                                <PlayCircle className="w-4 h-4 mr-2" />
                                                Start Guided Tutorial
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleStartGame}
                                                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                                            >
                                                <ChevronRight className="w-4 h-4 mr-2" />
                                                Skip to Game
                                            </Button>
                                        </div>
                                    </div>
                                    <motion.div
                                        className="relative h-48 md:w-1/2 md:h-64"
                                        variants={floatingCardVariants}
                                        initial="initial"
                                        animate="float"
                                    >
                                        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 rotate-12">
                                            <Image
                                                src="public/card/fronts/spades_ace.svg"
                                                alt="Ace of Spades"
                                                width={120}
                                                height={170}
                                                className="drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                                            />
                                        </div>
                                        <div className="absolute transform -translate-x-1/2 translate-y-5 top-1/2 left-1/2 -rotate-15">
                                            <Image
                                                src="public/card/fronts/hearts_king.svg"
                                                alt="King of Hearts"
                                                width={120}
                                                height={170}
                                                className="drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                                            />
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Tutorial cards */}
                            <motion.h2
                                variants={itemVariants}
                                className="mt-12 mb-6 text-2xl font-bold text-white"
                            >
                                Learning Modules <span className="text-amber-400">→</span>
                            </motion.h2>

                            <motion.div
                                variants={itemVariants}
                                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                            >
                                {tutorialSteps.map((step, index) => (
                                    <motion.div
                                        key={step.id}
                                        custom={index}
                                        variants={cardVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        className="group"
                                    >
                                        <Card className="h-full transition-all duration-300 border-slate-700 bg-black/40 backdrop-blur-sm hover:bg-slate-900/60">
                                            <div className="p-6">
                                                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-amber-500/20">
                                                    {index === 0 && <Info className="w-6 h-6 text-amber-400" />}
                                                    {index === 1 && <Award className="w-6 h-6 text-amber-400" />}
                                                    {index === 2 && <DollarSign className="w-6 h-6 text-amber-400" />}
                                                    {index === 3 && <PlayCircle className="w-6 h-6 text-amber-400" />}
                                                    {index === 4 && <BookOpen className="w-6 h-6 text-amber-400" />}
                                                    {index === 5 && <Sparkles className="w-6 h-6 text-amber-400" />}
                                                    {index === 6 && <Zap className="w-6 h-6 text-amber-400" />}
                                                </div>
                                                <h3 className="mb-2 text-xl font-bold text-white transition-colors group-hover:text-amber-400">
                                                    {step.title}
                                                </h3>
                                                <p className="mb-4 text-sm text-slate-400">
                                                    {step.description}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-0 mt-auto transition-transform text-amber-400 hover:text-amber-300 group-hover:translate-x-1"
                                                    onClick={() => {
                                                        setCurrentStep(index);
                                                        setShowGuidedTutorial(true);
                                                    }}
                                                >
                                                    Learn More
                                                    <ArrowRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Benefits section */}
                            <motion.div
                                variants={itemVariants}
                                className="p-6 mt-16 border bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-xl md:p-8"
                            >
                                <h2 className="mb-6 text-2xl font-bold text-white">
                                    Why Learn with <span className="text-amber-400">Royal Edge</span>
                                </h2>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                                    <div className="flex flex-col">
                                        <div className="flex items-center mb-3">
                                            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-green-500/20">
                                                <Check className="w-5 h-5 text-green-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">Interactive Learning</h3>
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            Our step-by-step tutorials provide hands-on practice and immediate feedback to accelerate your learning.
                                        </p>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center mb-3">
                                            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-blue-500/20">
                                                <Check className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">Professional Strategies</h3>
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            Learn the same techniques and strategies used by professional blackjack players in casinos worldwide.
                                        </p>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center mb-3">
                                            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-purple-500/20">
                                                <Check className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">Risk-Free Practice</h3>
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            Perfect your skills in a risk-free environment before putting real money on the line at the casino.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Call to action */}
                            <motion.div
                                variants={itemVariants}
                                className="mt-12 text-center"
                            >
                                <Button
                                    size="lg"
                                    onClick={handleStartGame}
                                    className="px-8 font-medium text-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                                >
                                    Start Playing Now
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </motion.div>
                        </motion.div>
                    </TabsContent>

                    {/* Practice Tab Content */}
                    <TabsContent value="practice">
                        <div className="py-12 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Image
                                    src="/images/practice-table.jpg"
                                    alt="Practice Blackjack"
                                    width={400}
                                    height={240}
                                    className="mx-auto mb-8 border-4 rounded-lg shadow-lg border-slate-700"
                                />
                                <h2 className="mb-4 text-2xl font-bold text-white">Practice Mode Coming Soon</h2>
                                <p className="max-w-md mx-auto mb-8 text-slate-400">
                                    Our interactive practice tables are being prepared. Soon you&apos;ll be able to practice
                                    your skills in real-time with guided feedback.
                                </p>
                                <Button
                                    onClick={handleStartGame}
                                    className="font-medium text-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                                >
                                    Try the Full Game Instead
                                </Button>
                            </motion.div>
                        </div>
                    </TabsContent>

                    {/* Advanced Tab Content */}
                    <TabsContent value="advanced">
                        <div className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="p-6 border bg-gradient-to-br from-slate-900 to-black border-slate-700 rounded-xl md:p-8"
                            >
                                <h2 className="flex items-center mb-6 text-2xl font-bold text-white">
                                    <Sparkles className="w-5 h-5 mr-2 text-amber-400" />
                                    Advanced Blackjack Techniques
                                </h2>

                                <div className="space-y-6">
                                    <div className="pb-4 border-b border-slate-700">
                                        <h3 className="mb-2 text-lg font-medium text-amber-400">Card Counting</h3>
                                        <p className="mb-3 text-slate-300">
                                            Master the art of tracking high and low cards to gain an edge over the house.
                                        </p>
                                        <Badge className="bg-slate-800 text-slate-300">Professional Technique</Badge>
                                    </div>

                                    <div className="pb-4 border-b border-slate-700">
                                        <h3 className="mb-2 text-lg font-medium text-amber-400">Betting Strategies</h3>
                                        <p className="mb-3 text-slate-300">
                                            Learn advanced betting systems like the Martingale, Paroli, and D&apos;Alembert.
                                        </p>
                                        <Badge className="bg-slate-800 text-slate-300">Bankroll Management</Badge>
                                    </div>

                                    <div className="pb-4 border-b border-slate-700">
                                        <h3 className="mb-2 text-lg font-medium text-amber-400">Shuffle Tracking</h3>
                                        <p className="mb-3 text-slate-300">
                                            Develop the ability to track card clumps through shuffles for predictive play.
                                        </p>
                                        <Badge className="bg-slate-800 text-slate-300">Expert Level</Badge>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 text-lg font-medium text-amber-400">Team Play</h3>
                                        <p className="mb-3 text-slate-300">
                                            Explore the strategies used by professional blackjack teams to beat casinos.
                                        </p>
                                        <Badge className="bg-slate-800 text-slate-300">Advanced Coordination</Badge>
                                    </div>
                                </div>

                                <div className="mt-8 text-center">
                                    <Button
                                        variant="outline"
                                        className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                                    >
                                        Unlock Advanced Training
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Guided tutorial overlay */}
            {showGuidedTutorial && (
                <TutorialStep
                    title={currentStep < tutorialSteps.length && tutorialSteps[currentStep] ? tutorialSteps[currentStep].title : ''}
                    description={currentStep < tutorialSteps.length && tutorialSteps[currentStep] ? tutorialSteps[currentStep].description : ''}
                    stepNumber={currentStep + 1}
                    totalSteps={tutorialSteps.length}
                    isActive={showGuidedTutorial}
                    position="center"
                    stepType="info"
                    onNext={handleNextStep}
                    onPrev={handlePrevStep}
                    onSkip={handleSkipTutorial}
                    onComplete={() => setShowGuidedTutorial(false)}
                    className="backdrop-blur-md"
                >
                    <div className="mt-4 mb-2">
                        <Progress value={progress} className="h-1 bg-slate-700" />
                    </div>
                </TutorialStep>
            )}

            {/* Fixed bottom navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-20 py-4 bg-gradient-to-t from-black to-transparent">
                <div className="container px-4 mx-auto">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center text-sm text-slate-400 hover:text-white">
                            <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                            Back to Home
                        </Link>

                        <Button
                            onClick={handleStartGame}
                            className="font-medium text-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                        >
                            Play Blackjack Now
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialPage;