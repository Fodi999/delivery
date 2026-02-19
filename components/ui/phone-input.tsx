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
    // Just pass the raw value to the formatter, it handles non-digits
    const formatted = formatPolishPhone(e.target.value);
    // Limit to 11 chars (9 digits + 2 spaces)
    if (formatted.length <= 11) {
      onChange(formatted);
    }
  };

  const placeholder = "___ ___ ___";

  return (
    <div className="w-full">
      <div className="flex items-center gap-0 w-full px-4">
        {/* Фиксированный код +48 (Польша) */}
        <div className="flex items-center gap-2 pr-4 border-r border-white/10 dark:border-white/20">
          <span className="text-xl font-black text-foreground dark:text-white opacity-60">+48</span>
        </div>

        {/* Input для номера */}
        <Input
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={handlePhoneChange}
          required={required}
          className={`flex-1 h-16 border-none bg-transparent shadow-none focus-visible:ring-0 text-2xl font-black tracking-[0.1em] placeholder:text-foreground/30 dark:placeholder:text-white/20 transition-none ${
            isDark ? "text-white" : "text-foreground"
          }`}
        />
      </div>
    </div>
  );
}
