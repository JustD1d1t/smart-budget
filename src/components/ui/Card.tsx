import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card = ({ children, className = "" }: CardProps) => {
    return (
        <div className={`bg-white rounded-xl shadow p-4 ${className}`} data-testid="card">
            {children}
        </div>
    );
};


export default Card;