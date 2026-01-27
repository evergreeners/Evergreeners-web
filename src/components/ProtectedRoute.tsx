import { useSession } from "@/lib/auth-client";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const { data: session, isPending } = useSession();

    // Return null to keep the branded initial loader visible until session resolves
    if (isPending) {
        return null;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
