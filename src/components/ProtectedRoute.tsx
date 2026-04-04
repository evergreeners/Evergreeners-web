import { useSession } from "@/lib/auth-client";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const { data: session, isPending } = useSession();

    // Show minimal loading UI - the initial-loader will still be visible
    // This prevents returning null which causes a blank screen
    if (isPending) {
        // Return null so React doesn't render anything into #root yet
        // This keeps the high-quality initial-loader from index.html visible
        return null;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
