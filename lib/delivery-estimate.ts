const DELIVERY_MIN_DAYS = 3;
const DELIVERY_MAX_DAYS = 7;

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function deliveryEstimateLabel(orderDate: string | Date = new Date()) {
  const createdAt = new Date(orderDate);
  const earliest = addDays(createdAt, DELIVERY_MIN_DAYS);
  const latest = addDays(createdAt, DELIVERY_MAX_DAYS);

  return `3–7 hari (${dateFormatter.format(earliest)}–${dateFormatter.format(latest)})`;
}
