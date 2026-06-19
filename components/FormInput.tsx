"use client";

import * as React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Field } from "@base-ui/react/field";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FormInputType = "text" | "password" | "email" | "tel";

type FormInputProps<T extends FieldValues> = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "type"
> & {
  name: Path<T>;
  label?: string;
  type?: FormInputType;
  control: Control<T>;
  containerClassName?: string;
  showPasswordToggle?: boolean;
  startIcon?: React.ReactNode;
  hint?: React.ReactNode;
};

export function FormInput<T extends FieldValues>({
  name,
  label,
  type = "text",
  control,
  className,
  containerClassName,
  showPasswordToggle = true,
  startIcon,
  hint,
  ...props
}: FormInputProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;
  const hasPasswordToggle = type === "password" && showPasswordToggle;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field.Root
          invalid={fieldState.invalid}
          className={cn("flex flex-col gap-1.5", containerClassName)}
        >
          {label && (
            <Field.Label
              htmlFor={field.name}
              className="text-sm font-semibold text-foreground"
            >
              {label}
            </Field.Label>
          )}
          <div className="relative">
            {startIcon && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors [&_svg]:size-4"
              >
                {startIcon}
              </span>
            )}
            <Input
              {...field}
              {...props}
              id={field.name}
              type={inputType}
              aria-invalid={fieldState.invalid}
              value={(field.value as string | number | undefined) ?? ""}
              onChange={(event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.value);
              }}
              className={cn(
                className,
                startIcon && "pl-10",
                hasPasswordToggle && "pr-11",
              )}
            />
            {hasPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            )}
          </div>
          {hint && !fieldState.invalid && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
          {fieldState.invalid &&
            typeof fieldState.error?.message === "string" && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {fieldState.error.message}
              </p>
            )}
        </Field.Root>
      )}
    />
  );
}

export default FormInput;
