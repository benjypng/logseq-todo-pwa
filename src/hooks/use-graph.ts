import { useQuery } from "@tanstack/react-query";

import { getCurrGraphName } from "../api";

export const useGraph = () => {
  return useQuery({
    queryKey: ["graph"],
    queryFn: getCurrGraphName,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: 2000,
    staleTime: 0,
  });
};
