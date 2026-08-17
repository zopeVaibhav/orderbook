import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';

function Tabs({ className, orientation = 'horizontal', ...props }: TabsPrimitive.Root.Props) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            data-orientation={orientation}
            className={cn('group/tabs flex flex-col', className)}
            {...props}
        />
    );
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                'flex h-11 w-full shrink-0 gap-1 border-b border-border bg-muted/30',
                className,
            )}
            {...props}
        />
    );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
    return (
        <TabsPrimitive.Tab
            data-slot="tabs-trigger"
            className={cn(
                'flex flex-1 cursor-pointer items-center justify-center text-sm text-muted-foreground transition-colors whitespace-nowrap hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-active:bg-background data-active:font-semibold data-active:text-foreground data-active:shadow-sm',
                className,
            )}
            {...props}
        />
    );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
    return (
        <TabsPrimitive.Panel
            data-slot="tabs-content"
            className={cn('min-h-0 flex-1 outline-none', className)}
            {...props}
        />
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
