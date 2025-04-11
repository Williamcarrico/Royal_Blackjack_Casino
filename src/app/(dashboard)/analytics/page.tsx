'use client'

/** @jsxImportSource react */
import React from 'react'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
	return (
		<div className="container py-10">
			<div className="mb-8">
				<h1 className="text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
				<p className="text-muted-foreground">
					Track your performance, analyze your decision quality, and improve your blackjack strategy
				</p>
			</div>

			<div>
				<AnalyticsDashboard />
			</div>
		</div>
	)
}
