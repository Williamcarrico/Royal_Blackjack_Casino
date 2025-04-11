"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { cn } from "@/lib/utils/utils"

// Wrapper for safely providing context without infinite render loops
const SafeDropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  open: false,
  setOpen: () => { },
});

// Safe dropdown menu component
function SafeDropdownMenu({
  children,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Root>>) {
  const [open, setOpen] = React.useState(false);
  const isUpdating = React.useRef(false);

  // Use useMemo to create a stable context value that doesn't change on every render
  const contextValue = React.useMemo(
    () => ({ open, setOpen }),
    [open]
  );

  // Use a stable callback that doesn't recreate on every render
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isUpdating.current) {
      isUpdating.current = true;

      // Use functional updates to avoid stale state references
      setOpen(prevOpen => {
        if (prevOpen !== newOpen) {
          return newOpen;
        }
        return prevOpen;
      });

      // Reset the flag after the update completes
      setTimeout(() => {
        isUpdating.current = false;
      }, 0);
    }
  }, []);

  return (
    <SafeDropdownMenuContext.Provider value={contextValue}>
      <DropdownMenuPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        data-slot="dropdown-menu"
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Root>
    </SafeDropdownMenuContext.Provider>
  );
}

// Safe trigger that doesn't cause infinite renders
function SafeDropdownMenuTrigger({
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

// Using the SafeDropdownMenu implementation as the default
function DropdownMenu({
  children,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Root>>) {
  const [open, setOpen] = React.useState(props.open || false);
  const isUpdating = React.useRef(false);
  const prevOpenRef = React.useRef(open);

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

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isUpdating.current) {
      isUpdating.current = true;

      // Only update if the state is actually changing
      if (prevOpenRef.current !== newOpen) {
        setOpen(newOpen);
        prevOpenRef.current = newOpen;

        // Call the original handler if provided
        props.onOpenChange?.(newOpen);
      }

      // Reset the flag after the update completes
      setTimeout(() => {
        isUpdating.current = false;
      }, 0);
    }
  }, [props.onOpenChange]);

  return (
    <SafeDropdownMenuContext.Provider value={contextValue}>
      <DropdownMenuPrimitive.Root
        {...props}
        open={open}
        onOpenChange={handleOpenChange}
        data-slot="dropdown-menu"
      >
        {children}
      </DropdownMenuPrimitive.Root>
    </SafeDropdownMenuContext.Provider>
  );
}

// Legacy implementation for backward compatibility
function LegacyDropdownMenu({
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Root>>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Portal>>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  className,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Content>>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        onFocusOutside={(event) => {
          // Help prevent focus issues with nested components
          if (props.onFocusOutside) {
            props.onFocusOutside(event);
          }
        }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Group>>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="fill-current size-2" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Separator>>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: Readonly<React.ComponentProps<"span">>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.Sub>>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}>) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: Readonly<React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  LegacyDropdownMenu,
  SafeDropdownMenu,
  SafeDropdownMenuTrigger,
}
