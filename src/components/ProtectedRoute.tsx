import { Navigate } from "react-router-dom";
import { useUserStore } from "../stores/userStore";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { user, isLoading } = useUserStore();

    if (isLoading) {
        return <div className="text-center p-8">Sprawdzanie sesji...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
