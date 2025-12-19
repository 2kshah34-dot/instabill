
import { Product } from "../types";

// Default Indian Products for Initialization
export const DEFAULT_INVENTORY_LIST: Omit<Product, 'id' | 'quantity'>[] = [
  { name: "Balaji wafers", price: 10, category: "snacks", barcode: "8906010501259" },
  { name: "Himalya Neem Face Wash", price: 85, category: "personal care", barcode: "8901138512187" },
  { name: "Kangaro", price: 12, category: "stationary", barcode: "8901057510028" },
  { name: "Spinz BB Face Powder", price: 10, category: "Personal Care", barcode: "8902979026925" },
  { name: "compass", price: 150, category: "General", barcode: "6980682959046" },
  { name: "Pen", price: 200, category: "stationary", barcode: "8904155905062" },
  { name: "Honey & Almonds", price: 10, category: "Personal Care", barcode: "8904035416763" },
  { name: "ZEDEX Dry cough relief", price: 191, category: "Personal care", barcode: "8901148251120" },
  { name: "IODEX body pain expert", price: 42, category: "Personal care", barcode: "89006245" },
  //{ name: "Balaji wafers", price: 10, category: "snacks", barcode: "8906010501259" }, 
   
];

// Deprecated: Local lookup is now handled in App.tsx via state.
// This function now serves as a fallback or placeholder for external API calls if needed in future.
export const identifyProductFromBarcode = async (barcode: string): Promise<Omit<Product, 'id' | 'quantity'>> => {
  console.log("External Lookup triggered for:", barcode);
  throw new Error("ITEM_NOT_FOUND");
};

export const identifyProductFromImage = async (base64Image: string): Promise<Omit<Product, 'id' | 'quantity'>> => {
  // Vision features require API. Since we are removing the key, we disable this.
  throw new Error("VISION_FEATURE_DISABLED");
};
