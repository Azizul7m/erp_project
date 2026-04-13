export const POSITION_SALARY_MAP = {
  "General Manager": 90000,
  "Operations Manager": 78000,
  Accountant: 52000,
  "HR Executive": 45000,
  "Sales Executive": 42000,
  "Warehouse Officer": 36000,
  "Support Staff": 28000,
} as const;

export const POSITION_OPTIONS = Object.keys(POSITION_SALARY_MAP);

export function getSalaryForPosition(position: string): number {
  const salary =
    POSITION_SALARY_MAP[position as keyof typeof POSITION_SALARY_MAP];
  return typeof salary === "number" ? salary : 30000;
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}
