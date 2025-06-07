import { useEffect } from "react";
import ReactDOM from "react-dom";

interface ToastProps {
    message: string;
    type?: "info" | "success" | "error";
    duration?: number;
    onClose: () => void;
}

const Toast = ({ message, type = "info", duration = 3000, onClose }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const base = "fixed bottom-6 right-6 px-4 py-2 rounded text-white shadow-lg z-50";
    const colors = {
        info: "bg-blue-500",
        success: "bg-green-500",
        error: "bg-red-500",
    };

    const toast = (
        <div className={`${base} ${colors[type]}`}>{message}</div>
    );

    return ReactDOM.createPortal(toast, document.body);
};

export default Toast;
