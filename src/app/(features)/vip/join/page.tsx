'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useInView } from 'react-intersection-observer'
import {
    motion,
    useAnimation,
    useScroll,
    useTransform,
    type Variants
} from 'framer-motion'
import {
    Crown,
    Diamond,
    ChevronRight,
    Star,
    Gift,
    Trophy,
    ShieldCheck,
    Clock,
    ArrowRight,
    Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import gsap from 'gsap'

// Form schema
const vipFormSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    preferredContact: z.enum(['email', 'phone']).default('email'),
    interests: z.array(z.string()).optional(),
    termsAccepted: z.boolean().refine(val => val === true, {
        message: 'You must accept the terms and conditions',
    }),
})

type VipFormValues = z.infer<typeof vipFormSchema>

// Animation variants
const fadeInUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 80,
            damping: 15,
            delay: custom * 0.1,
        },
    }),
}

const glowVariants: Variants = {
    initial: { opacity: 0.7, scale: 1 },
    animate: {
        opacity: [0.7, 0.9, 0.7],
        scale: [1, 1.05, 1],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
}

const cardHoverVariants: Variants = {
    initial: {
        boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
        y: 0,
    },
    hover: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        y: -5,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
        },
    },
}

const buttonVariants: Variants = {
    initial: { scale: 1 },
    hover: {
        scale: 1.05,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10
        }
    },
    tap: {
        scale: 0.98,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10
        }
    }
}

// Animated section component
const AnimatedSection = ({
    children,
    delay = 0,
    className = '',
}: {
    children: React.ReactNode
    delay?: number
    className?: string
}) => {
    const controls = useAnimation()
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    useEffect(() => {
        if (inView) {
            controls.start('visible')
        }
    }, [controls, inView])

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            custom={delay}
            variants={fadeInUpVariants}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Benefit card component
const BenefitCard = ({
    icon,
    title,
    description,
    delay = 0
}: {
    icon: React.ReactNode
    title: string
    description: string
    delay?: number
}) => {
    return (
        <AnimatedSection delay={delay}>
            <motion.div
                variants={cardHoverVariants}
                initial="initial"
                whileHover="hover"
                className="relative p-6 overflow-hidden border rounded-xl bg-black/40 border-gold-500/20 backdrop-blur-sm"
            >
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-900/10 to-amber-500/10" />
                <div className="absolute inset-0 bg-[url('/texture/card-texture.png')] opacity-5 z-0" />

                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 text-white rounded-full bg-gradient-to-br from-amber-600 to-amber-800">
                        {icon}
                    </div>
                    <h3 className="text-xl font-semibold text-amber-300">{title}</h3>
                    <p className="text-amber-100/90">{description}</p>
                </div>
            </motion.div>
        </AnimatedSection>
    )
}

export default function VIPJoinPage() {
    // Scroll-driven animation
    const { scrollYProgress } = useScroll()
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9])
    const y = useTransform(scrollYProgress, [0, 0.2], [0, -50])

    // Particle effects
    const particlesRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!particlesRef.current) return

        const particles = particlesRef.current.querySelectorAll('.particle')

        particles.forEach((particle) => {
            const randomX = Math.random() * 100 - 50
            const randomY = Math.random() * 100 - 50
            const randomDelay = Math.random() * 5
            const randomDuration = 5 + Math.random() * 10

            gsap.set(particle, {
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: Math.random() * 0.5 + 0.1,
            })

            gsap.to(particle, {
                x: `+=${randomX}`,
                y: `+=${randomY}`,
                opacity: Math.random() * 0.3 + 0.1,
                duration: randomDuration,
                delay: randomDelay,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            })
        })

        return () => {
            gsap.killTweensOf(particles)
        }
    }, [])

    // Form handling
    const form = useForm<VipFormValues>({
        resolver: zodResolver(vipFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            preferredContact: 'email',
            interests: [],
            termsAccepted: false,
        },
    })

    const onSubmit = (values: VipFormValues) => {
        console.log(values)
        // Submit form data to API
    }

    return (
        <>
            {/* Hero section with parallax effect */}
            <section className="relative min-h-screen overflow-hidden">
                {/* Background - layered for depth */}
                <div className="absolute inset-0 z-0 bg-black" />
                <div className="absolute inset-0 bg-[url('/texture/wooden-table.png')] bg-cover opacity-20 z-10" />
                <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/80 via-black/60 to-black" />

                {/* Gold particle effects */}
                <div ref={particlesRef} className="absolute inset-0 z-30 overflow-hidden">
                    {Array.from({ length: 30 }).map(() => (
                        <div
                            key={`particle-${Math.random().toString(36).substring(2, 11)}`}
                            className="absolute w-2 h-2 rounded-full opacity-0 particle bg-amber-500"
                        />
                    ))}
                </div>

                {/* Hero content */}
                <div className="container relative z-40 flex flex-col items-center justify-center min-h-screen px-4 pt-32 pb-24 mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ opacity, scale, y }}
                        className="space-y-6 text-center"
                    >
                        <motion.div
                            variants={glowVariants}
                            initial="initial"
                            animate="animate"
                            className="inline-flex items-center justify-center mb-4"
                        >
                            <Crown className="w-16 h-16 text-amber-400" />
                        </motion.div>

                        <h1 className="text-4xl font-bold text-transparent md:text-6xl lg:text-7xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-200 bg-clip-text">
                            Royal VIP Experience
                        </h1>

                        <p className="max-w-3xl mx-auto text-lg leading-relaxed md:text-xl text-amber-100/90">
                            Join our exclusive VIP program and elevate your Royal Blackjack Casino experience
                            with premium benefits, personal concierge service, and exceptional rewards.
                        </p>

                        <motion.div
                            variants={buttonVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                        >
                            <Button
                                size="lg"
                                className="mt-8 text-white border-none shadow-lg bg-gradient-to-r from-amber-700 to-amber-500 hover:from-amber-600 hover:to-amber-400 shadow-amber-900/20"
                            >
                                <span>Explore VIP Benefits</span>
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Decorative cards */}
                    <div className="absolute hidden transform bottom-10 left-10 -rotate-12 md:block">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 0.6, x: 0 }}
                            transition={{ delay: 0.8, duration: 1 }}
                        >
                            <Image
                                src="/images/vip-blackjack.svg"
                                alt="VIP Card"
                                width={180}
                                height={240}
                                className="drop-shadow-2xl"
                            />
                        </motion.div>
                    </div>

                    <div className="absolute hidden transform bottom-40 right-10 rotate-12 md:block">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 0.6, x: 0 }}
                            transition={{ delay: 1, duration: 1 }}
                        >
                            <Image
                                src="/images/Classic-blackjack.svg"
                                alt="Classic Card"
                                width={160}
                                height={200}
                                className="drop-shadow-2xl"
                            />
                        </motion.div>
                    </div>

                    {/* Scroll indicator */}
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute transform -translate-x-1/2 bottom-10 left-1/2"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-sm text-amber-400/70">Scroll to Explore</span>
                            <ChevronRight className="w-6 h-6 mt-2 transform rotate-90 text-amber-400/70" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Benefits section */}
            <section className="relative py-24 bg-black">
                <div className="absolute inset-0 bg-[url('/texture/wooden-table.png')] bg-cover opacity-10 z-0" />
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/90 to-black/80" />

                <div className="container relative z-20 px-4 mx-auto">
                    <AnimatedSection className="mb-16 text-center">
                        <h2 className="mb-6 text-3xl font-bold md:text-4xl text-amber-300">Exclusive VIP Benefits</h2>
                        <p className="max-w-3xl mx-auto text-lg text-amber-100/80">
                            Experience the ultimate luxury with our comprehensive suite of VIP member benefits,
                            designed to make every moment at Royal Blackjack Casino extraordinary.
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <BenefitCard
                            icon={<Diamond className="w-6 h-6" />}
                            title="Premium Bonuses"
                            description="Enjoy enhanced deposit bonuses, cashback offers, and exclusive promotional opportunities."
                            delay={0.1}
                        />
                        <BenefitCard
                            icon={<Gift className="w-6 h-6" />}
                            title="Luxury Gifts"
                            description="Receive personalized gifts, event invitations, and special surprises on special occasions."
                            delay={0.2}
                        />
                        <BenefitCard
                            icon={<Trophy className="w-6 h-6" />}
                            title="Priority Service"
                            description="Skip the line with dedicated support, faster withdrawals, and personalized assistance."
                            delay={0.3}
                        />
                        <BenefitCard
                            icon={<ShieldCheck className="w-6 h-6" />}
                            title="Account Protection"
                            description="Advanced security measures and monitoring to keep your gaming experience safe."
                            delay={0.4}
                        />
                        <BenefitCard
                            icon={<Star className="w-6 h-6" />}
                            title="Higher Limits"
                            description="Enjoy elevated betting limits designed specifically for high-stakes players."
                            delay={0.5}
                        />
                        <BenefitCard
                            icon={<Clock className="w-6 h-6" />}
                            title="24/7 Concierge"
                            description="Around-the-clock personal assistance for all your gaming and account needs."
                            delay={0.6}
                        />
                    </div>
                </div>
            </section>

            {/* Tier comparison section */}
            <section className="relative py-24 bg-gradient-to-b from-black to-amber-950/30">
                <div className="absolute inset-0 bg-[url('/texture/cards-texture.png')] bg-cover opacity-5 z-0" />

                <div className="container relative z-10 px-4 mx-auto">
                    <AnimatedSection className="mb-16 text-center">
                        <h2 className="mb-6 text-3xl font-bold md:text-4xl text-amber-300">VIP Membership Tiers</h2>
                        <p className="max-w-3xl mx-auto text-lg text-amber-100/80">
                            Explore our tiered VIP program, each level offering increasingly prestigious benefits
                            designed to reward your loyalty and enhance your gaming experience.
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 gap-8 mt-16 md:grid-cols-3">
                        {/* Gold Tier */}
                        <AnimatedSection delay={0.1}>
                            <motion.div
                                variants={cardHoverVariants}
                                initial="initial"
                                whileHover="hover"
                                className="relative overflow-hidden border rounded-xl border-amber-700/30 backdrop-blur-sm"
                            >
                                <div className="absolute inset-0 z-0 bg-gradient-to-b from-amber-950/80 to-black/90" />

                                <div className="relative z-10 p-8">
                                    <div className="mb-6 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-amber-600 to-amber-800">
                                            <Star className="w-8 h-8 text-amber-200" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-amber-500">Gold Tier</h3>
                                    </div>

                                    <ul className="mb-8 space-y-4">
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">10% Enhanced deposit bonuses</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Weekly cashback up to 5%</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Priority email support</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Birthday bonus</span>
                                        </li>
                                    </ul>

                                    <div className="text-center">
                                        <motion.div
                                            variants={buttonVariants}
                                            initial="initial"
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            <Button
                                                className="w-full text-white bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500"
                                            >
                                                Join Gold Tier
                                            </Button>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatedSection>

                        {/* Platinum Tier */}
                        <AnimatedSection delay={0.2}>
                            <motion.div
                                variants={cardHoverVariants}
                                initial="initial"
                                whileHover="hover"
                                className="relative z-10 overflow-hidden transform scale-105 border rounded-xl border-amber-500/40 backdrop-blur-sm"
                            >
                                <div className="absolute inset-0 z-0 bg-gradient-to-b from-amber-900/80 to-black/90" />
                                <div className="absolute top-0 left-0 right-0 py-2 font-medium text-center text-white bg-gradient-to-r from-amber-600 to-amber-500">
                                    Most Popular
                                </div>

                                <div className="relative z-10 p-8 pt-12">
                                    <div className="mb-6 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-700">
                                            <Diamond className="w-8 h-8 text-amber-100" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-amber-400">Platinum Tier</h3>
                                    </div>

                                    <ul className="mb-8 space-y-4">
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">25% Enhanced deposit bonuses</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Weekly cashback up to 10%</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Priority live chat & email support</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Birthday & anniversary bonuses</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Personal account manager</span>
                                        </li>
                                    </ul>

                                    <div className="text-center">
                                        <motion.div
                                            variants={buttonVariants}
                                            initial="initial"
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            <Button
                                                className="w-full font-medium text-black bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300"
                                            >
                                                Join Platinum Tier
                                            </Button>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatedSection>

                        {/* Black Diamond Tier */}
                        <AnimatedSection delay={0.3}>
                            <motion.div
                                variants={cardHoverVariants}
                                initial="initial"
                                whileHover="hover"
                                className="relative overflow-hidden border rounded-xl border-amber-300/30 backdrop-blur-sm"
                            >
                                <div className="absolute inset-0 z-0 bg-gradient-to-b from-amber-950/80 to-black/90" />

                                <div className="relative z-10 p-8">
                                    <div className="mb-6 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
                                            <Crown className="w-8 h-8 text-black" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-amber-300">Black Diamond</h3>
                                    </div>

                                    <ul className="mb-8 space-y-4">
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">50% Enhanced deposit bonuses</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Weekly cashback up to 20%</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">24/7 VIP concierge service</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Exclusive event invitations</span>
                                        </li>
                                        <li className="flex items-start">
                                            <ChevronRight className="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
                                            <span className="ml-2 text-amber-100/90">Luxury gifts & faster withdrawals</span>
                                        </li>
                                    </ul>

                                    <div className="text-center">
                                        <motion.div
                                            variants={buttonVariants}
                                            initial="initial"
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            <Button
                                                className="w-full font-medium text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200"
                                            >
                                                Join Black Diamond
                                            </Button>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Registration form section */}
            <section className="relative py-24 bg-black">
                <div className="absolute inset-0 bg-[url('/texture/wooden-table.png')] bg-cover opacity-10 z-0" />
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/90 to-black/80" />

                <div className="container relative z-20 px-4 mx-auto">
                    <div className="max-w-3xl mx-auto">
                        <AnimatedSection className="mb-12 text-center">
                            <h2 className="mb-6 text-3xl font-bold md:text-4xl text-amber-300">Join Our VIP Program</h2>
                            <p className="text-lg text-amber-100/80">
                                Complete the form below to apply for VIP membership. Our team will review your
                                application and contact you within 24 hours.
                            </p>
                        </AnimatedSection>

                        <AnimatedSection delay={0.2}>
                            <div className="relative p-8 overflow-hidden rounded-xl">
                                <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-950/60 to-black/80" />
                                <div className="absolute inset-0 bg-[url('/texture/card-texture.png')] opacity-5 z-0" />

                                <div className="relative z-10">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name="firstName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-amber-200">First Name</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter your first name"
                                                                    className="bg-black/50 border-amber-800/50 focus:border-amber-500 text-amber-100"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-red-400" />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="lastName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-amber-200">Last Name</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter your last name"
                                                                    className="bg-black/50 border-amber-800/50 focus:border-amber-500 text-amber-100"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-red-400" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-amber-200">Email Address</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter your email address"
                                                                className="bg-black/50 border-amber-800/50 focus:border-amber-500 text-amber-100"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-amber-200">Phone Number (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter your phone number"
                                                                className="bg-black/50 border-amber-800/50 focus:border-amber-500 text-amber-100"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-amber-200/60">
                                                            For VIP concierge contact purposes only
                                                        </FormDescription>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="termsAccepted"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start p-4 space-x-3 space-y-0 rounded-md bg-black/30">
                                                        <FormControl>
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 rounded accent-amber-500"
                                                                title="Accept Terms and Conditions"
                                                                checked={field.value}
                                                                onChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="text-amber-200">
                                                                I agree to the Terms and Conditions of the VIP Program
                                                            </FormLabel>
                                                            <FormDescription className="text-amber-200/60">
                                                                By joining, you agree to our <Link href="#" className="text-amber-400 hover:underline">Privacy Policy</Link> and <Link href="#" className="text-amber-400 hover:underline">VIP Terms</Link>
                                                            </FormDescription>
                                                        </div>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />

                                            <motion.div
                                                variants={buttonVariants}
                                                initial="initial"
                                                whileHover="hover"
                                                whileTap="tap"
                                                className="flex justify-center"
                                            >
                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    className="w-full px-8 font-medium text-black md:w-auto bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300"
                                                >
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    <span>Submit Application</span>
                                                </Button>
                                            </motion.div>
                                        </form>
                                    </Form>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* FAQ section */}
            <section className="relative py-24 bg-gradient-to-b from-black to-amber-950/20">
                <div className="absolute inset-0 bg-[url('/texture/cards-texture.png')] bg-cover opacity-5 z-0" />

                <div className="container relative z-10 px-4 mx-auto">
                    <AnimatedSection className="mb-16 text-center">
                        <h2 className="mb-6 text-3xl font-bold md:text-4xl text-amber-300">Frequently Asked Questions</h2>
                        <p className="max-w-3xl mx-auto text-lg text-amber-100/80">
                            Everything you need to know about our VIP program. If you have additional questions,
                            please contact our dedicated VIP support team.
                        </p>
                    </AnimatedSection>

                    <AnimatedSection delay={0.2} className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="space-y-4">
                            <AccordionItem value="item-1" className="overflow-hidden border rounded-lg border-amber-800/30 bg-black/30">
                                <AccordionTrigger className="px-6 py-4 text-left text-amber-200 hover:text-amber-400">
                                    How do I qualify for VIP status?
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4 text-amber-100/90">
                                    VIP status is awarded based on your playing activity, deposit history, and overall engagement
                                    with Royal Blackjack Casino. You can apply through this form, or receive an invitation from
                                    our VIP team once you meet the qualification criteria.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2" className="overflow-hidden border rounded-lg border-amber-800/30 bg-black/30">
                                <AccordionTrigger className="px-6 py-4 text-left text-amber-200 hover:text-amber-400">
                                    What benefits do VIP members receive?
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4 text-amber-100/90">
                                    VIP members enjoy enhanced bonuses, dedicated support, faster withdrawals, exclusive promotions,
                                    personalized gifts, higher betting limits, special event invitations, and much more. Benefits
                                    increase with each VIP tier.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3" className="overflow-hidden border rounded-lg border-amber-800/30 bg-black/30">
                                <AccordionTrigger className="px-6 py-4 text-left text-amber-200 hover:text-amber-400">
                                    Can I upgrade my VIP tier?
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4 text-amber-100/90">
                                    Yes! VIP tiers are regularly reviewed based on your continued activity and loyalty.
                                    Your personal VIP manager will notify you when you become eligible for an upgrade to
                                    the next tier with enhanced benefits.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4" className="overflow-hidden border rounded-lg border-amber-800/30 bg-black/30">
                                <AccordionTrigger className="px-6 py-4 text-left text-amber-200 hover:text-amber-400">
                                    How long does VIP status last?
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4 text-amber-100/90">
                                    VIP status is reviewed quarterly, but loyal members typically maintain their status
                                    indefinitely as long as they remain active players. Your VIP manager will keep you
                                    informed about your status and any requirements to maintain it.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-5" className="overflow-hidden border rounded-lg border-amber-800/30 bg-black/30">
                                <AccordionTrigger className="px-6 py-4 text-left text-amber-200 hover:text-amber-400">
                                    Who do I contact for VIP support?
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4 text-amber-100/90">
                                    As a VIP member, you&apos;ll be assigned a dedicated account manager who will be your direct
                                    point of contact. Additionally, you&apos;ll have access to our priority support channels
                                    via email, phone, and live chat, depending on your VIP tier.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </AnimatedSection>
                </div>
            </section>

            {/* CTA section */}
            <section className="relative py-24 bg-gradient-to-b from-amber-950/20 to-black">
                <div className="absolute inset-0 bg-[url('/texture/wooden-table.png')] bg-cover opacity-10 z-0" />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/70 to-black/90" />

                <div className="container relative z-20 px-4 mx-auto">
                    <AnimatedSection className="max-w-4xl mx-auto space-y-8 text-center">
                        <motion.div
                            variants={glowVariants}
                            initial="initial"
                            animate="animate"
                            className="inline-flex items-center justify-center mb-4"
                        >
                            <Trophy className="w-16 h-16 text-amber-400" />
                        </motion.div>

                        <h2 className="text-3xl font-bold text-transparent md:text-5xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-200 bg-clip-text">
                            Ready to Elevate Your Gaming Experience?
                        </h2>

                        <p className="max-w-3xl mx-auto text-lg md:text-xl text-amber-100/90">
                            Take the first step towards a world of exclusive privileges and exceptional service.
                            Join our VIP program today and experience the Royal Blackjack Casino difference.
                        </p>

                        <motion.div
                            variants={buttonVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            className="pt-6"
                        >
                            <Button
                                size="lg"
                                className="h-auto px-8 py-6 text-lg font-medium text-black bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300"
                            >
                                <span>Apply for VIP Membership</span>
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </motion.div>
                    </AnimatedSection>
                </div>
            </section>
        </>
    )
}