import { useAuth } from "@/hooks/useAuth";
import { Redirect, Route } from "wouter";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  path: string;
  children: React.ReactNode;
};

export default function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : user ? (
        children
      ) : (
        <Redirect to="/auth" />
      )}
    </Route>
  );
}