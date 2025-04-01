import * as React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ThumbsUpIcon, ThumbsDownIcon, SmileIcon, SendIcon } from 'lucide-react'
import { Button } from '@/components/ui/layout/button'
import { Textarea } from '@/components/ui//textarea'

interface FaqFeedbackProps {
	faqId: string
	onSubmitFeedback?: (faqId: string, isHelpful: boolean, comment: string) => void
}

const FaqFeedback = ({ faqId, onSubmitFeedback }: FaqFeedbackProps) => {
	const [isHelpful, setIsHelpful] = useState<boolean | null>(null)
	const [showCommentBox, setShowCommentBox] = useState(false)
	const [comment, setComment] = useState('')
	const [isSubmitted, setIsSubmitted] = useState(false)

	const handleFeedback = (helpful: boolean) => {
		setIsHelpful(helpful)
		setShowCommentBox(true)
	}

	const handleSubmit = () => {
		if (isHelpful !== null) {
			onSubmitFeedback?.(faqId, isHelpful, comment)
			setIsSubmitted(true)
			// Could also send to analytics or API here
		}
	}

	if (isSubmitted) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="flex items-center justify-center p-4 mt-4 space-x-2 border rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800"
			>
				<SmileIcon className="w-5 h-5" />
				<p className="text-sm">Thank you for your feedback!</p>
			</motion.div>
		)
	}

	return (
		<div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
			<p className="mb-3 text-sm text-gray-600 dark:text-gray-400">Was this answer helpful?</p>

			<div className="flex space-x-2">
				<Button
					variant={isHelpful === true ? 'default' : 'outline'}
					size="sm"
					onClick={() => handleFeedback(true)}
					className={isHelpful === true ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
				>
					<ThumbsUpIcon className="w-4 h-4 mr-2" />
					Yes
				</Button>

				<Button
					variant={isHelpful === false ? 'default' : 'outline'}
					size="sm"
					onClick={() => handleFeedback(false)}
					className={isHelpful === false ? 'bg-red-600 hover:bg-red-700' : ''}
				>
					<ThumbsDownIcon className="w-4 h-4 mr-2" />
					No
				</Button>
			</div>

			{showCommentBox && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					className="mt-4"
				>
					<Textarea
						placeholder={
							isHelpful
								? 'Tell us what was helpful...'
								: 'Tell us how we can improve this answer...'
						}
						value={comment}
						onChange={e => setComment(e.target.value)}
						className="min-h-[100px] mb-3"
					/>

					<Button onClick={handleSubmit} className="flex items-center">
						<SendIcon className="w-4 h-4 mr-2" />
						Submit Feedback
					</Button>
				</motion.div>
			)}
		</div>
	)
}

export default FaqFeedback
