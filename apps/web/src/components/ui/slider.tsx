import { Slider as BaseSlider } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type SliderRootProps = ComponentProps<typeof BaseSlider.Root>;
export type SliderLabelProps = ComponentProps<typeof BaseSlider.Label>;
export type SliderValueProps = ComponentProps<typeof BaseSlider.Value>;
export type SliderControlProps = ComponentProps<typeof BaseSlider.Control>;
export type SliderTrackProps = ComponentProps<typeof BaseSlider.Track>;
export type SliderIndicatorProps = ComponentProps<typeof BaseSlider.Indicator>;
export type SliderThumbProps = ComponentProps<typeof BaseSlider.Thumb>;

function SliderRoot({ className, ...props }: SliderRootProps) {
  return (
    <BaseSlider.Root
      className={cn(
        "grid w-full min-w-0 grid-cols-[1fr_auto] items-center gap-x-4 text-ink data-[disabled]:text-ink-subtle data-[orientation=vertical]:w-auto data-[orientation=vertical]:grid-cols-1 data-[orientation=vertical]:justify-items-center data-[orientation=vertical]:gap-y-2",
        className,
      )}
      {...props}
    />
  );
}

function SliderLabel({ className, ...props }: SliderLabelProps) {
  return (
    <BaseSlider.Label className={cn("text-body-sm", className)} {...props} />
  );
}

function SliderValue({ className, ...props }: SliderValueProps) {
  return (
    <BaseSlider.Value
      className={cn(
        "min-w-12 text-right text-body-sm tabular-nums text-ink-muted data-[orientation=vertical]:text-center",
        className,
      )}
      {...props}
    />
  );
}

function SliderControl({ className, ...props }: SliderControlProps) {
  return (
    <BaseSlider.Control
      className={cn(
        "col-span-full flex min-h-12 w-full touch-none select-none items-center data-[disabled]:cursor-not-allowed data-[orientation=vertical]:col-auto data-[orientation=vertical]:h-48 data-[orientation=vertical]:min-h-0 data-[orientation=vertical]:w-12 data-[orientation=vertical]:justify-center",
        className,
      )}
      {...props}
    />
  );
}

function SliderTrack({ className, ...props }: SliderTrackProps) {
  return (
    <BaseSlider.Track
      className={cn(
        "relative h-1 w-full bg-surface-2 data-[disabled]:bg-hairline data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1",
        className,
      )}
      {...props}
    />
  );
}

function SliderIndicator({ className, ...props }: SliderIndicatorProps) {
  return (
    <BaseSlider.Indicator
      className={cn("bg-primary data-[disabled]:bg-ink-subtle", className)}
      {...props}
    />
  );
}

function SliderThumb({ className, ...props }: SliderThumbProps) {
  return (
    <BaseSlider.Thumb
      className={cn(
        "size-4 cursor-grab select-none rounded-none border border-ink bg-canvas active:cursor-grabbing has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus data-[disabled]:cursor-not-allowed data-[disabled]:border-ink-subtle data-[disabled]:bg-surface-1",
        className,
      )}
      {...props}
    />
  );
}

export const Slider = {
  Root: SliderRoot,
  Label: SliderLabel,
  Value: SliderValue,
  Control: SliderControl,
  Track: SliderTrack,
  Indicator: SliderIndicator,
  Thumb: SliderThumb,
};
