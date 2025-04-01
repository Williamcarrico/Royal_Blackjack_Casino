import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'i.pravatar.cc',
			},
			{
				protocol: 'https',
				hostname: 'randomuser.me',
			},
		],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	webpack: (config, { isServer }) => {
		// Only apply this on the client-side bundle
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
				crypto: false,
			}
		}

		// Fix for react-icons loading issue
		config.resolve.alias = {
			...config.resolve.alias,
			'react-icons/gi': 'react-icons/gi/index',
		}

		return config
	},
	// Improve transpilation for React Icons
	transpilePackages: ['react-icons'],
}

export default nextConfig
