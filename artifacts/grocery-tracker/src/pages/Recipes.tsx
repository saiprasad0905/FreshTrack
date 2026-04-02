import { useState } from "react";
import { Sparkles, ChefHat, Clock, Flame } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useItemsQuery } from "@/hooks/use-items";
import { useGenerateRecipesMutation } from "@/hooks/use-recipes";
import type { GenerateRecipesResponse } from "@workspace/api-client-react";

export function Recipes() {
  const { data: items = [] } = useItemsQuery('active');
  const generateMutation = useGenerateRecipesMutation();
  const [recipeData, setRecipeData] = useState<GenerateRecipesResponse | null>(null);
  // Track the item names used in the last generation so we can detect new additions
  const [lastGeneratedFor, setLastGeneratedFor] = useState<string | null>(null);

  // Find items expiring within 3 days.
  // Use parseISO + startOfToday to avoid UTC/local timezone mismatch on date strings.
  const { parseISO, startOfToday } = { parseISO: (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y!, m! - 1, d!); }, startOfToday: () => { const t = new Date(); t.setHours(0,0,0,0); return t; } };
  const todayStart = startOfToday();
  const expiringItems = items
    .filter(item => {
      const expiry = parseISO(item.expiryDate);
      const diffMs = expiry.getTime() - todayStart.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .map(item => item.name);

  // Detect if new expiring items have been added since last generation
  const currentKey = expiringItems.slice().sort().join(',');
  const hasNewItems = recipeData !== null && lastGeneratedFor !== null && currentKey !== lastGeneratedFor;

  const handleGenerate = () => {
    // Send empty array — the backend always queries the DB directly for freshness
    generateMutation.mutate(
      { expiringItems: [] },
      {
        onSuccess: (data) => {
          setRecipeData(data);
          setLastGeneratedFor(currentKey);
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-primary/20 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ChefHat className="w-64 h-64 -rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/10 font-medium mb-6">
              <Sparkles className="w-4 h-4" /> AI Magic Kitchen
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
              Cook your ingredients <br/> before they go bad.
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-xl mb-8">
              We found {expiringItems.length} items in your fridge that need to be used soon. Let our AI chef create perfect recipes for you.
            </p>
            
            {hasNewItems && (
              <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/90 text-yellow-900 font-semibold text-sm shadow">
                ✦ New items added — regenerate to update recipes
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="bg-white text-primary px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center gap-3"
            >
              {generateMutation.isPending ? (
                <>Thinking...</>
              ) : recipeData ? (
                <>Regenerate Recipes <ChefHat className="w-5 h-5" /></>
              ) : (
                <>Generate Recipes <ChefHat className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>

        {expiringItems.length > 0 && !recipeData && !generateMutation.isPending && (
          <div className="mb-12">
            <h3 className="font-display font-semibold text-lg mb-4 text-foreground">Ingredients we'll use:</h3>
            <div className="flex flex-wrap gap-2">
              {expiringItems.map(item => (
                <div key={item} className="px-4 py-2 bg-card border border-border rounded-xl font-medium shadow-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {generateMutation.isPending && (
          <div className="py-20 flex flex-col items-center justify-center text-primary">
            <ChefHat className="w-16 h-16 animate-bounce mb-4" />
            <p className="font-display text-xl font-bold">Chef AI is writing recipes...</p>
          </div>
        )}

        {recipeData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-display font-bold text-foreground">Suggested Recipes</h2>
            <div className="grid gap-6">
              {recipeData.recipes.map((recipe, idx) => (
                <div key={idx} className="bg-card border border-border rounded-3xl p-6 shadow-lg shadow-black/5 hover:shadow-xl transition-all">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-display font-bold text-primary mb-2">{recipe.name}</h3>
                      <p className="text-muted-foreground">{recipe.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm font-semibold">
                        <Clock className="w-4 h-4 text-muted-foreground" /> {recipe.cookTime}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold">
                        <Flame className="w-4 h-4" /> {recipe.difficulty}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-foreground">You'll need:</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {recipe.ingredients.map((ing, i) => {
                        const isExpiring = recipeData.expiringItems.some(exp => ing.toLowerCase().includes(exp.toLowerCase()));
                        return (
                          <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                            <div className={`w-2 h-2 rounded-full ${isExpiring ? 'bg-destructive' : 'bg-primary'}`} />
                            {ing}
                            {isExpiring && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-md font-bold ml-1">Use it up!</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
