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
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
          className={clsx(
            'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm',
            'text-slate-900 placeholder:text-slate-400',
            'transition-all duration-200',
            'focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
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
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
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
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900',
          'transition-all duration-200',
          'focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15',
          'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
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
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={clsx(
          'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
          'transition-all duration-200 resize-none',
          'focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15',
          'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
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
