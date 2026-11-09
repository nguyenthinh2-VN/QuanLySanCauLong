import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'border-zinc-200 bg-zinc-900 text-zinc-50',
        secondary:
          'border-slate-200 bg-slate-100 text-slate-700',
        destructive:
          'border-red-200 bg-red-50 text-red-700',
        outline:
          'border-slate-200 bg-white text-slate-700',
        zinc:
          'border-zinc-200 bg-zinc-100 text-zinc-800',
        sky:
          'border-indigo-200 bg-indigo-50 text-indigo-700',
        indigo:
          'border-indigo-200 bg-indigo-50 text-indigo-700',
        amber:
          'border-amber-200 bg-amber-50 text-amber-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

