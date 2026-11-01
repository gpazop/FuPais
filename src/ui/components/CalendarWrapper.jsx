// ========================================================
// FUPAIS — CalendarWrapper
// Envoltorio React para FuPaisCalendar (clase vanilla,
// intacta desde domain/ui). Se monta sobre
// #calendar-mount-point existente en index.html.
// ========================================================

import { useEffect, useRef } from "react";
import { FuPaisCalendar } from "../../components/calendar.js";

export default function CalendarWrapper({ metrics, customEvents, onDateSelect }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current || document.getElementById("calendar-mount-point");
    if (!mount) return;

    if (!mountRef.current) {
      mountRef.current = mount;
      mount.calendarInstance = new FuPaisCalendar(mount, (dateStr) => {
        onDateSelect?.(dateStr);
      });
    }

    if (metrics) {
      mount.calendarInstance.setData(metrics, customEvents || []);
    }
  }, [metrics, customEvents, onDateSelect]);

  return (
    <section className="card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="card-header">
        <div className="card-header-inner">
          <h2 className="card-title">Calendario de Estancia y Conteo Diario</h2>
          <p className="text-caption" style={{ textTransform: "none" }}>
            Haz clic en cualquier día para ver el recuento exacto, hitos migratorios
            o agregar recordatorios personales.
          </p>
        </div>
      </div>
      <div id="calendar-mount-point" ref={mountRef} />
    </section>
  );
}
