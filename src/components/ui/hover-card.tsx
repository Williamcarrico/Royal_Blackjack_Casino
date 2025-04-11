"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils/utils"

// Safe context to prevent infinite renders
const SafeHoverCardContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  open: false,
  setOpen: () => { },
});

// Safe hover card component
function SafeHoverCard({
  children,
  ...props
}: Readonly<React.ComponentProps<typeof HoverCardPrimitive.Root>>) {
  const [open, setOpen] = React.useState(false);
  const skipRender = React.useRef(false);

  const contextValue = React.useMemo(
    () => ({ open, setOpen }),
    [open]
  );

  // Effect to prevent infinite updates - only allow one change per render cycle
  React.useEffect(() => {
    if (skipRender.current) return;
    skipRender.current = true;
    return () => {
      skipRender.current = false;
    };
  }, [open]);

  return (
    <SafeHoverCardContext.Provider value={contextValue}>
      <HoverCardPrimitive.Root
        open={open}
        onOpenChange={(newOpen) => {
          if (!skipRender.current) {
            setOpen(newOpen);
          }
        }}
        data-slot="hover-card"
        {...props}
      >
        {children}
      </HoverCardPrimitive.Root>
    </SafeHoverCardContext.Provider>
  );
}

function HoverCard({
  ...props
}: Readonly<React.ComponentProps<typeof HoverCardPrimitive.Root>>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

// Safe trigger using ref-based approach
function SafeHoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  const triggerRef = React.useRef<React.ComponentRef<typeof HoverCardPrimitive.Trigger>>(null);

  const memoizedProps = React.useMemo(() => ({
    ...props,
    ref: triggerRef,
    "data-slot": "hover-card-trigger"
  }), [props]);

  return <HoverCardPrimitive.Trigger {...memoizedProps} />
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent, SafeHoverCard, SafeHoverCardTrigger }
