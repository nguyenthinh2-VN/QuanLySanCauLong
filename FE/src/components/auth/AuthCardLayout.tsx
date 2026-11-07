import React from 'react';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface AuthCardLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  topNotification?: React.ReactNode;
}

export function AuthCardLayout({
  title,
  description,
  children,
  footer,
  topNotification,
}: AuthCardLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-slate-50 px-4 py-10">
      {topNotification}

      <Card className="w-full max-w-md border-t-4 border-t-emerald-600 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 stroke-current stroke-[1.8]"
              aria-hidden="true"
            >
              <path
                d="M12 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 14.5 5 5l5.5 2.5L12 4l1.5 3.5L19 5l-4.5 9.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            {description}
          </CardDescription>
        </CardHeader>

        {children}

        {footer && (
          <CardFooter className="justify-center border-t border-slate-100 pt-4 text-sm text-slate-600">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
