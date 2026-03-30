import { useMutation } from "@tanstack/react-query";
import { generateRecipes, type GenerateRecipesRequest } from "@workspace/api-client-react";

export function useGenerateRecipesMutation() {
  return useMutation({
    mutationFn: (data: GenerateRecipesRequest) => generateRecipes(data),
  });
}
