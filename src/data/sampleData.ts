import { InventoryItem, Category, CreditRecord } from "../types";

export const CATEGORIES: Category[] = [
  "Medicine & Healthcare",
  "Shoes & Footwear",
  "Clothing & Apparel",
  "Electronics & Accessories",
  "Groceries",
  "Bags & Luggage",
  "Beverages",
  "Snacks & Confectionery",
  "Grains & Staples",
  "Household & Cleaning",
  "Toiletries & Beauty",
  "Dairy & Cold",
  "Canned & Packaged",
  "Kiosk & Airtime",
  "Misc",
];

// Pure production initial states: strictly empty for new registered users
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const SAMPLE_STARTER_INVENTORY: InventoryItem[] = [];

export const INITIAL_CREDIT_RECORDS: CreditRecord[] = [];
export const SAMPLE_STARTER_CREDIT_RECORDS: CreditRecord[] = [];
