import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		domains: ['i.pravatar.cc', 'randomuser.me'],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	// Add optimizePackageImports for react-icons
	experimental: {
		optimizePackageImports: ['react-icons'],
		turbo: {
			rules: {
				// Prevent tree-shaking issues with react-icons
				'*.icon.js': {
					loaders: ['js'],
				},
			},
		},
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

		// Remove problematic aliases
		return config
	},
	// Improve transpilation for React Icons
	transpilePackages: ['react-icons'],
}

export default nextConfig
