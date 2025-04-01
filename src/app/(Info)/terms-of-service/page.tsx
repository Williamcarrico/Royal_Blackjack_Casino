// app/term-of-service/page.tsx
import { Metadata } from 'next'
import TermsOfServiceClient from '@/app/(Info)/terms-of-service/TermsOfServiceClient'

export const metadata: Metadata = {
	title: 'Terms of Service - Advanced Blackjack Platform',
	description: 'Comprehensive terms of service for our sophisticated blackjack gaming platform.',
	keywords: 'blackjack terms, legal agreement, gaming policy, responsible gaming, user agreement',
}

export default function TermsOfServicePage() {
	return <TermsOfServiceClient />
}
