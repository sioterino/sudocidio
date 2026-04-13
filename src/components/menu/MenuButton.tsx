"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

export interface MenuButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: ReactNode;
  icon?: ReactNode;
}

export function MenuButton({
  variant = "primary",
  children,
  icon,
  className = "",
  ...props
}: MenuButtonProps) {
  const baseStyles =
    "relative flex items-center justify-center gap-3 px-6 py-4 font-pixel text-xs uppercase tracking-wider transition-all duration-100 pixel-btn";

  const variantStyles = {
    primary:
      "bg-wood-500 text-cream-50 hover:bg-wood-400 pixel-border min-w-[280px]",
    secondary:
      "bg-wood-700 text-cream-100 hover:bg-wood-600 pixel-border-dark min-w-[280px]",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="leading-relaxed">{children}</span>
    </button>
  );
}
