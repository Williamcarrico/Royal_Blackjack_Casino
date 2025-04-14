'use client'

import { FC, useState, useEffect } from 'react'

// IMPORTANT: Use specific imports when needed directly in components
// DO NOT import entire libraries directly or rely on dynamic imports with string templates

interface DynamicIconProps {
    icon: string
    library?: 'gi' | 'ri' | 'fa' | 'io' | 'bi' | 'hi' | 'si'
    className?: string
    fallbackClassName?: string
}

// Fallback component while the icon is loading
const IconFallback = ({ className }: { className?: string }) => (
    <div className={`inline-block ${className ?? 'w-4 h-4'}`} />
);

export const DynamicIcon: FC<DynamicIconProps> = ({
    icon,
    library = 'fa',
    className = '',
    fallbackClassName = '',
}) => {
    const [IconComponent, setIconComponent] = useState<React.ComponentType<React.SVGProps<SVGSVGElement>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Reset state when inputs change
        setLoading(true);
        setIconComponent(null);
        setError(false);

        const importIcon = async () => {
            try {
                // Use separate import statements for each library to avoid template literals
                // which can cause issues with code splitting
                let importedIcon;

                if (library === 'gi') {
                    const module = await import('react-icons/gi');
                    importedIcon = module[icon as keyof typeof module];
                } else if (library === 'ri') {
                    const module = await import('react-icons/ri');
                    importedIcon = module[icon as keyof typeof module];
                } else if (library === 'fa') {
                    const module = await import('react-icons/fa');
                    importedIcon = module[icon as keyof typeof module];
                } else if (library === 'io') {
                    const module = await import('react-icons/io5');
                    importedIcon = module[icon as keyof typeof module];
                } else if (library === 'bi') {
                    const module = await import('react-icons/bi');
                    importedIcon = module[icon as keyof typeof module];
                } else if (library === 'hi') {
                    const module = await import('react-icons/hi');
                    importedIcon = module[icon as keyof typeof module];
                } else if (library === 'si') {
                    const module = await import('react-icons/si');
                    importedIcon = module[icon as keyof typeof module];
                } else {
                    console.warn(`Library ${library} not supported`);
                }

                if (importedIcon) {
                    setIconComponent(() => importedIcon);
                } else {
                    console.warn(`Icon ${icon} not found in library ${library}`);
                    setError(true);
                }
            } catch (error) {
                console.error(`Error loading icon ${icon} from ${library}:`, error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        importIcon();
    }, [icon, library]);

    if (loading || !IconComponent) {
        return <IconFallback className={fallbackClassName || className} />;
    }

    return <IconComponent className={className} />;
}