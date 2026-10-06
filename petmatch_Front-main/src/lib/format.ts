export function formatearFecha(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return "Reciente";
  return fecha.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Enlace wa.me con un mensaje prellenado para contactar al testigo. */
export function urlWhatsAppTestigo(telefono: string, nombreMascota: string): string {
  const mensaje = encodeURIComponent(
    `Hola! Vi tu reporte de avistamiento en PetMatch. Creo que el animalito que viste podría ser mi mascota ${nombreMascota}. ¿Me podrías dar más información?`,
  );
  return `https://wa.me/${telefono.replace(/\D/g, "")}?text=${mensaje}`;
}
