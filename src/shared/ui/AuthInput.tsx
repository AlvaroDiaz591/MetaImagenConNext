import React from "react";

type AuthInputProps = {
  id: string;
  label: string;
  type?: "text" | "password" | "email";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  prefix?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
};

const AuthInput = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  inputMode,
  maxLength,
  prefix,
  icon,
  trailing,
}: AuthInputProps) => {
  const inputClassName = [
    "auth-input",
    prefix ? "auth-input-with-prefix" : "",
    trailing || icon ? "auth-input-with-trailing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-field-label">
        {label}
      </label>
      <div className="auth-field-control">
        {prefix ? <span className="auth-input-prefix">{prefix}</span> : null}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={inputClassName}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
        />
        {trailing ? <span className="auth-input-trailing">{trailing}</span> : null}
        {!trailing && icon ? <span className="auth-input-icon">{icon}</span> : null}
      </div>
    </div>
  );
};

export default AuthInput;
