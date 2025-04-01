// app/privacy-policy/page.tsx
import { Metadata } from 'next'
import { Suspense } from 'react'
import PrivacyPolicyClient from './PrivacyPolicyClient'
import PrivacyPolicyFallback from '@/components/privacy-policy/PrivacyPolicyFallback'

export const metadata: Metadata = {
	title: 'Privacy Policy - House Edge Blackjack',
	description:
		'Comprehensive privacy policy detailing how we handle and protect your data on our sophisticated blackjack gaming platform.',
	keywords:
		'blackjack privacy, data protection, user privacy, gaming privacy, data security, house edge',
	openGraph: {
		title: 'Privacy Policy - House Edge Blackjack',
		description: 'Learn how we protect your privacy and data on our advanced blackjack platform.',
		images: ['/images/privacy-policy-og.jpg'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Privacy Policy - House Edge Blackjack',
		description: 'Learn how we protect your privacy and data on our advanced blackjack platform.',
		images: ['/images/privacy-policy-og.jpg'],
	},
}

export default function PrivacyPolicyPage() {
	return (
		<Suspense fallback={<PrivacyPolicyFallback />}>
			<PrivacyPolicyClient />
		</Suspense>
	)
}
