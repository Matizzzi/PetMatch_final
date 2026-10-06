import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    login as loginService,
    logout as logoutService,
    obtenerUsuarioActual,
    registrar as registrarService,
} from "@/services/auth";
import { Usuario } from "@/types/api";

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  registrar: (email: string, password: string, nombre: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Al abrir la app, revisamos si ya hay una sesión guardada y válida.
    obtenerUsuarioActual()
      .then(setUsuario)
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginService(email, password);
    setUsuario(data);
  }, []);

  const registrar = useCallback(
    async (email: string, password: string, nombre: string) => {
      const data = await registrarService(email, password, nombre);
      setUsuario(data);
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutService();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, login, registrar, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
}
