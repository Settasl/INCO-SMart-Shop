import React from "react";
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

  // Recent orders showcase
  const recentOrders = [
    { id: "#ORD-001", date: "Today, 14:32", amount: 240.0, status: "Completed", customer: "Walk-in Customer" },
    { id: "#ORD-002", date: "Today, 12:15", amount: 180.0, status: "Completed", customer: "Samba Keita" },
    { id: "#ORD-003", date: "Today, 09:40", amount: 120.0, status: "Pending", customer: "Amara Fofana" },
    { id: "#ORD-004", date: "Yesterday", amount: 320.0, status: "Completed", customer: "General Store Dept" },
  ];

  // Top products showcase
  const topProducts = [
    {
      id: "prod-1",
      name: "Bluetooth Speaker",
      price: 240.0,
      salesCount: 25,
      image:
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=160&auto=format&fit=crop&q=80",
    },
    {
      id: "prod-2",
      name: "Smart Watch",
      price: 180.0,
      salesCount: 18,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80",
    },
    {
      id: "prod-3",
      name: "Wireless Earbuds",
      price: 120.0,
      salesCount: 30,
      image:
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=160&auto=format&fit=crop&q=80",
    },
  ];

  // Monthly line chart points for Sales Overview
  const chartPoints = [
    { date: "Jan 01", val: 3200, x: 20, y: 130 },
    { date: "Jan 05", val: 5400, x: 80, y: 95 },
    { date: "Jan 10", val: 4100, x: 140, y: 115 },
    { date: "Jan 15", val: 8900, x: 200, y: 55 },
    { date: "Jan 20", val: 6200, x: 260, y: 85 },
    { date: "Jan 25", val: 10400, x: 320, y: 35 },
    { date: "Jan 30", val: 12540, x: 380, y: 15 },
  ];

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
              <div className="text-sm font-black text-[#252525] dark:text-white mt-0.5">$12,540.00</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12.5%</span>
              </div>
            </div>
            <div className="border-x border-slate-100 dark:border-white/10 px-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Orders</div>
              <div className="text-sm font-black text-[#252525] dark:text-white mt-0.5">320</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>+8.4%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Profit</div>
              <div className="text-sm font-black text-[#252525] dark:text-white mt-0.5">$4,215.00</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>+15.3%</span>
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
            {topProducts.map((prod) => (
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
                    <div className="text-[11px] text-slate-500">${prod.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-[#252525] dark:text-white mr-1.5">${prod.price.toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-[#252525] bg-[#E5F107] px-1.5 py-0.5 rounded">
                    +{prod.salesCount}
                  </span>
                </div>
              </div>
            ))}
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
                SH
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#252525] dark:text-white">
                  {userProfile?.displayName || "Setta Holdings"}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">Super Admin</div>
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
            <div className="text-2xl font-black text-[#252525] dark:text-white mt-1.5">$12,540.00</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12.5% vs last week</span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs hover:border-[#E5F107] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Total Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-[#252525] dark:text-white mt-1.5">320</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+8.4% processed</span>
            </div>
          </div>

          {/* Card 3: Total Customers */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs hover:border-[#E5F107] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Total Customers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-[#252525] dark:text-white mt-1.5">1,254</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+5.2% active</span>
            </div>
          </div>

          {/* Card 4: Total Profit */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs hover:border-[#E5F107] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Total Profit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-[#252525] dark:text-white mt-1.5">$4,215.00</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+15.3% margin</span>
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Revenue growth across the last 30 days</p>
              </div>
              <span className="text-xs font-black text-[#252525] bg-[#E5F107] px-2.5 py-1 rounded-lg border border-black/10">
                +18.2% vs last month
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
                      <div className="text-xs font-black text-[#252525] dark:text-white">${ord.amount.toFixed(2)}</div>
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
