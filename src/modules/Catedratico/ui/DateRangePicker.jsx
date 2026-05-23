import { useMemo, useState } from "react";
import {
  formatDateLabel,
  getEmptyDateRange,
  isCompleteDateRange,
} from "./dateRangeUtils";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInitialCalendarMonth = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

const addMonths = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const buildCalendarDays = (visibleMonth) => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const placeholders = Array.from({ length: firstDay.getDay() }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    return {
      date,
      key: toDateKey(date),
      dayNumber: index + 1,
    };
  });

  return [...placeholders, ...days];
};

const DateRangePicker = ({
  dateRange,
  onDateRangeChange,
  title = "Rango de fechas",
  rangeMeta = "Usando historial completo",
  emptyLabel = "Rango completo",
}) => {
  const [visibleMonth, setVisibleMonth] = useState(getInitialCalendarMonth);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const currentRange = dateRange || getEmptyDateRange();
  const appliedDateRange = isCompleteDateRange(currentRange) ? currentRange : null;
  const rangeLabel = appliedDateRange
    ? `${formatDateLabel(appliedDateRange.fechaInicio)} - ${formatDateLabel(
        appliedDateRange.fechaFin
      )}`
    : currentRange.fechaInicio
      ? `${formatDateLabel(currentRange.fechaInicio)} - Sin definir`
      : emptyLabel;
  const canClear = Boolean(currentRange.fechaInicio || currentRange.fechaFin);

  const handleCalendarDateClick = (dateKey) => {
    if (!currentRange.fechaInicio || currentRange.fechaFin) {
      onDateRangeChange({ fechaInicio: dateKey, fechaFin: "" });
      return;
    }

    if (dateKey < currentRange.fechaInicio) {
      onDateRangeChange({ fechaInicio: dateKey, fechaFin: currentRange.fechaInicio });
      return;
    }

    onDateRangeChange({ fechaInicio: currentRange.fechaInicio, fechaFin: dateKey });
  };

  const clearDateRange = () => {
    onDateRangeChange(getEmptyDateRange());
  };

  return (
    <div style={styles.dateFilter}>
      <div style={styles.dateFilterInfo}>
        <span style={styles.label}>{title}</span>
        <strong style={styles.rangeText}>{rangeLabel}</strong>
        <span style={styles.rangeMeta}>{rangeMeta}</span>
        <button
          type="button"
          style={{
            ...styles.clearButton,
            ...(!canClear ? styles.buttonDisabled : {}),
          }}
          onClick={clearDateRange}
          disabled={!canClear}
        >
          Limpiar rango
        </button>
      </div>

      <div style={styles.calendar}>
        <div style={styles.calendarHeader}>
          <button
            type="button"
            style={styles.calendarNavButton}
            onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
            aria-label="Mes anterior"
          >
            {"<"}
          </button>
          <strong style={styles.calendarTitle}>
            {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
          </strong>
          <button
            type="button"
            style={styles.calendarNavButton}
            onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
            aria-label="Mes siguiente"
          >
            {">"}
          </button>
        </div>

        <div style={styles.weekDays}>
          {WEEKDAY_LABELS.map((day) => (
            <span key={day} style={styles.weekDay}>
              {day}
            </span>
          ))}
        </div>

        <div style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} style={styles.calendarPlaceholder} />;
            }

            const isRangeStart = day.key === currentRange.fechaInicio;
            const isRangeEnd = day.key === currentRange.fechaFin;
            const isInsideRange =
              appliedDateRange &&
              day.key > appliedDateRange.fechaInicio &&
              day.key < appliedDateRange.fechaFin;
            const isToday = day.key === todayKey;

            return (
              <button
                key={day.key}
                type="button"
                style={{
                  ...styles.calendarDay,
                  ...(isInsideRange ? styles.calendarDayInRange : {}),
                  ...(isToday ? styles.calendarDayToday : {}),
                  ...(isRangeStart || isRangeEnd ? styles.calendarDaySelected : {}),
                }}
                onClick={() => handleCalendarDateClick(day.key)}
              >
                {day.dayNumber}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles = {
  dateFilter: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
    alignItems: "start",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
  },
  dateFilterInfo: {
    display: "grid",
    alignContent: "start",
    gap: "8px",
  },
  label: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "2px",
  },
  rangeText: {
    color: "#0f172a",
    fontSize: "20px",
  },
  rangeMeta: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },
  clearButton: {
    justifySelf: "start",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "9px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  calendar: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px",
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  calendarTitle: {
    color: "#0f172a",
    fontSize: "15px",
  },
  calendarNavButton: {
    width: "34px",
    height: "34px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "800",
  },
  weekDays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(28px, 1fr))",
    gap: "6px",
    marginBottom: "6px",
  },
  weekDay: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
    textAlign: "center",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(28px, 1fr))",
    gap: "6px",
  },
  calendarPlaceholder: {
    minHeight: "34px",
  },
  calendarDay: {
    minHeight: "34px",
    border: "1px solid transparent",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  calendarDayToday: {
    borderColor: "#2563eb",
  },
  calendarDayInRange: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  calendarDaySelected: {
    background: "#2563eb",
    color: "#ffffff",
    borderColor: "#2563eb",
  },
};

export default DateRangePicker;
