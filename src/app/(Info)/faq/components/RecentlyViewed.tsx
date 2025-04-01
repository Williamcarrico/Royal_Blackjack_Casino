import * as React from 'react'
import { motion } from 'framer-motion'
import { ClockIcon, ExternalLinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/layout/button'
import { Separator } from '@/components/ui/separator'
import { faqs, FAQ } from '../faq-data'

interface RecentlyViewedProps {
	recentlyViewedIds: string[]
	onSelectFaq: (faqId: string) => void
	className?: string
}

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
	recentlyViewedIds,
	onSelectFaq,
	className,
}) => {
	if (recentlyViewedIds.length === 0) {
		return null
	}

	// Get the FAQ objects from IDs
	const recentlyViewed = recentlyViewedIds
		.map(id => faqs.find(faq => faq.id === id))
		.filter((faq): faq is FAQ => faq !== undefined)

	if (recentlyViewed.length === 0) {
		return null
	}

	return (
		<Card className={`backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 ${className}`}>
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
					<CardTitle className="text-xl">Recently Viewed</CardTitle>
				</div>
				<Separator className="mt-3" />
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{recentlyViewed.map((faq, index) => (
						<motion.div
							key={faq.id}
							initial={{ opacity: 0 }}
							animate={{
								opacity: 1,
								transition: { delay: index * 0.05, duration: 0.2 },
							}}
						>
							<div className="flex items-center group">
								<Button
									variant="link"
									className="p-0 text-sm font-medium text-left text-gray-700 truncate hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
									onClick={() => onSelectFaq(faq.id)}
								>
									{faq.question}
								</Button>
								<ExternalLinkIcon className="w-3 h-3 ml-1 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />
							</div>
						</motion.div>
					))}
				</div>

				{recentlyViewed.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="mt-4 text-xs text-gray-500 dark:text-gray-400"
						onClick={() => {
							localStorage.removeItem('recentlyViewedFaqs')
							window.location.reload()
						}}
					>
						Clear History
					</Button>
				)}
			</CardContent>
		</Card>
	)
}

export default RecentlyViewed
