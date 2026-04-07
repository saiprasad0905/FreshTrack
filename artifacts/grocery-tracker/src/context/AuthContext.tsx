import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface Fridge {
  id: number;
  name: string;
  icon: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  activeFridge: Fridge | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  selectFridge: (fridge: Fridge) => void;
  createFridge: (name: string, icon: string) => Promise<Fridge>;
  fridges: Fridge[];
  setFridges: (f: Fridge[]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "freshtrack_auth";
const FRIDGE_KEY = "freshtrack_fridge";

async function apiFetch(path: string, options: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers: { ...headers, ...(options.headers as Record<string, string> || {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, activeFridge: null, isLoading: true });
  const [fridges, setFridges] = useState<Fridge[]>([]);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedFridge = localStorage.getItem(FRIDGE_KEY);
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored);
        const activeFridge = storedFridge ? JSON.parse(storedFridge) : null;
        setState({ user, token, activeFridge, isLoading: false });
        setAuthTokenGetter(() => token);
        // Load fridges
        apiFetch("/api/fridges", {}, token)
          .then(d => setFridges(d.fridges ?? []))
          .catch(() => {});
      } catch {
        setState(s => ({ ...s, isLoading: false }));
      }
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    const { user, token } = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    setAuthTokenGetter(() => token);
    setState(s => ({ ...s, user, token, activeFridge: null }));
    localStorage.removeItem(FRIDGE_KEY);
    // Load fridges
    const fridgeData = await apiFetch("/api/fridges", {}, token);
    setFridges(fridgeData.fridges ?? []);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiFetch("/api/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) });
    const { user, token } = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    setAuthTokenGetter(() => token);
    setState(s => ({ ...s, user, token, activeFridge: null }));
    localStorage.removeItem(FRIDGE_KEY);
    setFridges([]);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FRIDGE_KEY);
    setAuthTokenGetter(null);
    setState({ user: null, token: null, activeFridge: null, isLoading: false });
    setFridges([]);
  }, []);

  const selectFridge = useCallback((fridge: Fridge) => {
    localStorage.setItem(FRIDGE_KEY, JSON.stringify(fridge));
    setState(s => ({ ...s, activeFridge: fridge }));
  }, []);

  const createFridge = useCallback(async (name: string, icon: string): Promise<Fridge> => {
    const token = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").token;
    const data = await apiFetch("/api/fridges", { method: "POST", body: JSON.stringify({ name, icon }) }, token);
    const fridge = data.fridge as Fridge;
    setFridges(prev => [...prev, fridge]);
    return fridge;
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, selectFridge, createFridge, fridges, setFridges }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
