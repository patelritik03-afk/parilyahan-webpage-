export const labelClass = "block text-sm font-medium text-foreground/80";
export const controlClass =
  "mt-1 rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none";
export const inputClass = `w-full ${controlClass}`;

export function Field({
  label,
  name,
  type,
  required,
  min,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  min?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        min={min}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}
