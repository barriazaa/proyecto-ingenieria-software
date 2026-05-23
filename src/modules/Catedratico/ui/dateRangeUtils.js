export const formatDateLabel = (dateKey) => {
  if (!dateKey) {
    return "Sin definir";
  }

  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
};

export const isCompleteDateRange = (range) =>
  Boolean(range?.fechaInicio && range?.fechaFin);

export const getEmptyDateRange = () => ({ fechaInicio: "", fechaFin: "" });
