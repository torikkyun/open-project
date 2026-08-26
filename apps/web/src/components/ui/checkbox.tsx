import { Checkbox as BaseCheckbox } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type CheckboxRootProps = ComponentProps<typeof BaseCheckbox.Root>;
export type CheckboxIndicatorProps = ComponentProps<
  typeof BaseCheckbox.Indicator
>;

function DefaultIndicator() {
  return (
    <BaseCheckbox.Indicator
      className="flex items-center justify-center"
      render={(props, state) => (
        <span {...props}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d={state.indeterminate ? "M3 8h10" : "m3 8 3 3 7-7"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
        </span>
      )}
    />
  );
}

function CheckboxRoot({
  className,
  children,
  style,
  ...props
}: CheckboxRootProps) {
  return (
    <BaseCheckbox.Root
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-none border p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        (state) => {
          if (state.disabled) {
            return "cursor-not-allowed border-hairline bg-surface-2 text-ink-subtle";
          }

          if (state.checked || state.indeterminate) {
            return "border-primary bg-primary text-on-primary";
          }

          return "border-hairline-strong bg-canvas text-on-primary";
        },
        className,
      )}
      style={
        typeof style === "function"
          ? (state) => ({
              width: 20,
              height: 20,
              backgroundColor: state.disabled
                ? "var(--color-surface-2)"
                : undefined,
              ...style(state),
            })
          : (state) => ({
              width: 20,
              height: 20,
              backgroundColor: state.disabled
                ? "var(--color-surface-2)"
                : undefined,
              ...style,
            })
      }
      {...props}
    >
      {children ?? <DefaultIndicator />}
    </BaseCheckbox.Root>
  );
}

function CheckboxIndicator({ className, ...props }: CheckboxIndicatorProps) {
  return (
    <BaseCheckbox.Indicator
      className={cn("flex items-center justify-center", className)}
      {...props}
    />
  );
}

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};
