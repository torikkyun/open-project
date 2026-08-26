import { Tabs as BaseTabs } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type TabsRootProps = ComponentProps<typeof BaseTabs.Root>;
export type TabsListProps = ComponentProps<typeof BaseTabs.List>;
export type TabsTabProps = ComponentProps<typeof BaseTabs.Tab>;
export type TabsIndicatorProps = ComponentProps<typeof BaseTabs.Indicator>;
export type TabsPanelProps = ComponentProps<typeof BaseTabs.Panel>;

function TabsRoot({ className, ...props }: TabsRootProps) {
  return <BaseTabs.Root className={cn("w-full", className)} {...props} />;
}

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <BaseTabs.List
      className={cn(
        "relative flex overflow-x-auto border-b border-hairline data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-r data-[orientation=vertical]:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TabsTab({ className, ...props }: TabsTabProps) {
  return (
    <BaseTabs.Tab
      className={cn(
        "relative h-12 shrink-0 cursor-pointer select-none whitespace-nowrap rounded-none border-0 bg-canvas px-5 text-sm leading-[1.29] tracking-body text-ink-muted hover:text-ink focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary data-[active]:font-semibold data-[active]:text-ink data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

function TabsIndicator({ className, ...props }: TabsIndicatorProps) {
  return (
    <BaseTabs.Indicator
      className={cn(
        "absolute bottom-0 left-0 h-0.5 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] bg-primary transition-[translate,width] duration-150 ease-out data-[orientation=vertical]:top-0 data-[orientation=vertical]:right-0 data-[orientation=vertical]:bottom-auto data-[orientation=vertical]:left-auto data-[orientation=vertical]:h-[var(--active-tab-height)] data-[orientation=vertical]:w-0.5 data-[orientation=vertical]:translate-x-0 data-[orientation=vertical]:translate-y-[var(--active-tab-top)]",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <BaseTabs.Panel
      className={cn(
        "py-4 text-sm text-ink outline-none data-[hidden]:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Indicator: TabsIndicator,
  Panel: TabsPanel,
};
