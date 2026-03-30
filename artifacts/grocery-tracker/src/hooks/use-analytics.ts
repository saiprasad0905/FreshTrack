import { useGetWasteAnalytics } from "@workspace/api-client-react";

export function useWasteAnalyticsQuery() {
  return useGetWasteAnalytics();
}
