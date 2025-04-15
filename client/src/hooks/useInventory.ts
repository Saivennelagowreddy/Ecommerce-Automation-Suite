import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { LowStockItem } from "@/types";

export const useInventory = () => {
  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/inventory'],
  });

  return {
    inventory: data,
    isLoading,
    error
  };
};

export const useLowStockItems = (limit?: number) => {
  const { data, isLoading, error } = useQuery<LowStockItem[]>({
    queryKey: ['/api/inventory/low-stock'],
  });

  const slicedData = limit && data ? data.slice(0, limit) : data;

  return {
    lowStockItems: slicedData,
    isLoading,
    error
  };
};

export const useProductById = (id: string | number) => {
  const { data, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/inventory', id],
    enabled: !!id,
  });

  return {
    product: data,
    isLoading,
    error
  };
};
