import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText,
    startIcon,
    endIcon,
    ...props 
  }, ref) => (
    <div className="w-full">
      {label && (
          <label className="mb-1.5 block text-sm font-medium text-content-secondary">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {startIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx( 'w-full rounded-lg border border-border-default bg-surface-input px-4 py-2.5 text-sm', 'text-content-primary placeholder:text-content-secondary', 'transition-all duration-200', 'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15', 'disabled:bg-surface-app disabled:text-content-secondary disabled:cursor-not-allowed',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500/15',
            startIcon && 'pl-10',
            endIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {endIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-content-secondary">{helperText}</p>
      )}
    </div>
  )
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    options,
    ...props 
  }, ref) => (
    <div className="w-full">
      {label && (
          <label className="mb-1.5 block text-sm font-medium text-content-secondary">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={clsx( 'w-full rounded-lg border border-border-default bg-surface-input px-4 py-2.5 text-sm text-content-primary', 'transition-all duration-200', 'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15', 'disabled:bg-surface-app disabled:text-content-secondary disabled:cursor-not-allowed',
          error && 'border-error-500 focus:border-error-500 focus:ring-error-500/15',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
);

Select.displayName = 'Select';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ 
    className, 
    label, 
    error,
    ...props 
  }, ref) => (
    <div className="w-full">
      {label && (
          <label className="mb-1.5 block text-sm font-medium text-content-secondary">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={clsx( 'w-full rounded-lg border border-border-default bg-surface-input px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary', 'transition-all duration-200 resize-none', 'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15', 'disabled:bg-surface-app disabled:text-content-secondary disabled:cursor-not-allowed',
          error && 'border-error-500 focus:border-error-500 focus:ring-error-500/15',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
);

TextArea.displayName = 'TextArea';

export { Input, Select, TextArea };
