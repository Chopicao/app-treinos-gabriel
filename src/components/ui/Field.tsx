import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'surface border-app w-full rounded-xl border px-3 py-2.5 tap placeholder:text-ink-400 disabled:opacity-60';

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  htmlFor: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-muted text-xs">{hint}</p> : null}
      {error ? (
        <p className="text-danger-600 dark:text-danger-400 text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
}

export function TextInput({
  label,
  hint,
  error,
  className,
  wrapperClassName,
  id,
  ...rest
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId} className={wrapperClassName}>
      <input id={inputId} className={cn(CONTROL, className)} {...rest} />
    </Field>
  );
}

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  wrapperClassName?: string;
}

export function SelectInput({
  label,
  hint,
  className,
  wrapperClassName,
  id,
  children,
  ...rest
}: SelectInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} htmlFor={inputId} className={wrapperClassName}>
      <select id={inputId} className={cn(CONTROL, className)} {...rest}>
        {children}
      </select>
    </Field>
  );
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  wrapperClassName?: string;
}

export function TextArea({ label, hint, className, wrapperClassName, id, ...rest }: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} htmlFor={inputId} className={wrapperClassName}>
      <textarea id={inputId} rows={3} className={cn(CONTROL, 'min-h-24', className)} {...rest} />
    </Field>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint ? <p className="text-muted mt-0.5 text-xs">{hint}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-50',
          checked ? 'bg-accent border-accent' : 'surface-sunken border-app',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]',
            checked ? 'left-6' : 'left-0.5',
          )}
        />
        <span className="sr-only">{checked ? 'Ativado' : 'Desativado'}</span>
      </button>
    </div>
  );
}
