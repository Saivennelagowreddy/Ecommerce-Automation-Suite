import { useQuery } from "@tanstack/react-query";
import { Analytics } from "@shared/schema";

export const useAnalytics = () => {
  const { data, isLoading, error } = useQuery<Analytics>({
    queryKey: ['/api/analytics'],
  });

  return {
    analytics: data,
    isLoading,
    error
  };
};
