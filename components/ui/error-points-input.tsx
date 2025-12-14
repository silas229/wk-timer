"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ErrorPointsInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function ErrorPointsInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className = ""
}: Readonly<ErrorPointsInputProps>) {
  const handleDecrement = () => {
    const current = Number.parseFloat(value) || 0;
    const newValue = Math.max(0, current - 5);
    onChange(newValue.toString());
  };

  const handleIncrement = () => {
    const current = Number.parseFloat(value) || 0;
    const newValue = current + 5;
    onChange(newValue.toString());
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDecrement}
          disabled={disabled}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50"
        >
          -
        </Button>
        <Input
          id={id}
          type="number"
          min="0"
          step="5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          disabled={disabled}
          className="text-center px-12"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleIncrement}
          disabled={disabled}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50"
        >
          +
        </Button>
      </div>
    </div>
  );
}
