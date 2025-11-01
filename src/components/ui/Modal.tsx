import React from "react";
import ReactDOM from "react-dom";

interface ModalProps {
    onClose: () => void;
    children: React.ReactNode;
}

const Modal = ({ onClose, children }: ModalProps) => {
    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-[640px] relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-5 text-gray-500 hover:text-black"
                >
                    ✕
                </button>
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
