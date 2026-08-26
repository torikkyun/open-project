import { Field as BaseField } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export type FieldRootProps = ComponentProps<typeof BaseField.Root>;
export type FieldLabelProps = ComponentProps<typeof BaseField.Label>;
export type FieldDescriptionProps = ComponentProps<
  typeof BaseField.Description
>;
export type FieldErrorProps = ComponentProps<typeof BaseField.Error>;
export type FieldItemProps = ComponentProps<typeof BaseField.Item>;

function FieldRoot({ className, ...props }: FieldRootProps) {
  return (
    <BaseField.Root
      className={cn("flex flex-col items-start gap-2", className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      className={cn(
        "text-body-sm font-normal tracking-body text-ink data-[disabled]:text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <BaseField.Description
      className={cn(
        "text-xs leading-[1.33] tracking-caption text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: FieldErrorProps) {
  return (
    <BaseField.Error
      className={cn(
        "text-xs leading-[1.33] tracking-caption text-error",
        className,
      )}
      {...props}
    />
  );
}

function FieldItem({ className, ...props }: FieldItemProps) {
  return (
    <BaseField.Item
      className={cn("flex items-start gap-2", className)}
      {...props}
    />
  );
}

export const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
  Item: FieldItem,
  Validity: BaseField.Validity,
};
