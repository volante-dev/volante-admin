const adminTimeZone = "Europe/Paris";

const dateTimePartsFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: adminTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const displayDateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: adminTimeZone,
  dateStyle: "medium",
  timeStyle: "short",
});

const getDateTimeParts = (date: Date) => {
  const parts = dateTimePartsFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
};

export const toAdminDatetimeLocal = (value: string | Date | null) => {
  if (!value) return "";

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const { year, month, day, hour, minute } = getDateTimeParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export const nowAdminDatetimeLocal = () => toAdminDatetimeLocal(new Date());

export const formatAdminDateTime = (value: string | null) => {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return displayDateTimeFormatter.format(date);
};
