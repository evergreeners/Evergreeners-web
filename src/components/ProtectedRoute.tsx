import { useSession } from "@/lib/auth-client";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const { data: session, isPending } = useSession();

    // Show minimal loading UI - the initial-loader will still be visible
    // This prevents returning null which causes a blank screen
    if (isPending) {
        // Return minimal structure so React has something to render
        // Initial loader from HTML will stay visible until session resolves
        return <div />;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
