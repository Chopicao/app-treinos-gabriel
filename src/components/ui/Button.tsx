import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent border-transparent hover:opacity-90',
  secondary: 'surface-raised text-main border-app hover:surface-sunken',
  ghost: 'bg-transparent text-main border-transparent hover:surface-raised',
  danger:
    'bg-transparent text-danger-600 dark:text-danger-400 border-danger-600/40 hover:bg-danger-600/10',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 rounded-xl gap-2 tap',
  lg: 'px-5 py-3.5 text-lg rounded-2xl gap-2.5 tap',
};

const BASE =
  'inline-flex items-center justify-center border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface ButtonLinkProps {
  to: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
  state?: unknown;
}

export function ButtonLink({
  to,
  variant = 'secondary',
  size = 'md',
  block = false,
  className,
  children,
  state,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      state={state}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
