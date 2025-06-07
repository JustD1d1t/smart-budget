import clsx from "clsx";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

const Input = ({ error, className, ...props }: InputProps) => {
    return (
        <>
            <input
                {...props}
                className={clsx(
                    "w-full p-2 border rounded text-sm focus:outline-none focus:ring-2",
                    error
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-black",
                    className
                )}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </>
    );
};

export default Input;
