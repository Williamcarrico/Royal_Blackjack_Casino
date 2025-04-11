'use client'

import { FC, useState, useEffect } from 'react'

// DO NOT import entire libraries directly
// import * as GiIcons from 'react-icons/gi'
// import * as RiIcons from 'react-icons/ri'
// import * as FaIcons from 'react-icons/fa'
// import * as IoIcons from 'react-icons/io5'
// import * as BiIcons from 'react-icons/bi'
// import * as HiIcons from 'react-icons/hi'
// import * as SiIcons from 'react-icons/si'

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

    useEffect(() => {
        // Reset state when inputs change
        setLoading(true);
        setIconComponent(null);

        const importIcon = async () => {
            try {
                // Dynamically import only the specific icon needed
                let importedIcon;
                switch (library) {
                    case 'gi':
                        importedIcon = await import(`react-icons/gi`).then(module => module[icon as keyof typeof module]);
                        break;
                    case 'ri':
                        importedIcon = await import(`react-icons/ri`).then(module => module[icon as keyof typeof module]);
                        break;
                    case 'fa':
                        importedIcon = await import(`react-icons/fa`).then(module => module[icon as keyof typeof module]);
                        break;
                    case 'io':
                        importedIcon = await import(`react-icons/io5`).then(module => module[icon as keyof typeof module]);
                        break;
                    case 'bi':
                        importedIcon = await import(`react-icons/bi`).then(module => module[icon as keyof typeof module]);
                        break;
                    case 'hi':
                        importedIcon = await import(`react-icons/hi`).then(module => module[icon as keyof typeof module]);
                        break;
                    case 'si':
                        importedIcon = await import(`react-icons/si`).then(module => module[icon as keyof typeof module]);
                        break;
                    default:
                        console.warn(`Library ${library} not supported`);
                        break;
                }

                if (importedIcon) {
                    setIconComponent(() => importedIcon);
                } else {
                    console.warn(`Icon ${icon} not found in library ${library}`);
                }
            } catch (error) {
                console.error(`Error loading icon ${icon} from ${library}:`, error);
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