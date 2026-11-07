import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  rightLabelSlot?: React.ReactNode;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = 'Nhập mật khẩu',
  autoComplete = 'current-password',
  disabled = false,
  required = true,
  rightLabelSlot,
  showPassword: controlledShowPassword,
  onTogglePassword,
}: PasswordFieldProps) {
  const [internalShow, setInternalShow] = useState(false);
  const isVisible =
    controlledShowPassword !== undefined ? controlledShowPassword : internalShow;

  const handleToggle = () => {
    if (onTogglePassword) {
      onTogglePassword();
    } else {
      setInternalShow((prev) => !prev);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {rightLabelSlot}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
        />
        <button
          type="button"
          onClick={handleToggle}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 focus:outline-none"
          aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {isVisible ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 stroke-current stroke-[1.8]"
            >
              <path
                d="M3 3l18 18M10.58 10.58a2 2 0 1 0 2.83 2.83"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.88 5.09A10.94 10.94 0 0 1 12 4.9c5 0 9.27 3.11 11 7.5a11.8 11.8 0 0 1-2.16 3.39M6.61 6.61A11.84 11.84 0 0 0 1 12.4c1.73 4.39 6 7.5 11 7.5 1.85 0 3.59-.41 5.14-1.14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 stroke-current stroke-[1.8]"
            >
              <path
                d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
