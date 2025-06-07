import clsx from "clsx";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger";
}

const Button = ({ variant = "primary", className, ...props }: ButtonProps) => {
  const base = "px-4 py-2 rounded font-medium";
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800",
    outline: "border border-gray-300 text-black hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      {...props}
      className={clsx(base, variants[variant], className)}
    />
  );
};

export default Button;
