/**
 * ReportPage.tsx  —  SQLite / offline-first version
 *
 * Removed: import type { Schema } from "../../amplify/data/resource"
 * Added:   local Account / TransactionUI types from db.ts
 *
 * All filtering and display logic is unchanged.
 */

import { useState, useMemo } from "react";
import type { Account, TransactionUI } from "../db";
import { categories, getCategoryMeta } from "./constants/categories";

interface Props {
  transactions: TransactionUI[];
  accounts: Account[];
  onBack: () => void;
}

// =======================
// HELPERS
// =======================
function formatAmount(value: number) {
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
}

function getMonthRange(monthOffset: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    start: fmt(start),
    end: fmt(end),
    label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

const DATE_PRESETS = [
  { label: "This Month",   offset: 0 },
  { label: "Last Month",   offset: -1 },
  { label: "2 Months Ago", offset: -2 },
  { label: "Custom",       offset: null },
] as const;

// =======================
export default function ReportPage({ transactions, accounts, onBack }: Props) {
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [datePreset, setDatePreset] = useState<number | null>(0);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const dateRange = useMemo(() => {
    if (datePreset !== null) return getMonthRange(datePreset);
    return { start: customFrom, end: customTo, label: "Custom Range" };
  }, [datePreset, customFrom, customTo]);

  function toggle<T>(set: Set<T>, item: T): Set<T> {
    const next = new Set(set);
    next.has(item) ? next.delete(item) : next.add(item);
    return next;
  }

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (selectedAccountIds.size > 0 && !selectedAccountIds.has(t.accountId)) return false;
        if (selectedTypes.size > 0 && !selectedTypes.has(t.TransactionType ?? "")) return false;
        if (selectedCategories.size > 0 && !selectedCategories.has(t.category ?? "")) return false;
        if (dateRange.start && t.date < dateRange.start) return false;
        if (dateRange.end && t.date > dateRange.end) return false;
        return true;
      })
      .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [transactions, selectedAccountIds, selectedTypes, selectedCategories, dateRange]);

  const summary = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of filtered) {
      const amt = Number(t.amount);
      if (t.TransactionType === "INCOME") income += amt;
      else expense += amt;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filtered) {
      if (t.TransactionType === "EXPENSE") {
        const cat = t.category ?? "OTHER";
        map.set(cat, (map.get(cat) ?? 0) + Number(t.amount));
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => ({ cat, total, meta: getCategoryMeta(cat) }));
  }, [filtered]);

  const totalExpense = summary.expense || 1;

  const activeFilterCount =
    selectedAccountIds.size + selectedTypes.size + selectedCategories.size +
    (datePreset !== 0 ? 1 : 0);

  function resetFilters() {
    setSelectedAccountIds(new Set());
    setSelectedTypes(new Set());
    setSelectedCategories(new Set());
    setDatePreset(0);
    setCustomFrom("");
    setCustomTo("");
  }

  // =======================
  return (
    <div className="h-dvh bg-gray-50 flex flex-col">

      {/* HEADER */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 text-white text-xl hover:bg-gray-900"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">Report</h2>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-lg hover:bg-gray-200"
        >
          🔽
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-100 text-blue-800 text-[9px] rounded-full flex items-center justify-center font-bold border border-blue-400">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* FILTER PANEL */}
        {filtersOpen && (
          <div className="bg-white border-b px-4 pt-3 pb-4 space-y-4">

            {/* Date preset */}
            <div>
              <div className="text-xs font-semibold !text-gray-900 mb-2">DATE RANGE</div>
              <div className="flex gap-2 flex-wrap">
                {DATE_PRESETS.map((p) => {
                  const active = p.offset === null ? datePreset === null : datePreset === p.offset;
                  return (
                    <button
                      key={p.label}
                      onClick={() => setDatePreset(p.offset ?? null)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                        active
                          ? "bg-blue-100 !text-blue-900 border-blue-400"
                          : "bg-white !text-gray-700 border-gray-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              {datePreset === null && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="flex-1 text-xs px-2 py-2 border rounded-lg"
                  />
                  <span className="self-center text-gray-400 text-xs">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="flex-1 text-xs px-2 py-2 border rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Account filter */}
            {accounts.length > 0 && (
              <div>
                <div className="text-xs font-semibold !text-gray-900 mb-2">ACCOUNT</div>
                <div className="flex gap-2 flex-wrap">
                  {accounts.map((acc) => {
                    const active = selectedAccountIds.has(acc.id);
                    return (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedAccountIds(toggle(selectedAccountIds, acc.id))}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                          active
                            ? "bg-blue-100 !text-blue-900 border-blue-400"
                            : "bg-white !text-gray-700 border-gray-200"
                        }`}
                      >
                        {acc.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Type filter */}
            <div>
              <div className="text-xs font-semibold !text-gray-900 mb-2">TYPE</div>
              <div className="flex gap-2">
                {(["INCOME", "EXPENSE", "TRANSFER"] as const).map((type) => {
                  const active = selectedTypes.has(type);
                  const color = type === "INCOME"
                    ? active ? "bg-green-100 !text-green-900 border-green-400" : "!text-green-800 border-green-200 bg-green-50"
                    : type === "EXPENSE"
                    ? active ? "bg-red-100 !text-red-900 border-red-400" : "!text-red-800 border-red-200 bg-red-50"
                    : active ? "bg-sky-100 !text-sky-900 border-sky-400" : "!text-sky-800 border-sky-200 bg-sky-50";
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedTypes(toggle(selectedTypes, type))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${color}`}
                    >
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category filter */}
            <div>
              <div className="text-xs font-semibold !text-gray-900 mb-2">CATEGORY</div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => {
                  const meta = getCategoryMeta(cat);
                  const active = selectedCategories.has(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategories(toggle(selectedCategories, cat))}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition ${
                        active
                          ? "bg-blue-100 !text-blue-900 border-blue-400"
                          : "bg-white !text-gray-700 border-gray-200"
                      }`}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs !text-red-500 underline">
                Reset all filters
              </button>
            )}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="p-4 space-y-3">
          <div className="text-xs font-semibold !text-gray-900">
            {dateRange.label} · {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <div className="text-[10px] !text-gray-900 mb-1">Income</div>
              <div className="text-sm font-bold text-green-600">₱{formatAmount(summary.income)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <div className="text-[10px] !text-gray-900 mb-1">Expense</div>
              <div className="text-sm font-bold text-red-500">₱{formatAmount(summary.expense)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <div className="text-[10px] !text-gray-900 mb-1">Net</div>
              <div className={`text-sm font-bold ${summary.net >= 0 ? "text-gray-900" : "text-red-500"}`}>
                {summary.net < 0 ? "-" : ""}₱{formatAmount(summary.net)}
              </div>
            </div>
          </div>

          {/* CATEGORY BREAKDOWN */}
          {categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-xs font-semibold !text-gray-900 mb-3">EXPENSE BY CATEGORY</div>
              <div className="space-y-3">
                {categoryBreakdown.map(({ cat, total, meta }) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${meta.bg}`}>
                          {meta.icon}
                        </div>
                        <span className="text-xs font-medium !text-gray-900">{meta.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-red-500">₱{formatAmount(total)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all"
                        style={{ width: `${(total / totalExpense) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRANSACTION LIST */}
          <div className="text-xs font-semibold !text-gray-900 mt-2">TRANSACTIONS</div>
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-10">
              No transactions match your filters.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {filtered.map((t) => {
                const meta = getCategoryMeta(t.category);
                const isIncome = t.TransactionType === "INCOME";
                return (
                  <div key={t.id} className="flex items-center gap-3 p-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full text-lg shrink-0 ${meta.bg}`}>
                      {meta.icon}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="text-sm font-medium !text-gray-900 truncate">
                        {t.payee ?? "No Payee"}
                      </div>
                      <div className="text-xs !text-gray-600">
                        {t.accountName ?? "Account"} · {meta.label} ·{" "}
                        {t.date
                          ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(t.date))
                          : ""}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold shrink-0 ${isIncome ? "text-green-600" : "text-red-500"}`}>
                      {isIncome ? "+" : "-"}₱{formatAmount(Number(t.amount))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
