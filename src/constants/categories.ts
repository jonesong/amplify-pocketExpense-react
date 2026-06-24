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

export type Category = (typeof categories)[number];

// Icon emoji + Tailwind bg color class for each category
export const categoryMeta: Record<
  Category,
  { icon: string; bg: string; label: string }
> = {
  CASH:          { icon: "💵", bg: "bg-green-100",   label: "Cash" },
  CLOTHING:      { icon: "👗", bg: "bg-pink-100",    label: "Clothing" },
  FOOD:          { icon: "🍔", bg: "bg-orange-100",  label: "Food" },
  GIFTS:         { icon: "🎁", bg: "bg-purple-100",  label: "Gifts" },
  GROCERIES:     { icon: "🛒", bg: "bg-lime-100",    label: "Groceries" },
  TRANSPORT:     { icon: "🚌", bg: "bg-blue-100",    label: "Transport" },
  SHOPPING:      { icon: "🛍️", bg: "bg-fuchsia-100", label: "Shopping" },
  BILLS:         { icon: "🧾", bg: "bg-yellow-100",  label: "Bills" },
  ENTERTAINMENT: { icon: "🎬", bg: "bg-indigo-100",  label: "Entertainment" },
  HEALTH:        { icon: "💊", bg: "bg-red-100",     label: "Health" },
  SALARY:        { icon: "💰", bg: "bg-emerald-100", label: "Salary" },
  SAVINGS:       { icon: "🏦", bg: "bg-teal-100",    label: "Savings" },
  TRANSFER:      { icon: "🔄", bg: "bg-sky-100",     label: "Transfer" },
  TRAVEL:        { icon: "✈️", bg: "bg-cyan-100",    label: "Travel" },
  OTHER:         { icon: "📦", bg: "bg-gray-100",    label: "Other" },
};

// Helper — safely get meta for any string (falls back to OTHER)
export function getCategoryMeta(cat?: string | null) {
  return categoryMeta[(cat as Category) ?? "OTHER"] ?? categoryMeta["OTHER"];
}
