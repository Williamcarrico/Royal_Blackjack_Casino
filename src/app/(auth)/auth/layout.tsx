'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'

export default function AuthLayout({ children }: { readonly children: ReactNode }) {
	// Handle theme initialization to reduce flash of incorrect theme
	const { setTheme, resolvedTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
		// Check user preference
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
		if (!resolvedTheme) {
			setTheme(prefersDark ? 'dark' : 'light')
		}
	}, [resolvedTheme, setTheme])

	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				when: 'beforeChildren',
				staggerChildren: 0.15,
				duration: 0.4,
				ease: 'easeOut',
			},
		},
		exit: {
			opacity: 0,
			transition: {
				when: 'afterChildren',
				staggerChildren: 0.05,
				staggerDirection: -1,
				duration: 0.3,
				ease: 'easeIn',
			},
		},
	}

	const childVariants = {
		hidden: { opacity: 0, y: 30 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				type: 'spring',
				damping: 15,
				stiffness: 100,
			},
		},
		exit: {
			opacity: 0,
			y: -20,
			transition: {
				duration: 0.2,
				ease: 'easeIn',
			},
		},
	}

	// Show nothing until mounted to prevent theme flickering
	if (!mounted) return null

	return (
		<div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
			{/* Background decorations */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				{/* Animated gradient orbs */}
				<div className="absolute -top-[40%] -left-[30%] w-[90%] h-[90%] bg-gradient-to-br from-indigo-100/30 via-purple-100/20 to-blue-100/30 dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-blue-900/20 blur-3xl rounded-full animate-slow-spin" />
				<div className="absolute -bottom-[40%] -right-[30%] w-[90%] h-[90%] bg-gradient-to-br from-blue-100/30 via-cyan-100/20 to-emerald-100/30 dark:from-blue-900/20 dark:via-cyan-900/10 dark:to-emerald-900/20 blur-3xl rounded-full animate-slow-spin-reverse" />

				{/* Subtle grid pattern */}
				<div className="absolute inset-0 bg-grid-slate-500/[0.02] bg-[size:20px_20px] dark:bg-grid-slate-400/[0.01]" />

				{/* Fine noise texture */}
				<div className="absolute inset-0 opacity-[0.02] bg-[url('/noise.png')] dark:opacity-[0.03]" />
			</div>

			{/* Content container with staggered animations */}
			<AnimatePresence mode="wait">
				<motion.div
					key="auth-container"
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					exit="exit"
					className="relative flex flex-col items-center justify-center min-h-screen px-4 py-20 sm:px-6 sm:py-24"
				>
					{/* Logo - shown before card */}
					<motion.div variants={childVariants} className="flex flex-col items-center mb-8">
						<div className="relative w-12 h-12 mb-3">
							{/* Replace with your actual logo */}
							<div className="flex items-center justify-center w-full h-full shadow-lg bg-gradient-to-tr from-primary to-purple-600 rounded-xl shadow-primary/20 dark:shadow-primary/10">
								<span className="text-2xl font-bold text-white">R</span>
							</div>
						</div>
						<h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
							Royal Edge Casino
						</h1>
					</motion.div>

					{/* Card with content */}
					<motion.div variants={childVariants} className="relative w-full max-w-md">
						{/* Card effect with enhanced shadow */}
						<div className="relative overflow-hidden border shadow-2xl rounded-xl border-slate-200/30 dark:border-slate-800/30 backdrop-blur-md bg-white/90 dark:bg-slate-900/80 dark:shadow-highlight-dark text-slate-900 dark:text-slate-100">
							{/* Top highlight effect */}
							<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/30 dark:via-slate-700/30 to-transparent" />

							{/* Content */}
							<div className="p-6 sm:p-8">{children}</div>

							{/* Bottom highlight effect */}
							<div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/20 dark:via-slate-700/20 to-transparent" />

							{/* Corner accents */}
							<div className="absolute top-0 left-0 w-16 h-16 rounded-br-full bg-gradient-to-br from-primary/5 to-transparent" />
							<div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-full bg-gradient-to-tl from-primary/5 to-transparent" />
						</div>
					</motion.div>

					{/* Footer with company info */}
					<motion.div variants={childVariants} className="mt-8 text-center">
						<p className="text-xs text-slate-500 dark:text-slate-400">
							<span className="font-semibold">Royal Edge Casino</span> © {new Date().getFullYear()}
						</p>
						<p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
							Premium blackjack experience
						</p>
					</motion.div>
				</motion.div>
			</AnimatePresence>
		</div>
	)
}
