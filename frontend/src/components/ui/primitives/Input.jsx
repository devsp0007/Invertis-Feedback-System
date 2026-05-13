import React from 'react';
import { X } from 'lucide-react';

export const Input = React.forwardRef(
  (
    {
      type = 'text',
      error = '',
      hint = '',
      leadingIcon: LeadingIcon = null,
      trailingIcon: TrailingIcon = null,
      clearable = false,
      onClear = () => {},
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [value, setValue] = React.useState(props.value || '');

    const handleClear = () => {
      setValue('');
      onClear();
    };

    return (
      <div className="w-full flex flex-col gap-2">
        <div className="relative flex items-center">
          {LeadingIcon && (
            <LeadingIcon className="absolute left-3 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
          )}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`w-full bg-[var(--bg-input)] text-[var(--text-primary)] border-2 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none ${
              error
                ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-4 focus:ring-[var(--color-error)]/10'
                : 'border-[var(--border-input)] focus:border-[var(--border-focus)] focus:ring-4 focus:ring-[var(--focus-ring)]'
            } disabled:opacity-60 disabled:cursor-not-allowed ${LeadingIcon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
          {clearable && value && (
            <button
              onClick={handleClear}
              type="button"
              className="absolute right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {TrailingIcon && !clearable && (
            <TrailingIcon className="absolute right-3 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
          )}
        </div>
        {error && (
          <span className="text-sm text-[var(--color-error)] font-medium">{error}</span>
        )}
        {hint && !error && (
          <span className="text-sm text-[var(--text-secondary)]">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
