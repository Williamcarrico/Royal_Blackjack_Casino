/** @jsxImportSource react */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/layout/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Search } from 'lucide-react'

// Define types for our data structures
interface TermSection {
	id: string
	title: string
	content: string[]
}

// Enhanced animation variants
const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
}

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring',
			stiffness: 300,
			damping: 24,
		},
	},
}

const fadeInUp: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			ease: [0.22, 1, 0.36, 1],
		},
	},
}

// Terms of service sections data
const sections: TermSection[] = [
	{
		id: 'definitions',
		title: '1. Definitions and Interpretation',
		content: [
			"1.1. 'Platform' refers to our advanced blackjack gaming application",
			"1.2. 'Services' encompasses all features, functionalities, and tools",
			"1.3. 'User' refers to any individual accessing or utilizing our platform",
			"1.4. 'Game Session' refers to any period of active gameplay",
			"1.5. 'Virtual Currency' refers to non-monetary in-game credits",
		],
	},
	{
		id: 'platform-access',
		title: '2. Platform Access and Licensing',
		content: [
			'2.1. License Grant: We grant you a limited, non-exclusive, non-transferable license',
			'2.2. Access Restrictions: Users must be of legal age in their jurisdiction',
			'2.3. Account Security: Users are responsible for maintaining account security',
			'2.4. Technical Requirements: Users must maintain compatible software/hardware',
			"2.5. Service Availability: We strive for 99.9% uptime but don't guarantee continuous access",
		],
	},
	{
		id: 'gameplay-rules',
		title: '3. Gameplay Rules and Fair Play',
		content: [
			'3.1. Game Integrity: Users must not exploit bugs or glitches',
			'3.2. Fair Play: Card counting and automated play are prohibited',
			'3.3. Virtual Currency: No real-money transactions are supported or allowed',
			'3.4. Session Limits: We may impose reasonable session time limits',
			'3.5. Game Modifications: We reserve the right to modify game rules with notice',
		],
	},
	{
		id: 'data-privacy',
		title: '4. Data Privacy and Security',
		content: [
			'4.1. Data Collection: We collect gameplay statistics and performance metrics',
			'4.2. Analytics: Anonymous data is used for game improvement',
			'4.3. Storage: Data is encrypted and stored securely',
			'4.4. Third Parties: Limited data sharing with essential service providers',
			'4.5. User Rights: GDPR and CCPA compliance for data access and deletion',
		],
	},
	{
		id: 'intellectual-property',
		title: '5. Intellectual Property Rights',
		content: [
			'5.1. Ownership: All game assets and code are our exclusive property',
			'5.2. User Content: Limited license granted for user-generated content',
			'5.3. Feedback: We may implement user suggestions without compensation',
			'5.4. Restrictions: No reverse engineering or unauthorized modifications',
			'5.5. Branding: All trademarks and logos are protected',
		],
	},
	{
		id: 'contact-information',
		title: '6. Contact Information',
		content: [
			'6.1. General Support: For general inquiries, contact support@dmscasinogaming.com',
			'6.2. Technical Issues: For technical assistance, contact technical@dmscasinogaming.com',
			'6.3. Executive Contact: For urgent matters requiring executive attention, contact our CEO at ceo@dmscasinogaming.com',
			'6.4. Response Time: We aim to respond to all inquiries within 2 business days',
			'6.5. Postal Address: DMS Casino Gaming, 123 Casino Boulevard, Suite 500, Las Vegas, NV 89109, USA',
		],
	},
]

export default function TermsOfServiceClient() {
	const [activeSection, setActiveSection] = useState<string>('')
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [lastUpdated] = useState<Date>(new Date())

	// Handle printing the terms of service
	const handlePrint = useCallback(() => {
		window.print()
	}, [])

	// Navigate to a specific section
	const handleNavigateToSection = useCallback((sectionId: string) => {
		setActiveSection(sectionId)
		document.getElementById(sectionId)?.scrollIntoView({
			behavior: 'smooth',
		})
	}, [])

	// Filter sections based on search query
	const filteredSections = useMemo(() => {
		if (!searchQuery.trim()) return sections

		return sections.filter(
			section =>
				section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				section.content.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	}, [searchQuery])

	return (
		<motion.main
			initial="hidden"
			animate="visible"
			variants={containerVariants}
			className="min-h-screen pt-16 text-gray-100 bg-gradient-to-b from-gray-900 via-gray-850 to-gray-800 print:bg-white print:text-black md:pt-24"
		>
			<motion.header
				className="py-16 mt-10 border-b border-gray-700/50 backdrop-blur-sm bg-black/10 scroll-mt-28"
				variants={itemVariants}
				aria-labelledby="terms-of-service-title"
				id="terms-header"
			>
				<div className="container px-4 mx-auto">
					<motion.h1
						id="terms-of-service-title"
						className="text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg"
						variants={fadeInUp}
					>
						Terms of Service
					</motion.h1>
					<motion.p
						className="max-w-2xl mx-auto mt-4 font-light text-center text-gray-300"
						variants={fadeInUp}
					>
						Please review our comprehensive terms of service that govern your use of our advanced
						blackjack gaming platform.
					</motion.p>
				</div>
			</motion.header>

			<motion.section className="container px-4 py-12 mx-auto" variants={itemVariants}>
				{/* Quick Navigation */}
				<motion.div className="mb-8 print:hidden" variants={fadeInUp}>
					<Card className="border-gray-700 bg-gray-800/30 backdrop-blur-sm">
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Quick Navigation</span>
								<div className="relative">
									<Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-2 top-1/2" />
									<input
										type="text"
										placeholder="Search terms..."
										value={searchQuery}
										onChange={e => setSearchQuery(e.target.value)}
										className="w-48 py-1 pl-8 pr-4 text-sm border border-gray-700 rounded-md bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										aria-label="Search terms of service"
									/>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{sections.map(section => (
									<TooltipProvider key={section.id}>
										<Tooltip>
											<TooltipTrigger asChild>
												<Badge
													variant="outline"
													className="p-2 transition-colors border-gray-600 cursor-pointer hover:bg-gray-700"
													onClick={() => handleNavigateToSection(section.id)}
												>
													{section.title.split('.')[0]}
												</Badge>
											</TooltipTrigger>
											<TooltipContent>{section.title}</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								))}
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Main Content */}
				<Card className="border-gray-700 shadow-xl bg-gray-800/30 backdrop-blur-sm">
					<CardContent className="p-0">
						<ScrollArea className="h-[70vh] px-6 py-8 print:h-auto">
							<Accordion
								type="single"
								collapsible
								value={activeSection}
								onValueChange={setActiveSection}
							>
								<AnimatePresence>
									{filteredSections.map((section, index) => (
										<motion.div
											key={section.id}
											id={section.id}
											variants={itemVariants}
											initial="hidden"
											animate="visible"
											transition={{ delay: index * 0.1 }}
											className="scroll-mt-24"
										>
											<AccordionItem value={section.id} className="border-gray-700">
												<AccordionTrigger className="py-4 text-xl font-medium transition-colors hover:text-blue-400 group">
													<span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
														{section.title}
													</span>
													<Badge
														variant="outline"
														className="ml-3 text-blue-300 border-blue-700 bg-blue-900/20"
													>
														{section.content.length} items
													</Badge>
												</AccordionTrigger>
												<AccordionContent className="text-gray-300">
													<motion.ul
														className="pl-4 space-y-4"
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														transition={{ duration: 0.5 }}
													>
														{section.content.map((item, i) => (
															<motion.li
																key={`${section.id}-${i}`}
																className="flex items-start group"
																initial={{ opacity: 0, x: -10 }}
																animate={{ opacity: 1, x: 0 }}
																transition={{ delay: i * 0.05 }}
															>
																<span className="mr-2 text-blue-400 transition-colors group-hover:text-blue-300">
																	•
																</span>
																<span className="transition-colors group-hover:text-gray-200">
																	{item}
																</span>
															</motion.li>
														))}
													</motion.ul>
												</AccordionContent>
											</AccordionItem>
										</motion.div>
									))}
								</AnimatePresence>
							</Accordion>
						</ScrollArea>
					</CardContent>
					<CardFooter className="flex justify-between border-t border-gray-700/50 bg-gray-800/50 print:hidden">
						<p className="text-sm text-gray-400">
							Last updated:{' '}
							{lastUpdated.toLocaleDateString(undefined, {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							})}
						</p>
						<motion.div variants={fadeInUp}>
							<Button
								variant="outline"
								className="text-white transition-colors bg-blue-600 border-none hover:bg-blue-700"
								onClick={handlePrint}
								aria-label="Print terms of service"
								tabIndex={0}
							>
								Print Terms
							</Button>
						</motion.div>
					</CardFooter>
				</Card>
			</motion.section>

			<motion.footer
				className="py-6 mt-10 text-gray-400 border-t bg-gray-900/90 border-gray-700/50 print:bg-white print:text-gray-700 print:border-gray-300"
				variants={itemVariants}
			>
				<div className="container px-4 mx-auto text-center">
					<p className="text-sm">
						Last updated:{' '}
						{lastUpdated.toLocaleDateString(undefined, {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
						})}
					</p>
					<p className="mt-2 text-sm font-light">
						© {lastUpdated.getFullYear()} DMS Casino Gaming. All rights reserved.
					</p>
					<p className="max-w-md mx-auto mt-4 text-xs text-gray-500">
						By using our platform, you acknowledge that you have read, understood, and agree to be
						bound by these Terms of Service.
					</p>
				</div>
			</motion.footer>
		</motion.main>
	)
}
