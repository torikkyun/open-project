import { cloneElement, type ReactElement, type ReactNode } from "react";
import { Field, type FieldRootProps } from "../ui";
import { cn } from "../ui/cn";

export interface FormFieldProps extends Omit<
  FieldRootProps,
  "children" | "invalid"
> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  invalid?: FieldRootProps["invalid"];
  required?: boolean;
  children: ReactElement<{ required?: boolean }>;
}

export function FormField({
  label,
  description,
  error,
  invalid,
  required,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <Field.Root
      className={cn("w-full", className)}
      invalid={invalid ?? Boolean(error)}
      {...props}
    >
      <Field.Label>
        {label}
        {required && (
          <span aria-hidden="true" className="text-error">
            {" *"}
          </span>
        )}
      </Field.Label>
      {cloneElement(children, {
        required: children.props.required ?? required,
      })}
      {error ? (
        <Field.Error match>{error}</Field.Error>
      ) : (
        description && <Field.Description>{description}</Field.Description>
      )}
    </Field.Root>
  );
}
