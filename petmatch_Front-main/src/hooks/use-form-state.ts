import { useCallback, useState } from "react";

import type { FieldSetter } from "@/types/forms";

/**
 * Estado de formulario genérico y tipado.
 * `setField` garantiza en compilación que el valor coincide con el tipo del campo.
 */
export function useFormState<T extends object>(crearInicial: () => T) {
  const [values, setValues] = useState<T>(crearInicial);

  const setField: FieldSetter<T> = useCallback((campo, valor) => {
    setValues((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const patch = useCallback((parcial: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...parcial }));
  }, []);

  const reset = useCallback((siguiente: T) => setValues(siguiente), []);

  return { values, setField, patch, reset };
}
