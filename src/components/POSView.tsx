import React, { useState, useMemo } from "react";
import {
  Search,
  ScanLine,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { InventoryItem, StoreSettings, StockMovement } from "../types";
import { sounds } from "../lib/sound";

interface CartItem {
  item: InventoryItem;
  quantity: number;
}

interface POSViewProps {
  items: InventoryItem[];
  settings: StoreSettings;
  onCompleteSale: (
    cart: { item: InventoryItem; quantity: number }[],
    totalAmount: number,
    paymentMethod: string
  ) => void;
  onOpenScanner?: () => void;
  onShowToast: (msg: string, type?: "success" | "warning" | "info") => void;
}

export const POSView: React.FC<POSViewProps> = ({
  items,
  settings,
  onCompleteSale,
  onOpenScanner,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Core products showcase from the design board
  const showcaseDefaults: InventoryItem[] = useMemo(
    () => [
      {
        id: "pos-speaker-1",
        name: "Bluetooth Speaker",
        category: "Electronics",
        quantity: 25,
        unit: "pcs",
        reorderPoint: 5,
        costPrice: 140.0,
        sellingPrice: 240.0,
        barcode: "890123400901",
        sku: "SPK-BT-240",
        lastCountedAt: new Date().toISOString(),
        location: "Aisle E1",
        notes: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&auto=format&fit=crop&q=80",
      },
      {
        id: "pos-watch-2",
        name: "Smart Watch",
        category: "Electronics",
        quantity: 18,
        unit: "pcs",
        reorderPoint: 4,
        costPrice: 100.0,
        sellingPrice: 180.0,
        barcode: "890123400902",
        sku: "WTC-SM-180",
        lastCountedAt: new Date().toISOString(),
        location: "Aisle E2",
        notes: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
      },
      {
        id: "pos-earbuds-3",
        name: "Wireless Earbuds",
        category: "Electronics",
        quantity: 30,
        unit: "pcs",
        reorderPoint: 6,
        costPrice: 65.0,
        sellingPrice: 120.0,
        barcode: "890123400903",
        sku: "EBD-WL-120",
        lastCountedAt: new Date().toISOString(),
        location: "Aisle E3",
        notes: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80",
      },
      {
        id: "pos-headphones-4",
        name: "Noise-Cancelling Headphones",
        category: "Electronics",
        quantity: 12,
        unit: "pcs",
        reorderPoint: 3,
        costPrice: 180.0,
        sellingPrice: 320.0,
        barcode: "890123400904",
        sku: "HDP-NC-320",
        lastCountedAt: new Date().toISOString(),
        location: "Aisle E4",
        notes: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80",
      },
      {
        id: "pos-cable-5",
        name: "USB-C Fast Charging Cable",
        category: "Accessories",
        quantity: 45,
        unit: "pcs",
        reorderPoint: 10,
        costPrice: 5.0,
        sellingPrice: 15.0,
        barcode: "890123400905",
        sku: "CBL-USBC-15",
        lastCountedAt: new Date().toISOString(),
        location: "Aisle A1",
        notes: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80",
      },
      {
        id: "pos-powerbank-6",
        name: "20,000mAh Power Bank",
        category: "Accessories",
        quantity: 14,
        unit: "pcs",
        reorderPoint: 4,
        costPrice: 28.0,
        sellingPrice: 65.0,
        barcode: "890123400906",
        sku: "PWR-20K-65",
        lastCountedAt: new Date().toISOString(),
        location: "Aisle A2",
        notes: "https://images.unsplash.com/photo-1609592426868-8097d8c54b65?w=300&auto=format&fit=crop&q=80",
      },
    ],
    []
  );

  // Combine store inventory with showcase defaults if store has few items
  const allProducts = useMemo(() => {
    if (items && items.length >= 4) {
      return items;
    }
    return [...items, ...showcaseDefaults];
  }, [items, showcaseDefaults]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add("All");
    allProducts.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [allProducts]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allProducts.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchQuery, selectedCategory]);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: InventoryItem) => {
    sounds.playStockAdd();
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    sounds.playClick();
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    sounds.playStockRemove();
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  // Pricing math matching image
  const subtotal = useMemo(() => {
    return cart.reduce((sum, c) => sum + c.item.sellingPrice * c.quantity, 0);
  }, [cart]);

  const tax = subtotal * 0.05; // 5% tax matching the design
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) {
      onShowToast("Your cart is empty! Add products to checkout.", "warning");
      return;
    }
    sounds.playCashRegister();
    onCompleteSale(cart, total, "Cash POS");
    onShowToast(`Checkout complete: $${total.toFixed(2)}`, "success");
    setCart([]);
  };

  const getProductImage = (item: InventoryItem) => {
    if (item.notes && item.notes.startsWith("http")) return item.notes;
    // Default placeholder thumbnail
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* LEFT: PRODUCTS BROWSER (8 Cols on Desktop)                                */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8 space-y-4">
        {/* Search Bar + Barcode Scanner Trigger */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by name, SKU or barcode"
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-[#252525] dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#252525] dark:focus:border-[#E5F107] transition-colors shadow-xs"
            />
            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#252525] dark:hover:text-[#E5F107] cursor-pointer p-1"
                title="Open Camera Scanner"
              >
                <ScanLine className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[#E5F107] text-[#252525] font-black shadow-sm"
                    : "bg-white dark:bg-[#1E1E1E] text-slate-700 dark:text-slate-300 hover:text-[#252525] dark:hover:text-white border border-slate-200 dark:border-white/10 shadow-xs"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid (3 columns on desktop, 2 on mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredItems.map((product) => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 hover:border-[#E5F107] shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
            >
              <div className="w-full aspect-square rounded-xl bg-slate-100 dark:bg-black/20 overflow-hidden mb-3 relative flex items-center justify-center">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#252525]/90 backdrop-blur-sm text-[10px] font-bold text-[#252525] dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-xs">
                  {product.quantity} in stock
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#252525] dark:text-white truncate">
                  {product.name}
                </h4>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs sm:text-sm font-black text-[#252525] dark:text-white">
                    ${product.sellingPrice.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="w-6 h-6 rounded-lg bg-[#E5F107] text-[#252525] flex items-center justify-center font-bold hover:bg-[#d2dc00] shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: CART PANEL (4 Cols on Desktop matching Image)                     */}
      {/* ========================================================================= */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between min-h-[500px]">
        {/* Cart Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#252525] dark:text-[#E5F107]" />
              <h3 className="text-base font-black text-[#252525] dark:text-white">Current Cart</h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {cart.reduce((s, c) => s + c.quantity, 0)} items
            </span>
          </div>

          {/* Cart Items List */}
          <div className="divide-y divide-slate-100 dark:divide-white/10 max-h-[380px] overflow-y-auto py-2 scrollbar-none">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Your cart is currently empty</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Tap any product to add to cart</p>
              </div>
            ) : (
              cart.map(({ item, quantity }) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#252525] dark:text-white truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500">
                        ${item.sellingPrice.toFixed(2)}{" "}
                        <span className="text-slate-400">x{quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-200 dark:border-white/10 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-[#252525] dark:text-white px-1.5">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pricing Breakdown & Checkout Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-[#252525] dark:text-white font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span className="text-[#252525] dark:text-white font-bold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-[#252525] dark:text-white pt-2 border-t border-slate-100 dark:border-white/10">
              <span>Total</span>
              <span className="text-base text-[#252525] dark:text-[#E5F107] font-black">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all ${
              cart.length > 0
                ? "bg-[#E5F107] hover:bg-[#d2dc00] text-[#252525] active:scale-[0.98]"
                : "bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>Complete Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
