import { Tabs as BaseTabs } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

function TabsRoot(props: ComponentProps<typeof BaseTabs.Root>) {
  return <BaseTabs.Root {...props} />;
}

function TabsList(props: ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List className={cn("flex border-b border-hairline", props.className)} {...props} />
  );
}

function TabsTab(props: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={cn(
        "relative cursor-pointer rounded-none border-0 border-b-2 border-transparent bg-canvas px-5 py-4 text-sm leading-[1.29] tracking-body text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary data-[active]:border-primary data-[active]:font-semibold data-[active]:text-ink data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-subtle",
        props.className,
      )}
      {...props}
    />
  );
}

function TabsIndicator(props: ComponentProps<typeof BaseTabs.Indicator>) {
  return <BaseTabs.Indicator className={cn("bg-primary", props.className)} {...props} />;
}

function TabsPanel(props: ComponentProps<typeof BaseTabs.Panel>) {
  return <BaseTabs.Panel className={cn("py-4 data-[hidden]:hidden", props.className)} {...props} />;
}

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Indicator: TabsIndicator,
  Panel: TabsPanel,
};
