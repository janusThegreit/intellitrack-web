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
        <label className="block text-sm font-medium text-neutral-900 mb-2 dark:text-neutral-200">
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
            'w-full px-4 py-2 border border-neutral-300 rounded-lg text-base',
            'placeholder-neutral-400 text-neutral-900 dark:text-neutral-100',
            'transition-all duration-200',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
            'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed dark:disabled:bg-white/5 dark:disabled:text-neutral-500',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-100',
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
        <p className="text-sm text-error-600 mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-neutral-500 mt-1">{helperText}</p>
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
        <label className="block text-sm font-medium text-neutral-900 mb-2 dark:text-neutral-200">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full px-4 py-2 border border-neutral-300 rounded-lg text-base',
          'text-neutral-900 bg-white dark:bg-[#1d1d1d] dark:text-neutral-100',
          'transition-all duration-200',
          'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
          'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed',
          error && 'border-error-500 focus:border-error-500 focus:ring-error-100',
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
        <p className="text-sm text-error-600 mt-1">{error}</p>
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
        <label className="block text-sm font-medium text-neutral-900 mb-2 dark:text-neutral-200">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={clsx(
          'w-full px-4 py-2 border border-neutral-300 rounded-lg text-base',
          'placeholder-neutral-400 text-neutral-900 dark:text-neutral-100',
          'transition-all duration-200 resize-none',
          'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
          'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed',
          error && 'border-error-500 focus:border-error-500 focus:ring-error-100',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-error-600 mt-1">{error}</p>
      )}
    </div>
  )
);

TextArea.displayName = 'TextArea';

export { Input, Select, TextArea };
