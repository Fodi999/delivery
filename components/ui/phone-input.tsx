"use client";

import * as React from "react";
import { Input } from "./input";

// Форматирование польского номера: XXX XXX XXX
function formatPolishPhone(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  
  if (!digitsOnly) return "";
  if (digitsOnly.length <= 3) return digitsOnly;
  if (digitsOnly.length <= 6)
    return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`;
  return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6, 9)}`;
}

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  isDark?: boolean;
  required?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  error,
  helperText,
  isDark = false,
  required = false,
}: PhoneInputProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPolishPhone(e.target.value);
    onChange(formatted);
  };

  const placeholder = "___ ___ ___";

  return (
    <div>
      <div className="flex gap-2">
        {/* Фиксированный код +48 (Польша) */}
        <div
          className={`px-3 py-2 rounded-md border w-20 font-mono flex items-center justify-center ${
            isDark
              ? "bg-neutral-800 border-neutral-700 text-neutral-400"
              : "bg-neutral-100 border-neutral-300 text-neutral-600"
          }`}
        >
          +48
        </div>

        {/* Input для номера */}
        <Input
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={handlePhoneChange}
          required={required}
          className={`flex-1 ${isDark ? "bg-neutral-800 border-neutral-700" : ""} ${
            error ? "border-red-500" : ""
          }`}
        />
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Helper text */}
      {!error && helperText && (
        <p
          className={`text-xs mt-1 ${
            isDark ? "text-neutral-500" : "text-neutral-500"
          }`}
        >
          {helperText}
        </p>
      )}

      {/* Format hint (если нет error и helper) */}
      {!error && !helperText && value && (
        <p
          className={`text-xs mt-1 ${
            isDark ? "text-neutral-500" : "text-neutral-500"
          }`}
        >
          Format: +48 {placeholder}
        </p>
      )}
    </div>
  );
}
