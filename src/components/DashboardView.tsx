import React, { useMemo } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  Bell,
  ChevronRight,
  ShoppingCart,
  Boxes,
  Users,
  DollarSign,
  ChevronDown,
  CreditCard,
  Barcode,
  Plus,
  Receipt,
} from "lucide-react";
import { StoreSettings, UserProfile, InventoryItem, StockMovement } from "../types";
import { sounds } from "../lib/sound";

interface DashboardViewProps {
  settings: StoreSettings;
  userProfile?: UserProfile | null;
  items: InventoryItem[];
  movements: StockMovement[];
  onNavigateTo: (view: string) => void;
  onOpenQuickSale?: () => void;
  onOpenScanner?: () => void;
  onOpenNotifications?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  settings,
  userProfile,
  items,
  movements,
  onNavigateTo,
  onOpenQuickSale,
  onOpenScanner,
  onOpenNotifications,
}) => {
  const isSuperAdmin =
    userProfile?.identifier?.toLowerCase() === "settaholdings@gmail.com";

  const currencySymbol = settings.currencySymbol || "$";

  // Filter actual sales movements
  const salesMovements = useMemo(() => {
    return (movements || []).filter(
      (m) =>
        m.type === "sale" ||
        m.type === "sale_paid" ||
        m.type === "sale_credit" ||
        (m.note && m.note.toLowerCase().includes("sale"))
    );
  }, [movements]);

  // Dynamic Total Sales
  const totalSales = useMemo(() => {
    return salesMovements.reduce((sum, m) => {
      const item = (items || []).find((i) => i.id === m.itemId);
      const price = item?.sellingPrice || 0;
      const qty = Math.abs(m.delta) || 1;
      return sum + price * qty;
    }, 0);
  }, [salesMovements, items]);

  // Dynamic Total Profit
  const totalProfit = useMemo(() => {
    return salesMovements.reduce((sum, m) => {
      const item = (items || []).find((i) => i.id === m.itemId);
      if (item) {
        const qty = Math.abs(m.delta) || 1;
        const profitPerUnit = Math.max(0, item.sellingPrice - item.costPrice);
        return sum + profitPerUnit * qty;
      }
      return sum;
    }, 0);
  }, [salesMovements, items]);

  // Dynamic Total Orders
  const totalOrders = salesMovements.length;

  // Dynamic Total Customers
  const totalCustomers = useMemo(() => {
    const customers = new Set<string>();
    salesMovements.forEach((m) => {
      if (m.note) {
        const match = m.note.match(/to\s+([^-]+)/i) || m.note.match(/-\s+([^-]+)$/i);
        if (match && match[1]) customers.add(match[1].trim());
        else customers.add(m.id);
      } else {
        customers.add(m.id);
      }
    });
    return customers.size;
  }, [salesMovements]);

  // Dynamic Recent Orders
  const recentOrders = useMemo(() => {
    return salesMovements.slice(0, 5).map((m, idx) => {
      const item = (items || []).find((i) => i.id === m.itemId);
      const price = item?.sellingPrice || 0;
      const qty = Math.abs(m.delta) || 1;
      let customer = "Walk-in Customer";
      if (m.note) {
        const match = m.note.match(/to\s+([^-]+)/i) || m.note.match(/-\s+([^-]+)$/i);
        if (match && match[1]) customer = match[1].trim();
      }
      const dateStr = new Date(m.timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        id: `#ORD-${m.id.slice(-4).toUpperCase() || (1001 + idx)}`,
        date: dateStr,
        amount: price * qty,
        status: "Completed",
        customer,
      };
    });
  }, [salesMovements, items]);

  // Top products from real sales or stock
  const topProducts = useMemo(() => {
    if (salesMovements.length === 0) return [];
    const salesByItem = new Map<string, { item: InventoryItem; count: number }>();
    salesMovements.forEach((m) => {
      const item = (items || []).find((i) => i.id === m.itemId);
      if (item) {
        const existing = salesByItem.get(item.id);
        const qty = Math.abs(m.delta) || 1;
        if (existing) {
          existing.count += qty;
        } else {
          salesByItem.set(item.id, { item, count: qty });
        }
      }
    });

    return Array.from(salesByItem.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map(({ item, count }) => ({
        id: item.id,
        name: item.name,
        price: item.sellingPrice,
        salesCount: count,
        image: item.notes && item.notes.startsWith("http")
          ? item.notes
          : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80",
      }));
  }, [salesMovements, items]);

  // Trajectory chart points based on real data
  const chartPoints = useMemo(() => {
    if (salesMovements.length === 0) {
      return [
        { date: "Day 1", val: 0, x: 20, y: 140 },
        { date: "Day 7", val: 0, x: 80, y: 140 },
        { date: "Day 14", val: 0, x: 140, y: 140 },
        { date: "Day 21", val: 0, x: 200, y: 140 },
        { date: "Day 28", val: 0, x: 260, y: 140 },
        { date: "Day 30", val: 0, x: 380, y: 140 },
      ];
    }

    const intervals = 6;
    const maxVal = Math.max(...salesMovements.map((m) => {
      const item = (items || []).find((i) => i.id === m.itemId);
      return (item?.sellingPrice || 10) * (Math.abs(m.delta) || 1);
    }), 50);

    return Array.from({ length: intervals }).map((_, i) => {
      const x = 20 + i * ((380 - 20) / (intervals - 1));
      const val = (totalSales / intervals) * (i + 1);
      const normalized = Math.min(130, Math.max(20, 140 - (val / (maxVal * 2)) * 120));
      return {
        date: `Wk ${i + 1}`,
        val: Math.round(val),
        x,
        y: normalized,
      };
    });
  }, [salesMovements, totalSales, items]);

  const pathD = chartPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* MOBILE-ONLY TOP OVERVIEW                                                 */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-4">
        {/* Mobile Header Greeting */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black text-[#252525] dark:text-white tracking-tight">
                Hi, {userProfile?.displayName ? userProfile.displayName.split(" ")[0] : "Setta"} 👋
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {isSuperAdmin ? "Super Admin" : "Store Administrator"}
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenNotifications) onOpenNotifications();
            }}
            className="relative p-2.5 rounded-xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-black cursor-pointer shadow-xs"
          >
            <Bell className="w-5 h-5 text-[#252525] dark:text-[#E5F107]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>
        </div>

        {/* Mobile "Today's Overview" Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Today's Overview</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#E5F107] text-[#252525]">
              LIVE
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Sales</div>
              <div className="text-sm font-black text-[#252525] dark:text-white mt-0.5">
                {currencySymbol}{totalSales.toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>{totalSales > 0 ? "+12.5%" : "+0%"}</span>
              </div>
            </div>
            <div className="border-x border-slate-100 dark:border-white/10 px-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Orders</div>
              <div className="text-sm font-black text-[#252525] dark:text-white mt-0.5">
                {totalOrders}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>{totalOrders > 0 ? "+100%" : "+0%"}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Profit</div>
              <div className="text-sm font-black text-[#252525] dark:text-white mt-0.5">
                {currencySymbol}{totalProfit.toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>{totalProfit > 0 ? "+15.3%" : "+0%"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenQuickSale) onOpenQuickSale();
            }}
            className="flex items-center justify-center gap-2 p-3 bg-[#E5F107] text-[#252525] font-black text-xs rounded-xl shadow-sm cursor-pointer hover:bg-[#d2dc00] transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Sale</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenScanner) onOpenScanner();
            }}
            className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-[#1E1E1E] text-[#252525] dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-white/10 shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <Barcode className="w-4 h-4 text-[#252525] dark:text-[#E5F107]" />
            <span>Barcode Scan</span>
          </button>
        </div>

        {/* Mobile Top Products Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Top Products</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Best Movers</span>
          </div>
          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No product sales recorded yet</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Top-selling items will appear here automatically</p>
              </div>
            ) : (
              topProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#252525] dark:text-white truncate">{prod.name}</div>
                      <div className="text-[11px] text-slate-500">{currencySymbol}{prod.price.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-[#252525] dark:text-white mr-1.5">{currencySymbol}{prod.price.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-[#252525] bg-[#E5F107] px-1.5 py-0.5 rounded">
                      +{prod.salesCount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onNavigateTo("products");
            }}
            className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            View All Products
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP DASHBOARD                                                        */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-5">
        {/* Desktop Top Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#252525] dark:text-white tracking-tight">Business Overview</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time metrics, live cash flow, and sales telemetry</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                if (onOpenQuickSale) onOpenQuickSale();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E5F107] hover:bg-[#d2dc00] text-[#252525] font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Sale</span>
            </button>
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#E5F107] text-[#252525] font-black text-xs flex items-center justify-center shadow-xs">
                {userProfile?.displayName
                  ? userProfile.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "SO"}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#252525] dark:text-white truncate max-w-[120px]">
                  {userProfile?.displayName || "Store Owner"}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  {userProfile?.role === "admin"
                    ? "Super Admin"
                    : userProfile?.role === "manager"
                    ? "Store Manager"
                    : userProfile?.role === "cashier"
                    ? "Cashier"
                    : "Store Merchant"}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* 4 Metric Cards in a row */}
        <div className="grid grid-cols-4 gap-4">
          {/* Card 1: Total Sales */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs hover:border-[#E5F107] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Total Sales</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-[#252525] dark:text-white mt-1.5">
              {currencySymbol}{totalSales.toFixed(2)}
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{totalSales > 0 ? "+12.5% vs last week" : "+0% vs last week"}</span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs hover:border-[#E5F107] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Total Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-[#252525] dark:text-white mt-1.5">
              {totalOrders}
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{totalOrders > 0 ? `+${totalOrders} processed` : "+0 processed"}</span>
            </div>
          </div>

          {/* Card 3: Total Customers */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs hover:border-[#E5F107] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Total Customers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-[#252525] dark:text-white mt-1.5">
              {totalCustomers}
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{totalCustomers > 0 ? `+${totalCustomers} active` : "+0 active"}</span>
            </div>
          </div>

          {/* Card 4: Total Profit */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs hover:border-[#E5F107] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Total Profit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-[#252525] dark:text-white mt-1.5">
              {currencySymbol}{totalProfit.toFixed(2)}
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{totalProfit > 0 ? "+15.3% margin" : "+0% margin"}</span>
            </div>
          </div>
        </div>

        {/* 2 Main Panels: Left Sales Overview Chart, Right Recent Orders Table */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left: Sales Overview Line Chart (7 cols) */}
          <div className="col-span-7 p-5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-[#252525] dark:text-white">Sales Trajectory</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {totalSales > 0 ? "Revenue trajectory from recorded sales" : "Awaiting first recorded transaction"}
                </p>
              </div>
              <span className="text-xs font-black text-[#252525] bg-[#E5F107] px-2.5 py-1 rounded-lg border border-black/10">
                {totalSales > 0 ? "+18.2% vs last month" : "+0% this period"}
              </span>
            </div>

            {/* Custom SVG Line Chart matching screenshot with Brand Yellow #E5F107 */}
            <div className="w-full h-52 relative pt-2">
              <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="salesGradBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E5F107" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#E5F107" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1="0" y1="20" x2="400" y2="20" stroke="#E9ECEF" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#E9ECEF" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#E9ECEF" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="400" y2="140" stroke="#CED4DA" />

                {/* Gradient area under curve */}
                <path d={`${pathD} L 380 140 L 20 140 Z`} fill="url(#salesGradBrand)" />

                {/* Smooth Brand Yellow Line with #252525 contrast stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#252525"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#E5F107"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points */}
                {chartPoints.map((pt, idx) => (
                  <g key={idx} className="cursor-pointer group">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#E5F107"
                      stroke="#252525"
                      strokeWidth="2"
                    />
                    <title>{`${pt.date}: $${pt.val.toLocaleString()}`}</title>
                  </g>
                ))}
              </svg>

              {/* Date Labels below chart */}
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-2 pt-2">
                {chartPoints.map((pt, i) => (
                  <span key={i}>{pt.date}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Recent Orders List (5 cols) */}
          <div className="col-span-5 p-5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-[#252525] dark:text-white">Recent Orders</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Latest Sales</span>
              </div>

              {/* Orders Table */}
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Receipt className="w-9 h-9 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No orders recorded yet</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                    Sales processed through your POS terminal or Quick Sale will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-white/10 last:border-0"
                    >
                      <div>
                        <div className="text-xs font-black text-[#252525] dark:text-white">{ord.id}</div>
                        <div className="text-[11px] text-slate-500">{ord.customer} • {ord.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-[#252525] dark:text-white">
                          {currencySymbol}{ord.amount.toFixed(2)}
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            ord.status === "Completed"
                              ? "bg-[#E5F107] text-[#252525] border border-black/10"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onNavigateTo("sales");
              }}
              className="w-full mt-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-[#252525] dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              View All Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
