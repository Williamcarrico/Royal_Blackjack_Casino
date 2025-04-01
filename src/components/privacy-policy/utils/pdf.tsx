// app/privacy-policy/utils/pdf.ts
import { PolicyMetadata } from '../types'
import { policySections } from '../policyContent'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { ReactElement } from 'react'

// Helper to format date for PDF
const formatDate = (dateString: string): string => {
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

// Define styles for PDF
const styles = StyleSheet.create({
	page: {
		flexDirection: 'column',
		backgroundColor: '#FFFFFF',
		padding: 20,
	},
	header: {
		backgroundColor: '#282C34',
		padding: 20,
		marginBottom: 10,
	},
	headerText: {
		fontSize: 24,
		color: '#FFFFFF',
		textAlign: 'center',
	},
	metadataText: {
		fontSize: 10,
		color: '#969696',
		textAlign: 'center',
		marginTop: 5,
	},
	introText: {
		fontSize: 11,
		color: '#505050',
		marginTop: 10,
		marginBottom: 20,
	},
	tocTitle: {
		fontSize: 14,
		color: '#282828',
		marginTop: 10,
		marginBottom: 8,
	},
	tocItem: {
		fontSize: 11,
		color: '#505050',
		marginBottom: 6,
	},
	sectionTitle: {
		fontSize: 16,
		color: '#0066CC',
		marginTop: 20,
		marginBottom: 8,
	},
	sectionSubtitle: {
		fontSize: 12,
		color: '#505050',
		marginBottom: 8,
	},
	lastUpdated: {
		fontSize: 9,
		color: '#969696',
		marginBottom: 6,
	},
	paragraph: {
		fontSize: 11,
		color: '#3C3C3C',
		marginBottom: 4,
		textAlign: 'justify',
	},
	sectionSpace: {
		marginBottom: 10,
	},
	footer: {
		position: 'absolute',
		bottom: 10,
		left: 20,
		right: 20,
		fontSize: 9,
		color: '#969696',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
})

// PDF Document Component
export const PrivacyPolicyDocument = ({ metadata }: { metadata: PolicyMetadata }): ReactElement => {
	const currentYear = new Date().getFullYear()

	return (
		<Document title="House Edge Blackjack - Privacy Policy">
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.headerText}> House Edge Blackjack - Privacy Policy </Text>
					<Text style={styles.metadataText}>
						Version {metadata.version} | Effective: {formatDate(metadata.effectiveDate)} | Last
						Updated: {formatDate(metadata.lastModified)}
					</Text>
				</View>

				{/* Introduction */}
				<Text style={styles.introText}>
					This document outlines how House Edge Blackjack collects, uses, and protects your personal
					information.By using our services, you agree to the terms outlined in this Privacy Policy.
				</Text>

				{/* Table of Contents */}
				<Text style={styles.tocTitle}> Table of Contents </Text>
				{policySections.map((section, index) => (
					<Text key={section.id} style={styles.tocItem}>
						{index + 1}.{section.title}
					</Text>
				))}

				{/* Policy Sections */}
				{policySections.map((section, index) => (
					<View key={section.id}>
						<Text style={styles.sectionTitle}>
							{index + 1}.{section.title}
						</Text>

						{section.subtitle && <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>}

						{section.lastUpdated && (
							<Text style={styles.lastUpdated}>
								Last updated: {formatDate(section.lastUpdated)}
							</Text>
						)}

						{section.content.map((paragraph, pIndex) => (
							<Text key={`${section.id}-p-${pIndex}`} style={styles.paragraph}>
								{paragraph}
							</Text>
						))}

						<View style={styles.sectionSpace} />
					</View>
				))}

				{/* Footer */}
				<View style={styles.footer}>
					<Text>© {currentYear} House Edge Blackjack.All rights reserved.</Text>
					<Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
				</View>
			</Page>
		</Document>
	)
}

// Generate PDF from policy content
export async function generatePdf(metadata: PolicyMetadata): Promise<void> {
	// Check if we're running in a browser environment
	if (typeof window === 'undefined') {
		console.error('PDF generation is only available in browser environment')
		return
	}

	try {
		// Create the PDF instance
		const pdfDoc = <PrivacyPolicyDocument metadata={metadata} />
		const blob = await pdf(pdfDoc).toBlob()

		// Create a URL for the blob
		const url = URL.createObjectURL(blob)

		// Create a temporary link element
		const link = document.createElement('a')
		link.href = url
		link.download = 'House_Edge_Blackjack_Privacy_Policy.pdf'

		// Append to body, click programmatically, then remove
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		// Clean up the URL object
		URL.revokeObjectURL(url)
	} catch (error) {
		console.error('Failed to generate PDF:', error)
		alert('There was an error generating the PDF. Please try again later.')
	}
}

// Legacy component for rendering download link directly in the UI
// Kept for backward compatibility, but new code should use PDFDownloadButton
export const PrivacyPolicyDownloadLink = ({
	metadata,
	children,
}: {
	metadata: PolicyMetadata
	children: ReactElement | string
}): ReactElement => (
	<PDFDownloadLink
		document={<PrivacyPolicyDocument metadata={metadata} />}
		fileName="House_Edge_Blackjack_Privacy_Policy.pdf"
	>
		{({ loading }) => (loading ? 'Loading document...' : children)}
	</PDFDownloadLink>
)
