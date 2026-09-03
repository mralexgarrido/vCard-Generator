import { InputHTMLAttributes, ReactNode, useId } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

const InputField = ({
  label,
  icon,
  hint,
  error,
  containerClassName = '',
  id,
  required,
  ...props
}: InputFieldProps) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`group flex flex-col gap-2 ${containerClassName}`}>
      <label
        htmlFor={inputId}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors group-focus-within:text-brand-700"
      >
        {icon && <span aria-hidden="true" className="text-slate-400 transition-colors group-focus-within:text-brand-600">{icon}</span>}
        {label}
        {required && <span className="text-brand-700" aria-hidden="true">*</span>}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition
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

export default InputField;
