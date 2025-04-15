import { useQuery } from "@tanstack/react-query";
import { Client } from "@shared/schema";
import { ClientActivityItem } from "@/types";

export const useClients = () => {
  const { data, isLoading, error } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  return {
    clients: data,
    isLoading,
    error
  };
};

export const useClientActivities = (limit?: number) => {
  const { data, isLoading, error } = useQuery<ClientActivityItem[]>({
    queryKey: ['/api/clients/activity'],
  });

  const slicedData = limit && data ? data.slice(0, limit) : data;

  return {
    activities: slicedData,
    isLoading,
    error
  };
};

export const useClientById = (id: string | number) => {
  const { data, isLoading, error } = useQuery<Client>({
    queryKey: ['/api/clients', id],
    enabled: !!id,
  });

  return {
    client: data,
    isLoading,
    error
  };
};
