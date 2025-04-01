'use client'

import { FC } from 'react'
import * as GiIcons from 'react-icons/gi'
import * as RiIcons from 'react-icons/ri'
import * as FaIcons from 'react-icons/fa'
import * as IoIcons from 'react-icons/io5'
import * as BiIcons from 'react-icons/bi'
import * as HiIcons from 'react-icons/hi'
import * as SiIcons from 'react-icons/si'

interface DynamicIconProps {
    icon: string
    library?: 'gi' | 'ri' | 'fa' | 'io' | 'bi' | 'hi' | 'si'
    className?: string
}

const iconLibraries = {
    gi: GiIcons,
    ri: RiIcons,
    fa: FaIcons,
    io: IoIcons,
    bi: BiIcons,
    hi: HiIcons,
    si: SiIcons
}

export const DynamicIcon: FC<DynamicIconProps> = ({
    icon,
    library = 'fa',
    className = ''
}) => {
    // Get the specified library
    const IconLibrary = iconLibraries[library]

    // Get the icon component from the library
    const IconComponent = IconLibrary[icon as keyof typeof IconLibrary]

    if (!IconComponent) {
        console.warn(`Icon ${icon} not found in library ${library}`)
        return null
    }

    return <IconComponent className={className} />
}