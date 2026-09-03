import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon, className, ...props }) => {
  return (
    <div className={`flex flex-col gap-2 group ${className}`}>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 transition-colors group-focus-within:text-brand-600">
        {icon && <span className="text-slate-400 group-focus-within:text-brand-500 transition-colors">{icon}</span>}
        {label}
      </label>
      <input
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm 
                   hover:border-brand-200 hover:shadow-md transition-all duration-300 ease-out
                   focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:shadow-lg focus:-translate-y-0.5
                   outline-none text-sm text-slate-800 placeholder:text-slate-300"
        {...props}
      />
    </div>
  );
};

export default InputField;