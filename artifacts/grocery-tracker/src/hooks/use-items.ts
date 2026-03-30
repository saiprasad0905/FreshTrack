import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { 
  useListItems, 
  getListItemsQueryKey,
  createItem,
  updateItem,
  deleteItem,
  type ListItemsStatus,
  type CreateItemRequest,
  type UpdateItemRequest
} from "@workspace/api-client-react";

export function useItemsQuery(status?: ListItemsStatus) {
  return useListItems({ status });
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemRequest) => createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
    },
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateItemRequest }) => updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
    },
  });
}

export function useDeleteItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
    },
  });
}
