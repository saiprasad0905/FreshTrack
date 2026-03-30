import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scanReceipt, type ScanReceiptBody, getListItemsQueryKey } from "@workspace/api-client-react";

export function useScanReceiptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ScanReceiptBody) => scanReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
    },
  });
}
