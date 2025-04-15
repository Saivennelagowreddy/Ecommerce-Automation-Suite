import { useQuery } from "@tanstack/react-query";
import { Order, OrderWithDetails } from "@shared/schema";

export const useOrders = (limit?: number) => {
  const { data, isLoading, error } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const slicedData = limit && data ? data.slice(0, limit) : data;

  return {
    orders: slicedData,
    isLoading,
    error
  };
};

export const useRecentOrders = (limit: number = 5) => {
  const { data, isLoading, error } = useQuery<Order[]>({
    queryKey: ['/api/orders/recent'],
  });

  const slicedData = data ? data.slice(0, limit) : [];

  return {
    recentOrders: slicedData,
    isLoading,
    error
  };
};

export const useOrderById = (id: string | number) => {
  const { data, isLoading, error } = useQuery<OrderWithDetails>({
    queryKey: ['/api/orders', id],
    enabled: !!id,
  });

  return {
    order: data,
    isLoading,
    error
  };
};
