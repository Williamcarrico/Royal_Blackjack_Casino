// app/privacy-policy/PrivacyPolicyFallback.tsx
import React from 'react'

export default function PrivacyPolicyFallback() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
				<h2 className="text-2xl font-semibold text-blue-400">Loading Privacy Policy</h2>
				<p className="text-gray-400">Preparing document content...</p>
			</div>
		</div>
	)
}
