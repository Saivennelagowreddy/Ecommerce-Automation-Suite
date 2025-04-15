import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const LogoutPage = () => {
  const { logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logoutMutation.mutateAsync();
        navigate("/auth");
      } catch (error) {
        console.error("Logout failed:", error);
        // Redirect to auth page even if logout fails
        navigate("/auth");
      }
    };

    handleLogout();
  }, [logoutMutation, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <h2 className="text-xl font-medium">Logging out...</h2>
      </div>
    </div>
  );
};

export default LogoutPage;