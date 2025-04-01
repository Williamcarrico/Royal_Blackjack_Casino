import { forwardRef } from 'react'
import { Button as BaseButton, ButtonProps } from '../button'
import { cn } from '@/lib/utils/utils'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <BaseButton
                ref={ref}
                variant={variant}
                size={size}
                className={cn(
                    // Custom styles for the layout buttons
                    'transition-all duration-300',
                    'focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                    variant === 'default' && 'hover:shadow-amber-600/20 hover:shadow-md',
                    variant === 'outline' && 'border-amber-700/40 text-amber-400 hover:bg-amber-900/20',
                    className
                )}
                {...props}
            />
        )
    }
)

Button.displayName = 'LayoutButton'

export default Button