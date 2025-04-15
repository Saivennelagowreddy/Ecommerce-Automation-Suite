import { User, Product, Client, Order, OrderItem, ClientActivity, Analytics } from "@shared/schema";

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export type RecentOrder = {
  id: number;
  orderNumber: string;
  clientName: string;
  status: OrderStatus;
};

export type LowStockItem = {
  id: number;
  name: string;
  currentStock: number;
  threshold: number;
};

export type ClientActivityItem = {
  id: number;
  client: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  description: string;
  timestamp: Date;
  relatedId?: string;
};

export type NavigationItem = {
  label: string;
  path: string;
  icon: string;
};

export const MAIN_NAVIGATION: NavigationItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
  { label: "Orders", path: "/orders", icon: "shopping_cart" },
  { label: "Inventory", path: "/inventory", icon: "inventory_2" },
  { label: "Clients", path: "/clients", icon: "people" }
];

export const SYSTEM_NAVIGATION: NavigationItem[] = [
  { label: "Settings", path: "/settings", icon: "settings" },
  { label: "Logout", path: "/logout", icon: "logout" }
];
