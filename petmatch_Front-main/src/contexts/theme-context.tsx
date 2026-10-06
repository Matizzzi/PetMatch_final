import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { Colors } from "@/constants/theme";
import { guardarTema, obtenerTema } from "@/services/storage";

type TemaModo = "light" | "dark";

export type ThemeColors = Record<keyof typeof Colors.light, string>;

interface ThemeContextValue {
  tema: TemaModo;
  colors: ThemeColors;
  cargando: boolean;
  toggleTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<TemaModo>("light");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerTema().then((guardado) => {
      if (guardado) setTema(guardado);
      setCargando(false);
    });
  }, []);

  const toggleTema = useCallback(() => {
    setTema((actual) => {
      const nuevo = actual === "light" ? "dark" : "light";
      guardarTema(nuevo);
      return nuevo;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ tema, colors: Colors[tema], cargando, toggleTema }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useAppTheme debe usarse dentro de un AppThemeProvider");
  return ctx;
}
