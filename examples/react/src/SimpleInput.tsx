import React, { useState } from "react";

export interface SimpleInputProps {
  maxLength: number;
  initialValue?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function SimpleInput({
  maxLength,
  initialValue = "",
  disabled = false,
  placeholder = "Enter text...",
}: SimpleInputProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue.length > maxLength) {
      setError(`Maximum length is ${maxLength} characters`);
      return;
    }

    setValue(newValue);
    setError("");
  };

  return (
    <div>
      <input
        type="text"
        data-testid="simple-input"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? "input-error" : undefined}
        style={{
          padding: "8px",
          border: error ? "2px solid red" : "1px solid #ccc",
          borderRadius: "4px",
          width: "300px",
        }}
      />
      {error && (
        <div
          id="input-error"
          role="alert"
          style={{ color: "red", marginTop: "4px", fontSize: "14px" }}
        >
          {error}
        </div>
      )}
      <div
        data-testid="char-count"
        style={{ marginTop: "4px", fontSize: "12px", color: "#666" }}
      >
        {value.length} / {maxLength}
      </div>
    </div>
  );
}
