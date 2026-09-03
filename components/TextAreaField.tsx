import { ReactNode, TextareaHTMLAttributes, useId } from 'react';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: ReactNode;
  hint?: string;
  error?: string;
  showCount?: boolean;
}

const TextAreaField = ({
  label,
  icon,
  hint,
  error,
  showCount = false,
  id,
  required,
  maxLength,
  value,
  ...props
}: TextAreaFieldProps) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const count = typeof value === 'string' ? value.length : 0;

  return (
    <div className="group flex flex-col gap-2">
      <div className="flex items-end justify-between gap-4">
        <label
          htmlFor={inputId}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors group-focus-within:text-brand-700"
        >
          {icon && <span aria-hidden="true" className="text-slate-400 transition-colors group-focus-within:text-brand-600">{icon}</span>}
          {label}
          {required && <span className="text-brand-700" aria-hidden="true">*</span>}
        </label>
        {showCount && maxLength && (
          <span className="text-xs tabular-nums text-slate-500" aria-hidden="true">
            {count}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={inputId}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`min-h-28 w-full resize-y rounded-xl border bg-white px-4 py-3 text-base leading-relaxed text-slate-900 shadow-sm outline-none transition
          placeholder:text-slate-400 hover:border-brand-300
          focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/15
          ${error ? 'border-red-500' : 'border-slate-300'}`}
        {...props}
      />
      {hint && <p id={hintId} className="text-xs leading-relaxed text-slate-500">{hint}</p>}
      {error && <p id={errorId} className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
};

export default TextAreaField;
