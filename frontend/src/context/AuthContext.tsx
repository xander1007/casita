import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest, logout as logoutRequest, me } from "../api/auth";
import { TOKEN_STORAGE_KEY } from "../api/axios";
import { AuthContext } from "./auth-context";
import type { LoginPayload, User } from "../types/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(
    () => localStorage.getItem(TOKEN_STORAGE_KEY) !== null,
  );

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      return;
    }

    me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(payload: LoginPayload) {
    const { user, token } = await loginRequest(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(user);
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    }
  }

  function hasRole(role: string) {
    return user?.roles.includes(role) ?? false;
  }

  function hasPermission(permission: string) {
    return user?.permissions.includes(permission) ?? false;
  }

  function hasAnyPermission(permissions: string[]) {
    return permissions.some((permission) => hasPermission(permission));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        hasRole,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
