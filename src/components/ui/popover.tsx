"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils/utils"

// Safe context to prevent infinite renders
const SafePopoverContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  open: false,
  setOpen: () => { },
});

// Making SafePopover our default implementation
function Popover({
  children,
  ...props
}: Readonly<React.ComponentProps<typeof PopoverPrimitive.Root>>) {
  const [open, setOpen] = React.useState(props.open || false);
  const isUpdating = React.useRef(false);

  // Sync with controlled prop if provided
  React.useEffect(() => {
    if (props.open !== undefined && props.open !== open && !isUpdating.current) {
      setOpen(props.open);
    }
  }, [props.open, open]);

  const contextValue = React.useMemo(
    () => ({ open, setOpen }),
    [open]
  );

  const { onOpenChange } = props;

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isUpdating.current) {
      isUpdating.current = true;
      setOpen(newOpen);

      // Call the original handler if provided
      onOpenChange?.(newOpen);

      // Reset the flag after the update completes
      setTimeout(() => {
        isUpdating.current = false;
      }, 0);
    }
  }, [onOpenChange]);

  return (
    <SafePopoverContext.Provider value={contextValue}>
      <PopoverPrimitive.Root
        {...props}
        open={open}
        onOpenChange={handleOpenChange}
        data-slot="popover"
      >
        {children}
      </PopoverPrimitive.Root>
    </SafePopoverContext.Provider>
  );
}

// Legacy implementation kept for backwards compatibility
function LegacyPopover({
  ...props
}: Readonly<React.ComponentProps<typeof PopoverPrimitive.Root>>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        onOpenAutoFocus={(event) => {
          // Prevent auto focus which can trigger tooltips
          event.preventDefault();
          if (props.onOpenAutoFocus) props.onOpenAutoFocus(event);
        }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  // Simply return the component without any state management or effects
  return <PopoverPrimitive.Anchor
    {...props}
    data-slot="popover-anchor"
  />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, LegacyPopover }
