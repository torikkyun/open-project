import { Field as BaseField, Input as BaseInput } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

function FieldRoot(props: ComponentProps<typeof BaseField.Root>) {
  return (
    <BaseField.Root
      className={cn("flex flex-col gap-2", props.className)}
      {...props}
    />
  );
}

function FieldLabel(props: ComponentProps<typeof BaseField.Label>) {
  return (
    <BaseField.Label
      className={cn(
        "text-sm font-semibold leading-[1.29] tracking-body text-ink",
        props.className,
      )}
      {...props}
    />
  );
}

function FieldDescription(props: ComponentProps<typeof BaseField.Description>) {
  return (
    <BaseField.Description
      className={cn(
        "text-xs leading-[1.33] tracking-caption text-ink-subtle",
        props.className,
      )}
      {...props}
    />
  );
}

function FieldError(props: ComponentProps<typeof BaseField.Error>) {
  return (
    <BaseField.Error
      className={cn(
        "text-xs leading-[1.33] tracking-caption text-error",
        props.className,
      )}
      {...props}
    />
  );
}

export const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
};

export interface InputProps extends ComponentProps<typeof BaseInput> {
  /** Renders an error message below the input. Requires wrapping in `Field.Root`. */
  error?: ReactNode;
  /** Helper text below the input. Requires wrapping in `Field.Root`. */
  description?: ReactNode;
}

const inputClasses =
  "rounded-none border-0 border-b border-hairline-strong bg-surface-1 px-4 py-[11px] text-base leading-[1.5] tracking-body text-ink transition-colors placeholder:text-ink-subtle enabled:hover:bg-surface-2 focus:border-b-2 focus:border-primary focus:outline-none data-[invalid]:border-b-2 data-[invalid]:border-error disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface-2 disabled:text-ink-subtle";

function Input({ className, error, description, ...props }: InputProps) {
  return (
    <>
      <BaseInput className={cn(inputClasses, className)} {...props} />
      {description ? (
        <BaseField.Description className="text-xs leading-[1.33] tracking-caption text-ink-subtle">
          {description}
        </BaseField.Description>
      ) : null}
      {error ? (
        <BaseField.Error className="text-xs leading-[1.33] tracking-caption text-error">
          {error}
        </BaseField.Error>
      ) : null}
    </>
  );
}

export { Input };
