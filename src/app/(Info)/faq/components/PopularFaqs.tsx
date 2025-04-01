import * as React from 'react'
import { motion } from 'framer-motion'
import { TrendingUpIcon, ArrowRightIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui//card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/layout/button'
import { Separator } from '@/components/ui/separator'
import { getPopularFAQs } from '../faq-data'
import { getCategoryIcon, getCategoryColor } from '../utils/ui-helpers'

interface PopularFaqsProps {
	onSelectFaq: (faqId: string) => void
	className?: string
}

const PopularFaqs: React.FC<PopularFaqsProps> = ({ onSelectFaq, className }) => {
	const popularFaqs = getPopularFAQs(5)

	return (
		<Card className={`backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 ${className}`}>
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<TrendingUpIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
					<CardTitle className="text-xl">Popular Questions</CardTitle>
				</div>
				<Separator className="mt-3" />
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{popularFaqs.map((faq, index) => (
						<motion.div
							key={faq.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{
								opacity: 1,
								y: 0,
								transition: {
									delay: index * 0.1,
									duration: 0.3,
								},
							}}
							whileHover={{
								scale: 1.02,
								transition: { duration: 0.2 },
							}}
							className="relative transition-all"
						>
							<div className="flex items-center justify-between group">
								<div className="flex items-start gap-3">
									<div className="flex items-center justify-center w-6 h-6 mt-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
										{index + 1}
									</div>
									<div>
										<Button
											variant="link"
											className="p-0 text-base font-medium text-left text-gray-800 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
											onClick={() => onSelectFaq(faq.id)}
										>
											{faq.question}
										</Button>
										<div className="flex items-center mt-1 space-x-2">
											<div className="flex items-center gap-1">
												{getCategoryIcon(faq.category)}
												<Badge variant="outline" className={getCategoryColor(faq.category)}>
													{faq.category}
												</Badge>
											</div>
										</div>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="transition-opacity opacity-0 group-hover:opacity-100"
									onClick={() => onSelectFaq(faq.id)}
								>
									<ArrowRightIcon className="w-4 h-4" />
									<span className="sr-only">View FAQ</span>
								</Button>
							</div>
							{index < popularFaqs.length - 1 && <Separator className="mt-3" />}
						</motion.div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

export default PopularFaqs
