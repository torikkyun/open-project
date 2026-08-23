import { Tooltip as BaseTooltip } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

function TooltipRoot(props: ComponentProps<typeof BaseTooltip.Root>) {
  return <BaseTooltip.Root {...props} />;
}

function TooltipTrigger(props: ComponentProps<typeof BaseTooltip.Trigger>) {
  return <BaseTooltip.Trigger className={cn("inline-flex", props.className)} {...props} />;
}

function TooltipPortal(props: ComponentProps<typeof BaseTooltip.Portal>) {
  return <BaseTooltip.Portal {...props} />;
}

function TooltipPositioner(props: ComponentProps<typeof BaseTooltip.Positioner>) {
  return <BaseTooltip.Positioner className={cn("z-[1400]", props.className)} {...props} />;
}

function TooltipPopup(props: ComponentProps<typeof BaseTooltip.Popup>) {
  return (
    <BaseTooltip.Popup
      className={cn(
        "max-w-[280px] rounded-none bg-inverse-canvas px-3 py-2 text-xs leading-[1.33] tracking-caption text-inverse-ink opacity-0 transition-opacity duration-150 ease-out data-[open]:opacity-100 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        props.className,
      )}
      {...props}
    />
  );
}

function TooltipArrow(props: ComponentProps<typeof BaseTooltip.Arrow>) {
  return <BaseTooltip.Arrow className={cn("fill-inverse-canvas", props.className)} {...props} />;
}

function TooltipProvider(props: ComponentProps<typeof BaseTooltip.Provider>) {
  return <BaseTooltip.Provider {...props} />;
}

export const Tooltip = {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Positioner: TooltipPositioner,
  Popup: TooltipPopup,
  Arrow: TooltipArrow,
  Provider: TooltipProvider,
};
