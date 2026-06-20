export const categories = [
  "CASH",
  "CLOTHING",
  "FOOD",
  "GIFTS",
  "GROCERIES",
  "TRANSPORT",
  "SHOPPING",
  "BILLS",
  "ENTERTAINMENT",
  "HEALTH",
  "SALARY",
  "SAVINGS",
  "TRANSFER",
  "TRAVEL",
  "OTHER",
] as const;

export type Category = typeof categories[number];