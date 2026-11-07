import React from 'react';

export interface AuthAlertProps {
  variant: 'error' | 'success' | 'warning';
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<AuthAlertProps['variant'], string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

export function AuthAlert({ variant, children }: AuthAlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-3.5 py-2.5 text-sm ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </div>
  );
}
