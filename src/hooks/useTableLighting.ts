import { useEffect, RefObject } from 'react';

interface UseTableLightingProps {
    tableRef: RefObject<HTMLDivElement | null>;
    feltRef: RefObject<HTMLDivElement | null>;
    intensity?: number;
    enabled?: boolean;
}

/**
 * Custom hook for creating realistic lighting effects on a casino table
 * Adds a subtle highlight that follows cursor movement across the table surface
 */
const useTableLighting = ({
    tableRef,
    feltRef,
    intensity = 0.1,
    enabled = true
}: UseTableLightingProps) => {
    useEffect(() => {
        if (!enabled) return;

        // Get references to DOM elements
        const tableElement = tableRef.current;
        const feltElement = feltRef.current;

        if (!tableElement || !feltElement) return;

        // Create a highlight element
        const highlight = document.createElement('div');
        highlight.className = 'absolute inset-0 pointer-events-none z-15 opacity-60 transition-opacity duration-300';
        highlight.style.background = `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${intensity}) 0%, transparent 60%)`;
        highlight.style.opacity = '0';
        feltElement.appendChild(highlight);

        const handleMouseMove = (e: MouseEvent) => {
            if (!tableElement || !feltElement || !highlight) return;

            // Get the relative position of the cursor on the table
            const rect = tableElement.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            // Update the radial gradient position
            highlight.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255, 255, 255, ${intensity}) 0%, transparent 60%)`;
            highlight.style.opacity = '1';
        };

        const handleMouseLeave = () => {
            if (highlight) {
                highlight.style.opacity = '0';
            }
        };

        // Add event listeners
        tableElement.addEventListener('mousemove', handleMouseMove);
        tableElement.addEventListener('mouseleave', handleMouseLeave);

        // Clean up event listeners
        return () => {
            tableElement.removeEventListener('mousemove', handleMouseMove);
            tableElement.removeEventListener('mouseleave', handleMouseLeave);

            if (feltElement && feltElement.contains(highlight)) {
                feltElement.removeChild(highlight);
            }
        };
    }, [tableRef, feltRef, intensity, enabled]);

    // Additional lighting effects or methods could be returned here
    return {};
};

export default useTableLighting;