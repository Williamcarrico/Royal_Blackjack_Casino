import * as React from 'react'
import { Card, CardContent } from '@/components/ui//card'
import { Skeleton } from '@/components/ui/skeleton'

export const FaqSkeletonItem = () => {
	return (
		<div className="overflow-hidden bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
			<div className="px-6 py-4">
				<div className="flex items-center justify-between w-full">
					<div className="flex items-center gap-3">
						<Skeleton className="w-5 h-5 rounded-full" />
						<Skeleton className="w-48 h-6" />
					</div>
					<Skeleton className="hidden w-20 h-6 sm:block" />
				</div>
			</div>
		</div>
	)
}

export const FaqCardSkeleton = () => {
	return (
		<Card className="h-full dark:bg-gray-700">
			<CardContent className="p-6">
				<div className="flex flex-wrap items-center justify-between gap-2 mb-3">
					<div className="flex items-center gap-2">
						<Skeleton className="w-5 h-5 rounded-full" />
						<Skeleton className="w-20 h-5" />
					</div>
				</div>
				<Skeleton className="w-3/4 h-6 mb-3" />
				<Skeleton className="w-full h-4 mb-2" />
				<Skeleton className="w-full h-4 mb-2" />
				<Skeleton className="w-2/3 h-4 mb-4" />

				<div className="pl-4 mt-4 border-l-2 border-gray-200 dark:border-gray-600">
					<Skeleton className="w-full h-3 mb-2" />
					<Skeleton className="w-full h-3 mb-2" />
					<Skeleton className="w-3/4 h-3" />
				</div>
			</CardContent>
		</Card>
	)
}

interface FaqSkeletonListProps {
	count?: number
	type?: 'accordion' | 'card'
}

export const FaqSkeletonList: React.FC<FaqSkeletonListProps> = ({
	count = 5,
	type = 'accordion',
}) => {
	const skeletonIds = React.useMemo(
		() => Array.from({ length: count }, () => Math.random().toString(36).substring(2, 11)),
		[count]
	)

	return (
		<>
			{type === 'accordion' ? (
				<div className="space-y-4">
					{skeletonIds.map(id => (
						<FaqSkeletonItem key={`skeleton-accordion-${id}`} />
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{skeletonIds.map(id => (
						<FaqCardSkeleton key={`skeleton-card-${id}`} />
					))}
				</div>
			)}
		</>
	)
}

export const SearchSkeleton = () => {
	return (
		<div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
			<div className="flex items-center gap-2">
				<Skeleton className="w-6 h-6 rounded-full" />
				<Skeleton className="w-40 h-8" />
			</div>

			<div className="flex flex-col gap-4 sm:flex-row">
				<Skeleton className="w-64 h-10" />
				<Skeleton className="h-10 w-36" />
			</div>
		</div>
	)
}

export const FiltersSkeleton = () => {
	const tagIds = React.useMemo(
		() => Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 11)),
		[]
	)

	return (
		<div className="mb-4">
			<div className="flex items-center justify-between mb-3">
				<Skeleton className="h-5 w-28" />
			</div>

			<div className="flex flex-wrap gap-2">
				{tagIds.map(id => (
					<Skeleton key={`tag-skeleton-${id}`} className="h-6 rounded-full w-14" />
				))}
			</div>
		</div>
	)
}

export default FaqSkeletonList
