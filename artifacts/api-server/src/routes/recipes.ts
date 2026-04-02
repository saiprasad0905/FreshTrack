import { Router, type IRouter, type Request, type Response } from "express";
import { db, itemsTable } from "@workspace/db";
import { eq, and, lte, gte } from "drizzle-orm";

const router: IRouter = Router();

interface RecipeTemplate {
  name: string;
  description: string;
  baseIngredients: string[];
  // Which ingredient keys this recipe "uses" — for scoring
  uses: string[];
  cookTime: string;
  difficulty: string;
}

// Canonical ingredient keys + all aliases that should map to them
const INGREDIENT_ALIASES: Record<string, string[]> = {
  tomato:     ["tomato", "tomatoes", "tamatar"],
  spinach:    ["spinach", "palak"],
  paneer:     ["paneer", "cottage cheese"],
  milk:       ["milk", "doodh"],
  potato:     ["potato", "potatoes", "aloo"],
  onion:      ["onion", "onions", "pyaz"],
  carrot:     ["carrot", "carrots", "gajar"],
  egg:        ["egg", "eggs", "anda"],
  cucumber:   ["cucumber", "cucumbers", "kheera"],
  capsicum:   ["capsicum", "bell pepper", "shimla mirch"],
  lemon:      ["lemon", "lemons", "nimbu", "lime"],
  curd:       ["curd", "yogurt", "dahi"],
  coriander:  ["coriander", "cilantro", "dhania"],
  banana:     ["banana", "bananas", "kela"],
  apple:      ["apple", "apples", "seb"],
  chicken:    ["chicken", "murgh"],
  bread:      ["bread", "double roti", "pav"],
  mushroom:   ["mushroom", "mushrooms"],
  cauliflower:["cauliflower", "gobi"],
  peas:       ["peas", "matar", "green peas"],
  brinjal:    ["brinjal", "eggplant", "baingan", "aubergine"],
  fenugreek:  ["fenugreek", "methi"],
  corn:       ["corn", "sweet corn", "maize"],
  green_chili:["green chili", "green chilli", "hari mirch"],
  butter:     ["butter", "makkhan"],
};

// Full recipe database — each recipe tracks which canonical keys it uses
const RECIPE_TEMPLATES: RecipeTemplate[] = [
  // Tomato
  {
    name: "Tomato Dal Tadka",
    description: "A comforting lentil soup with juicy tomatoes, tempered with cumin and curry leaves. Perfect with steamed rice.",
    baseIngredients: ["tomatoes", "masoor dal", "cumin", "turmeric", "garlic", "oil"],
    uses: ["tomato"],
    cookTime: "25 mins", difficulty: "Easy",
  },
  {
    name: "Tomato Rice (Thakkali Sadam)",
    description: "Tangy South Indian tomato rice cooked with aromatic spices — a quick one-pot meal.",
    baseIngredients: ["tomatoes", "rice", "mustard seeds", "curry leaves", "turmeric"],
    uses: ["tomato"],
    cookTime: "30 mins", difficulty: "Easy",
  },
  {
    name: "Shakshuka (Egg in Tomato Gravy)",
    description: "Eggs poached directly in a spiced tomato sauce. A protein-packed meal ready in 20 minutes.",
    baseIngredients: ["tomatoes", "eggs", "onion", "cumin", "paprika", "coriander"],
    uses: ["tomato", "egg", "onion", "coriander"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // Egg
  {
    name: "Egg Bhurji (Spiced Scrambled Eggs)",
    description: "Mumbai street-style scrambled eggs sautéed with onions, tomatoes, and green chili. The best 10-minute breakfast.",
    baseIngredients: ["eggs", "onion", "tomatoes", "green chili", "cumin", "turmeric", "coriander"],
    uses: ["egg", "onion", "tomato", "green_chili", "coriander"],
    cookTime: "10 mins", difficulty: "Easy",
  },
  {
    name: "Egg Curry",
    description: "Hard-boiled eggs simmered in a rich onion-tomato masala. Pairs perfectly with roti or rice.",
    baseIngredients: ["eggs", "onion", "tomatoes", "ginger-garlic paste", "garam masala", "oil"],
    uses: ["egg", "onion", "tomato"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  {
    name: "Masala Omelette",
    description: "Classic Indian omelette packed with onions, green chilies, and coriander. A 5-minute wonder.",
    baseIngredients: ["eggs", "onion", "green chili", "coriander", "turmeric", "butter"],
    uses: ["egg", "onion", "green_chili", "coriander", "butter"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  // Spinach
  {
    name: "Palak Paneer",
    description: "Creamy spinach curry with soft paneer cubes. A restaurant-style dish made at home.",
    baseIngredients: ["spinach", "paneer", "onion", "tomatoes", "garam masala", "cream"],
    uses: ["spinach", "paneer", "onion", "tomato"],
    cookTime: "35 mins", difficulty: "Medium",
  },
  {
    name: "Aloo Palak",
    description: "Simple potato and spinach stir-fry with cumin and garlic. Goes great with roti.",
    baseIngredients: ["spinach", "potato", "cumin", "garlic", "turmeric"],
    uses: ["spinach", "potato"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  {
    name: "Palak Egg Curry",
    description: "Eggs nestled in a vibrant spinach gravy — nutritious, filling, and ready in 25 minutes.",
    baseIngredients: ["spinach", "eggs", "onion", "ginger", "garlic", "garam masala"],
    uses: ["spinach", "egg", "onion"],
    cookTime: "25 mins", difficulty: "Easy",
  },
  // Paneer
  {
    name: "Paneer Bhurji",
    description: "Scrambled paneer sautéed with onions, tomatoes, and spices. Quick protein-rich breakfast or dinner.",
    baseIngredients: ["paneer", "onion", "tomatoes", "cumin", "turmeric", "coriander"],
    uses: ["paneer", "onion", "tomato", "coriander"],
    cookTime: "15 mins", difficulty: "Easy",
  },
  {
    name: "Kadai Paneer",
    description: "Paneer and capsicum cooked in a bold, spiced tomato-onion masala. Smoky, rich, and satisfying.",
    baseIngredients: ["paneer", "capsicum", "tomatoes", "onion", "kadai masala", "oil"],
    uses: ["paneer", "capsicum", "tomato", "onion"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  // Milk / Curd
  {
    name: "Kheer (Rice Pudding)",
    description: "Classic Indian dessert made with milk, rice, and sugar. Flavored with cardamom and saffron.",
    baseIngredients: ["milk", "rice", "sugar", "cardamom", "almonds"],
    uses: ["milk"],
    cookTime: "45 mins", difficulty: "Easy",
  },
  {
    name: "Raita",
    description: "Cool, refreshing yogurt dip with cucumber or onion. The perfect side for any spicy meal.",
    baseIngredients: ["curd", "cucumber", "cumin", "coriander", "salt"],
    uses: ["curd", "cucumber", "coriander"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  {
    name: "Lassi",
    description: "Chilled sweet or salted yogurt drink. A Punjabi classic that takes 2 minutes to make.",
    baseIngredients: ["curd", "water", "sugar or salt", "cardamom", "ice"],
    uses: ["curd"],
    cookTime: "2 mins", difficulty: "Easy",
  },
  // Potato
  {
    name: "Aloo Jeera",
    description: "Simple cumin-spiced potatoes. A classic Indian side dish ready in minutes.",
    baseIngredients: ["potato", "cumin", "turmeric", "coriander", "oil"],
    uses: ["potato", "coriander"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  {
    name: "Batata Vada",
    description: "Mumbai-style spiced potato fritters in chickpea batter. Perfect tea-time snack.",
    baseIngredients: ["potato", "besan", "turmeric", "green chili", "mustard seeds"],
    uses: ["potato", "green_chili"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  {
    name: "Aloo Paratha",
    description: "Stuffed flatbread with a spiced potato filling. The ultimate Punjabi breakfast.",
    baseIngredients: ["potato", "atta", "green chili", "coriander", "butter"],
    uses: ["potato", "green_chili", "coriander", "butter"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  // Onion
  {
    name: "Onion Pakoda",
    description: "Crispy onion fritters in chickpea batter — the ultimate monsoon snack.",
    baseIngredients: ["onion", "besan", "green chili", "red chili powder", "oil"],
    uses: ["onion", "green_chili"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // Carrot
  {
    name: "Gajar Ka Halwa",
    description: "Traditional carrot pudding slow-cooked in milk with ghee and sugar. A winter dessert classic.",
    baseIngredients: ["carrots", "milk", "ghee", "sugar", "cardamom"],
    uses: ["carrot", "milk"],
    cookTime: "60 mins", difficulty: "Medium",
  },
  {
    name: "Carrot Sambhar",
    description: "South Indian lentil stew with carrots and tamarind. Served with idli or rice.",
    baseIngredients: ["carrots", "toor dal", "tamarind", "sambhar powder", "mustard seeds"],
    uses: ["carrot"],
    cookTime: "35 mins", difficulty: "Medium",
  },
  // Cucumber
  {
    name: "Cucumber Salad (Kheere Ka Salad)",
    description: "Fresh cucumber salad with lemon, chili, and coriander. A cooling accompaniment to any meal.",
    baseIngredients: ["cucumber", "lemon", "green chili", "coriander", "salt"],
    uses: ["cucumber", "lemon", "coriander", "green_chili"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  {
    name: "Cucumber Raita",
    description: "Chilled yogurt with grated cucumber and cumin. Ready in 5 minutes and perfect alongside biryani.",
    baseIngredients: ["cucumber", "curd", "cumin", "coriander", "salt"],
    uses: ["cucumber", "curd", "coriander"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  // Capsicum
  {
    name: "Capsicum Rice",
    description: "Quick South Indian capsicum rice tossed with peanuts, curry leaves, and mustard seeds.",
    baseIngredients: ["capsicum", "rice", "peanuts", "mustard seeds", "curry leaves", "turmeric"],
    uses: ["capsicum"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // Lemon
  {
    name: "Lemon Rice (Chitranna)",
    description: "Tangy South Indian lemon rice with peanuts, curry leaves, and turmeric. Meal-prep friendly.",
    baseIngredients: ["lemon", "rice", "peanuts", "mustard seeds", "curry leaves", "turmeric"],
    uses: ["lemon"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // Banana
  {
    name: "Banana Smoothie",
    description: "Creamy banana smoothie with milk and honey. A quick nutritious breakfast.",
    baseIngredients: ["bananas", "milk", "honey", "cardamom"],
    uses: ["banana", "milk"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  {
    name: "Kela Ki Sabzi",
    description: "Raw banana stir-fry with mustard seeds and coconut. A South Indian speciality.",
    baseIngredients: ["bananas", "mustard seeds", "curry leaves", "coconut", "turmeric"],
    uses: ["banana"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // Apple
  {
    name: "Apple Halwa",
    description: "Quick apple pudding cooked with ghee, sugar, and cardamom. A 15-minute Indian dessert.",
    baseIngredients: ["apples", "ghee", "sugar", "cardamom", "saffron"],
    uses: ["apple"],
    cookTime: "15 mins", difficulty: "Easy",
  },
  // Chicken
  {
    name: "Chicken Curry",
    description: "Classic home-style chicken curry with onion-tomato masala. Best enjoyed with roti or rice.",
    baseIngredients: ["chicken", "onion", "tomatoes", "ginger-garlic paste", "garam masala", "oil"],
    uses: ["chicken", "onion", "tomato"],
    cookTime: "45 mins", difficulty: "Medium",
  },
  {
    name: "Chicken Pulao",
    description: "Fragrant one-pot chicken and rice cooked with whole spices. A complete weeknight dinner.",
    baseIngredients: ["chicken", "rice", "onion", "whole spices", "curd", "ghee"],
    uses: ["chicken", "onion", "curd"],
    cookTime: "50 mins", difficulty: "Medium",
  },
  // Bread
  {
    name: "Bread Upma",
    description: "Stale bread transformed into a savory South Indian upma. The best way to use up leftover bread.",
    baseIngredients: ["bread", "onion", "tomatoes", "mustard seeds", "green chili", "curry leaves"],
    uses: ["bread", "onion", "tomato", "green_chili"],
    cookTime: "15 mins", difficulty: "Easy",
  },
  {
    name: "Masala Toast",
    description: "Buttered toast topped with spiced onion-tomato filling. A quick Indian street-food breakfast.",
    baseIngredients: ["bread", "butter", "onion", "tomatoes", "green chili", "coriander"],
    uses: ["bread", "butter", "onion", "tomato", "green_chili", "coriander"],
    cookTime: "10 mins", difficulty: "Easy",
  },
  // Cauliflower
  {
    name: "Aloo Gobi",
    description: "Dry-style potato and cauliflower curry with cumin and turmeric. A North Indian staple.",
    baseIngredients: ["cauliflower", "potato", "cumin", "turmeric", "coriander"],
    uses: ["cauliflower", "potato", "coriander"],
    cookTime: "25 mins", difficulty: "Easy",
  },
  {
    name: "Gobi Manchurian",
    description: "Crispy cauliflower florets in a sticky Indo-Chinese sauce. A crowd-pleasing party starter.",
    baseIngredients: ["cauliflower", "besan", "soy sauce", "garlic", "green chili", "spring onions"],
    uses: ["cauliflower", "green_chili"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  // Mushroom
  {
    name: "Mushroom Masala",
    description: "Earthy mushrooms simmered in a spiced tomato-onion gravy. Ready in 20 minutes.",
    baseIngredients: ["mushrooms", "onion", "tomatoes", "ginger", "garlic", "garam masala"],
    uses: ["mushroom", "onion", "tomato"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // Methi
  {
    name: "Methi Thepla",
    description: "Gujarati flatbread enriched with fresh fenugreek leaves. Perfect for tiffin or travel.",
    baseIngredients: ["fenugreek leaves", "atta", "curd", "turmeric", "red chili"],
    uses: ["fenugreek", "curd"],
    cookTime: "25 mins", difficulty: "Medium",
  },
  // Coriander
  {
    name: "Green Chutney",
    description: "Vibrant fresh coriander chutney with lemon and green chili. Ready in 2 minutes and goes with everything.",
    baseIngredients: ["coriander", "lemon", "green chili", "garlic", "salt"],
    uses: ["coriander", "lemon", "green_chili"],
    cookTime: "2 mins", difficulty: "Easy",
  },
  // Default fallbacks
  {
    name: "Khichdi",
    description: "The ultimate comfort food — a one-pot meal of rice and lentils. Easy on the stomach and very nourishing.",
    baseIngredients: ["rice", "dal", "turmeric", "ghee", "cumin", "ginger"],
    uses: [],
    cookTime: "30 mins", difficulty: "Easy",
  },
  {
    name: "Mixed Vegetable Sabzi",
    description: "A simple dry curry using whatever vegetables are available, spiced with classic Indian masalas.",
    baseIngredients: ["mixed vegetables", "cumin", "turmeric", "coriander", "garam masala"],
    uses: [],
    cookTime: "25 mins", difficulty: "Easy",
  },
  {
    name: "Vegetable Pulao",
    description: "Fragrant basmati rice cooked with seasonal vegetables and whole spices. A complete meal in itself.",
    baseIngredients: ["rice", "mixed vegetables", "whole spices", "onions", "ghee"],
    uses: [],
    cookTime: "35 mins", difficulty: "Easy",
  },
];

/**
 * Resolve an item name to its canonical ingredient key (or null if unknown).
 * Handles plural forms, common aliases, and partial matches.
 */
function resolveIngredientKey(itemName: string): string | null {
  const lower = itemName.toLowerCase().trim();
  for (const [key, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    for (const alias of aliases) {
      // Exact match or "item name contains alias" or "alias contains item name"
      if (lower === alias || lower.includes(alias) || alias.includes(lower)) {
        return key;
      }
    }
  }
  return null;
}

// POST /recipes/generate - generate recipe suggestions based on expiring items
router.post("/recipes/generate", async (req: Request, res: Response) => {
  try {
    // Always query the DB for active items expiring within 3 days — this is the source of truth.
    // The frontend-supplied expiringItems are used as supplementary context only.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() + 3);

    const dbExpiringItems = await db
      .select({ name: itemsTable.name })
      .from(itemsTable)
      .where(
        and(
          eq(itemsTable.status, "active"),
          lte(itemsTable.expiryDate, cutoff.toISOString().split("T")[0]!)
        )
      );

    // Merge DB items with any extras from the frontend, deduplicated by name
    const frontendItems: string[] = Array.isArray(req.body?.expiringItems)
      ? req.body.expiringItems
      : [];

    const allNamesSet = new Set<string>([
      ...dbExpiringItems.map((i) => i.name),
      ...frontendItems,
    ]);
    const expiringItems = Array.from(allNamesSet);

    if (expiringItems.length === 0) {
      res.json({ recipes: [], expiringItems: [] });
      return;
    }

    // Resolve each expiring item to its canonical key
    const resolvedKeys = new Set<string>();
    const unresolvedItems: string[] = [];

    for (const item of expiringItems) {
      const key = resolveIngredientKey(item);
      if (key) {
        resolvedKeys.add(key);
      } else {
        unresolvedItems.push(item);
      }
    }

    // Score each recipe by how many of the expiring ingredient keys it uses
    const scored = RECIPE_TEMPLATES.map((recipe) => {
      const matchedKeys = recipe.uses.filter((k) => resolvedKeys.has(k));
      return { recipe, score: matchedKeys.length, matchedKeys };
    });

    // Sort: highest score first, then by difficulty (Easy first), then alphabetically
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const diffOrder = { Easy: 0, Medium: 1, Hard: 2 };
      return (diffOrder[a.recipe.difficulty as keyof typeof diffOrder] ?? 1) -
             (diffOrder[b.recipe.difficulty as keyof typeof diffOrder] ?? 1);
    });

    // Select top recipes: prefer those with score > 0, then fill with defaults
    const withMatches = scored.filter((s) => s.score > 0);
    const defaults = scored.filter((s) => s.score === 0);

    const selected = [...withMatches, ...defaults].slice(0, 5);

    // If expiring items have zero matches at all, create a custom "use it up" recipe at the top
    if (unresolvedItems.length > 0 && withMatches.length < unresolvedItems.length) {
      const customRecipe = {
        name: `Use-It-Up: ${unresolvedItems.slice(0, 3).join(" & ")} Stir Fry`,
        description: `A quick improvised stir-fry using your expiring ${unresolvedItems.join(", ")}. Season with turmeric, cumin, and garam masala from your pantry — it will taste great!`,
        ingredients: [
          ...unresolvedItems,
          "cumin seeds",
          "turmeric",
          "garam masala",
          "garlic",
          "oil",
          "salt to taste",
        ],
        cookTime: "15 mins",
        difficulty: "Easy",
      };
      const formatted = selected.slice(0, 4).map((s) => ({
        name: s.recipe.name,
        description: s.recipe.description,
        ingredients: [...s.recipe.baseIngredients, "salt to taste"],
        cookTime: s.recipe.cookTime,
        difficulty: s.recipe.difficulty,
      }));
      res.json({ recipes: [customRecipe, ...formatted], expiringItems });
      return;
    }

    const recipes = selected.map((s) => ({
      name: s.recipe.name,
      description: s.recipe.description,
      ingredients: [...s.recipe.baseIngredients, "salt to taste"],
      cookTime: s.recipe.cookTime,
      difficulty: s.recipe.difficulty,
    }));

    res.json({ recipes, expiringItems });
  } catch (err) {
    req.log.error({ err }, "Failed to generate recipes");
    res.status(500).json({ error: "Failed to generate recipes" });
  }
});

export default router;
