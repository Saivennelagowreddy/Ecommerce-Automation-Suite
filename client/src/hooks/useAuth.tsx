import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = LoginData & {
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  token: string | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<{ user: User; token: string }, Error, LoginData>;
  registerMutation: UseMutationResult<{ user: User; token: string }, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));

  // Initialize auth state from localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  const {
    data: user,
    error,
    isLoading,
    isError,
  } = useQuery<User, Error>({
    queryKey: ['/api/users/me'],
    queryFn: async () => {
      // Skip if no token is available
      if (!token) return null;
      
      try {
        const res = await apiRequest('GET', '/api/users/me');
        if (!res.ok) {
          throw new Error('Failed to get user');
        }
        return await res.json();
      } catch (err) {
        // If authentication fails, clear the token
        setToken(null);
        throw err;
      }
    },
    enabled: !!token,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(['/api/users/me'], data.user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest('POST', '/api/auth/register', userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(['/api/users/me'], data.user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.user.name}!`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // No need to call the server for logout, just clear the client state
    },
    onSuccess: () => {
      setToken(null);
      queryClient.setQueryData(['/api/users/me'], null);
      // Optionally invalidate other queries that might contain user-specific data
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error: isError ? error : null,
        token,
        isAuthenticated: !!user && !!token,
        loginMutation,
        registerMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}