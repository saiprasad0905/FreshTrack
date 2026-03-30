import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// Indian pantry staples assumed to be always available
const PANTRY_STAPLES = [
  "turmeric", "cumin", "coriander powder", "red chili powder",
  "garam masala", "mustard seeds", "curry leaves", "rice",
  "atta (whole wheat flour)", "dal (lentils)", "oil", "salt",
  "onions", "garlic", "ginger", "green chilies",
];

// Recipe database keyed by common ingredients
const RECIPE_TEMPLATES: Record<string, {
  name: string;
  description: string;
  baseIngredients: string[];
  cookTime: string;
  difficulty: string;
}[]> = {
  tomato: [
    {
      name: "Tomato Dal Tadka",
      description: "A comforting lentil soup with juicy tomatoes, tempered with cumin and curry leaves. Perfect with steamed rice.",
      baseIngredients: ["tomatoes", "masoor dal", "cumin", "turmeric", "garlic", "oil"],
      cookTime: "25 mins",
      difficulty: "Easy",
    },
    {
      name: "Tomato Rice (Thakkali Sadam)",
      description: "Tangy South Indian tomato rice cooked with aromatic spices. A quick one-pot meal.",
      baseIngredients: ["tomatoes", "rice", "mustard seeds", "curry leaves", "turmeric"],
      cookTime: "30 mins",
      difficulty: "Easy",
    },
  ],
  spinach: [
    {
      name: "Palak Paneer",
      description: "Creamy spinach curry with soft paneer cubes. A restaurant-style dish made at home.",
      baseIngredients: ["spinach", "paneer", "onions", "tomatoes", "garam masala", "cream"],
      cookTime: "35 mins",
      difficulty: "Medium",
    },
    {
      name: "Aloo Palak",
      description: "Simple potato and spinach stir-fry with cumin and garlic. Goes great with roti.",
      baseIngredients: ["spinach", "potato", "cumin", "garlic", "turmeric"],
      cookTime: "20 mins",
      difficulty: "Easy",
    },
  ],
  paneer: [
    {
      name: "Paneer Bhurji",
      description: "Scrambled paneer sautéed with onions, tomatoes, and spices. Quick protein-rich breakfast or dinner.",
      baseIngredients: ["paneer", "onions", "tomatoes", "cumin", "turmeric", "coriander"],
      cookTime: "15 mins",
      difficulty: "Easy",
    },
  ],
  milk: [
    {
      name: "Kheer (Rice Pudding)",
      description: "Classic Indian dessert made with milk, rice, and sugar. Flavored with cardamom and saffron.",
      baseIngredients: ["milk", "rice", "sugar", "cardamom", "almonds"],
      cookTime: "45 mins",
      difficulty: "Easy",
    },
  ],
  potato: [
    {
      name: "Aloo Jeera",
      description: "Simple cumin-spiced potatoes. A classic Indian side dish ready in minutes.",
      baseIngredients: ["potato", "cumin", "turmeric", "coriander", "oil"],
      cookTime: "20 mins",
      difficulty: "Easy",
    },
    {
      name: "Batata Vada",
      description: "Mumbai-style spiced potato fritters in chickpea batter. Perfect tea-time snack.",
      baseIngredients: ["potato", "besan", "turmeric", "green chili", "mustard seeds"],
      cookTime: "30 mins",
      difficulty: "Medium",
    },
  ],
  onion: [
    {
      name: "Pyaz Ki Kachori",
      description: "Crispy deep-fried pastry stuffed with spiced onion filling. A Rajasthani street food classic.",
      baseIngredients: ["onions", "atta", "cumin", "fennel seeds", "red chili", "oil"],
      cookTime: "45 mins",
      difficulty: "Hard",
    },
  ],
  carrot: [
    {
      name: "Gajar Ka Halwa",
      description: "Traditional carrot pudding slow-cooked in milk with ghee and sugar. A winter dessert classic.",
      baseIngredients: ["carrots", "milk", "ghee", "sugar", "cardamom", "almonds"],
      cookTime: "60 mins",
      difficulty: "Medium",
    },
    {
      name: "Carrot Sambhar",
      description: "South Indian lentil-based vegetable stew with carrots and tamarind. Served with idli or rice.",
      baseIngredients: ["carrots", "toor dal", "tamarind", "sambhar powder", "mustard seeds"],
      cookTime: "35 mins",
      difficulty: "Medium",
    },
  ],
  default: [
    {
      name: "Mixed Vegetable Sabzi",
      description: "A simple dry curry using whatever vegetables are available, spiced with classic Indian masalas.",
      baseIngredients: ["mixed vegetables", "cumin", "turmeric", "coriander", "garam masala"],
      cookTime: "25 mins",
      difficulty: "Easy",
    },
    {
      name: "Khichdi",
      description: "The ultimate comfort food — a one-pot meal of rice and lentils. Easy on the stomach and very nourishing.",
      baseIngredients: ["rice", "dal", "turmeric", "ghee", "cumin", "ginger"],
      cookTime: "30 mins",
      difficulty: "Easy",
    },
    {
      name: "Vegetable Pulao",
      description: "Fragrant basmati rice cooked with seasonal vegetables and whole spices. A complete meal in itself.",
      baseIngredients: ["rice", "mixed vegetables", "whole spices", "onions", "ghee"],
      cookTime: "35 mins",
      difficulty: "Easy",
    },
  ],
};

// POST /recipes/generate - generate recipe suggestions based on expiring items
router.post("/recipes/generate", async (req: Request, res: Response) => {
  try {
    const { expiringItems } = req.body as { expiringItems: string[] };

    if (!Array.isArray(expiringItems) || expiringItems.length === 0) {
      res.status(400).json({ error: "expiringItems must be a non-empty array of strings" });
      return;
    }

    const suggestions: typeof RECIPE_TEMPLATES.default = [];
    const usedRecipeNames = new Set<string>();

    // Match expiring items to recipe templates
    for (const item of expiringItems) {
      const itemLower = item.toLowerCase();

      for (const [key, recipes] of Object.entries(RECIPE_TEMPLATES)) {
        if (key === "default") continue;
        if (itemLower.includes(key) || key.includes(itemLower.split(" ")[0]!)) {
          for (const recipe of recipes) {
            if (!usedRecipeNames.has(recipe.name)) {
              usedRecipeNames.add(recipe.name);
              suggestions.push(recipe);
            }
          }
        }
      }
    }

    // Always include some default recipes
    for (const recipe of RECIPE_TEMPLATES.default!) {
      if (suggestions.length < 5 && !usedRecipeNames.has(recipe.name)) {
        usedRecipeNames.add(recipe.name);
        suggestions.push(recipe);
      }
    }

    // Format response — merge pantry staples into ingredients list
    const recipes = suggestions.slice(0, 5).map((r) => ({
      name: r.name,
      description: r.description,
      ingredients: [
        ...r.baseIngredients,
        "salt to taste",
        "oil as needed",
      ],
      cookTime: r.cookTime,
      difficulty: r.difficulty,
    }));

    res.json({
      recipes,
      expiringItems,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate recipes");
    res.status(500).json({ error: "Failed to generate recipes" });
  }
});

export default router;
