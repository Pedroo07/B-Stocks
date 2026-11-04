'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'group flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-mist-800 bg-mist-950 px-3 text-xs font-medium text-stone-200 transition-colors',
      'hover:border-mist-700 hover:bg-mist-900',
      'focus:outline-none focus-visible:ring-1 focus-visible:ring-mist-600',
      'data-[state=open]:border-mist-600 data-[state=open]:bg-mist-900',
      'disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        'relative z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-mist-700/80 bg-mist-900/95 p-1 text-stone-200 shadow-2xl shadow-black/50 backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-stone-500">
        <ChevronUp className="h-3.5 w-3.5" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-stone-500">
        <ChevronDown className="h-3.5 w-3.5" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-stone-500',
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    leading?: React.ReactNode;
  }
>(({ className, children, leading, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-lg py-2 pl-2.5 pr-8 text-xs text-stone-300 outline-none transition-colors',
      'data-[highlighted]:bg-mist-800 data-[highlighted]:text-stone-50',
      'data-[state=checked]:font-semibold data-[state=checked]:text-stone-50',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    {leading}
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('my-1 h-px bg-mist-800', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
