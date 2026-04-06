import { Router, type IRouter, type Request, type Response } from "express";
import { db, itemsTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";

const router: IRouter = Router();

interface RecipeTemplate {
  name: string;
  description: string;
  baseIngredients: string[];
  steps: string[];
  uses: string[];
  cookTime: string;
  difficulty: string;
}

const INGREDIENT_ALIASES: Record<string, string[]> = {
  tomato:      ["tomato", "tomatoes", "tamatar"],
  spinach:     ["spinach", "palak"],
  paneer:      ["paneer", "cottage cheese"],
  milk:        ["milk", "doodh"],
  potato:      ["potato", "potatoes", "aloo"],
  onion:       ["onion", "onions", "pyaz"],
  carrot:      ["carrot", "carrots", "gajar"],
  egg:         ["egg", "eggs", "anda"],
  cucumber:    ["cucumber", "cucumbers", "kheera"],
  capsicum:    ["capsicum", "bell pepper", "shimla mirch"],
  lemon:       ["lemon", "lemons", "nimbu", "lime"],
  curd:        ["curd", "yogurt", "dahi"],
  coriander:   ["coriander", "cilantro", "dhania"],
  banana:      ["banana", "bananas", "kela"],
  apple:       ["apple", "apples", "seb"],
  chicken:     ["chicken", "murgh"],
  bread:       ["bread", "double roti", "pav"],
  mushroom:    ["mushroom", "mushrooms"],
  cauliflower: ["cauliflower", "gobi"],
  peas:        ["peas", "matar", "green peas"],
  brinjal:     ["brinjal", "eggplant", "baingan", "aubergine"],
  fenugreek:   ["fenugreek", "methi"],
  corn:        ["corn", "sweet corn", "maize"],
  green_chili: ["green chili", "green chilli", "hari mirch"],
  butter:      ["butter", "makkhan"],
};

const RECIPE_TEMPLATES: RecipeTemplate[] = [
  // ── Tomato ──────────────────────────────────────────────────────────────────
  {
    name: "Tomato Dal Tadka",
    description: "A comforting lentil soup with juicy tomatoes, tempered with cumin and curry leaves. Perfect with steamed rice.",
    baseIngredients: ["tomatoes", "masoor dal", "cumin", "turmeric", "garlic", "oil"],
    steps: [
      "Pressure-cook masoor dal with turmeric and water for 3 whistles until soft.",
      "Heat oil in a pan. Add cumin seeds and let them splutter.",
      "Add chopped garlic and sauté 30 seconds, then add chopped tomatoes.",
      "Cook tomatoes until mushy and oil separates — about 5 minutes.",
      "Season with salt, add cooked dal, and simmer together for 5 minutes.",
      "For the tadka: heat ghee, add a pinch of red chili and curry leaves, pour over the dal. Serve hot.",
    ],
    uses: ["tomato"],
    cookTime: "25 mins", difficulty: "Easy",
  },
  {
    name: "Tomato Rice (Thakkali Sadam)",
    description: "Tangy South Indian tomato rice cooked with aromatic spices — a quick one-pot meal.",
    baseIngredients: ["tomatoes", "rice", "mustard seeds", "curry leaves", "turmeric"],
    steps: [
      "Cook basmati rice and spread on a plate to cool.",
      "Heat oil in a pan. Add mustard seeds and let them pop.",
      "Add curry leaves, dried red chili, and sliced onions — sauté until golden.",
      "Add chopped tomatoes, turmeric, and salt. Cook until tomatoes are completely soft.",
      "Add the cooked rice and mix gently until every grain is coated.",
      "Garnish with fresh coriander. Serve with papad or raita.",
    ],
    uses: ["tomato"],
    cookTime: "30 mins", difficulty: "Easy",
  },
  {
    name: "Shakshuka (Egg in Tomato Gravy)",
    description: "Eggs poached directly in a spiced tomato sauce. A protein-packed meal ready in 20 minutes.",
    baseIngredients: ["tomatoes", "eggs", "onion", "cumin", "paprika", "coriander"],
    steps: [
      "Heat oil in a wide pan. Sauté chopped onion until soft and translucent.",
      "Add chopped tomatoes, cumin, paprika, and salt. Cook 8–10 minutes until a thick sauce forms.",
      "Make 4 shallow wells in the sauce using a spoon.",
      "Crack one egg into each well. Cover the pan with a lid.",
      "Cook on low heat for 5–7 minutes until egg whites are set but yolks are still runny.",
      "Garnish with fresh coriander and serve straight from the pan with bread or roti.",
    ],
    uses: ["tomato", "egg", "onion", "coriander"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // ── Egg ─────────────────────────────────────────────────────────────────────
  {
    name: "Egg Bhurji (Spiced Scrambled Eggs)",
    description: "Mumbai street-style scrambled eggs sautéed with onions, tomatoes, and green chili. The best 10-minute breakfast.",
    baseIngredients: ["eggs", "onion", "tomatoes", "green chili", "cumin", "turmeric", "coriander"],
    steps: [
      "Beat eggs with a pinch of salt and turmeric in a bowl.",
      "Heat oil in a pan. Add cumin seeds and let them splutter.",
      "Add finely chopped onion and green chili — sauté until soft.",
      "Add chopped tomatoes and cook 3–4 minutes until mushy.",
      "Pour beaten eggs over the mixture and keep stirring on medium heat.",
      "Scramble until eggs are just cooked. Garnish with fresh coriander and serve with bread or paratha.",
    ],
    uses: ["egg", "onion", "tomato", "green_chili", "coriander"],
    cookTime: "10 mins", difficulty: "Easy",
  },
  {
    name: "Egg Curry",
    description: "Hard-boiled eggs simmered in a rich onion-tomato masala. Pairs perfectly with roti or rice.",
    baseIngredients: ["eggs", "onion", "tomatoes", "ginger-garlic paste", "garam masala", "oil"],
    steps: [
      "Hard-boil eggs for 10 minutes, peel them, and make 4 shallow slits on each.",
      "Fry onions in oil until deep golden. Add ginger-garlic paste and cook 2 minutes.",
      "Add pureed tomatoes, garam masala, turmeric, and chili powder. Cook until oil separates.",
      "Add 1 cup water and bring to a boil to form a gravy.",
      "Gently place eggs in the gravy and simmer for 5 minutes so they absorb the flavour.",
      "Garnish with coriander. Serve with rice or roti.",
    ],
    uses: ["egg", "onion", "tomato"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  {
    name: "Masala Omelette",
    description: "Classic Indian omelette packed with onions, green chilies, and coriander. A 5-minute wonder.",
    baseIngredients: ["eggs", "onion", "green chili", "coriander", "turmeric", "butter"],
    steps: [
      "Beat 2–3 eggs in a bowl with a pinch of salt and turmeric.",
      "Add finely chopped onion, green chili, and fresh coriander to the eggs. Mix well.",
      "Melt butter in a non-stick pan over medium heat.",
      "Pour in the egg mixture and spread evenly.",
      "Cook until the bottom is set — about 2 minutes — then fold in half.",
      "Slide onto a plate and serve immediately with toast or chutney.",
    ],
    uses: ["egg", "onion", "green_chili", "coriander", "butter"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  // ── Spinach ─────────────────────────────────────────────────────────────────
  {
    name: "Palak Paneer",
    description: "Creamy spinach curry with soft paneer cubes. A restaurant-style dish made at home.",
    baseIngredients: ["spinach", "paneer", "onion", "tomatoes", "garam masala", "cream"],
    steps: [
      "Blanch spinach in boiling water for 2 minutes, then transfer to ice water. Drain and blend to a smooth puree.",
      "Fry onions in oil until golden. Add ginger-garlic paste and cook 2 minutes.",
      "Add chopped tomatoes and spices. Cook until oil separates — about 8 minutes.",
      "Pour in the spinach puree and simmer for 5 minutes.",
      "Add paneer cubes and a splash of cream. Stir gently and simmer 3 more minutes.",
      "Finish with a pinch of garam masala and serve hot with roti or naan.",
    ],
    uses: ["spinach", "paneer", "onion", "tomato"],
    cookTime: "35 mins", difficulty: "Medium",
  },
  {
    name: "Aloo Palak",
    description: "Simple potato and spinach stir-fry with cumin and garlic. Goes great with roti.",
    baseIngredients: ["spinach", "potato", "cumin", "garlic", "turmeric"],
    steps: [
      "Cube potatoes and parboil or microwave for 4 minutes until just cooked.",
      "Heat oil in a pan. Add cumin seeds and let them splutter.",
      "Add minced garlic and sauté until golden.",
      "Add potatoes and fry for 3–4 minutes until lightly browned.",
      "Add washed spinach leaves, turmeric, and salt. Stir and cook until spinach wilts.",
      "Mix everything together and serve with hot roti.",
    ],
    uses: ["spinach", "potato"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  {
    name: "Palak Egg Curry",
    description: "Eggs nestled in a vibrant spinach gravy — nutritious, filling, and ready in 25 minutes.",
    baseIngredients: ["spinach", "eggs", "onion", "ginger", "garlic", "garam masala"],
    steps: [
      "Hard-boil eggs, peel, and keep aside.",
      "Wilt spinach in a dry pan, then blend to a smooth puree.",
      "Fry onions until golden. Add grated ginger, garlic, and sauté 2 minutes.",
      "Add spices (cumin, coriander, garam masala), stir for 1 minute.",
      "Pour in spinach puree and simmer for 5 minutes. Add water if too thick.",
      "Add boiled eggs, stir gently, cook 3 more minutes. Serve with rice.",
    ],
    uses: ["spinach", "egg", "onion"],
    cookTime: "25 mins", difficulty: "Easy",
  },
  // ── Paneer ──────────────────────────────────────────────────────────────────
  {
    name: "Paneer Bhurji",
    description: "Scrambled paneer sautéed with onions, tomatoes, and spices. Quick protein-rich breakfast or dinner.",
    baseIngredients: ["paneer", "onion", "tomatoes", "cumin", "turmeric", "coriander"],
    steps: [
      "Crumble paneer into small pieces with your hands.",
      "Heat oil in a pan. Add cumin seeds and let them splutter.",
      "Add chopped onions and sauté until translucent.",
      "Add tomatoes, turmeric, and chili powder. Cook until oil separates.",
      "Add crumbled paneer and mix well. Cook for 3–4 minutes.",
      "Garnish with fresh coriander and serve with paratha or bread.",
    ],
    uses: ["paneer", "onion", "tomato", "coriander"],
    cookTime: "15 mins", difficulty: "Easy",
  },
  {
    name: "Kadai Paneer",
    description: "Paneer and capsicum cooked in a bold, spiced tomato-onion masala. Smoky, rich, and satisfying.",
    baseIngredients: ["paneer", "capsicum", "tomatoes", "onion", "kadai masala", "oil"],
    steps: [
      "Dry-roast coriander seeds and red chilies, then coarsely grind them for fresh kadai masala.",
      "Heat oil. Add cubed onions and capsicum — sauté on high heat for 3 minutes until slightly charred.",
      "Add ginger-garlic paste and sauté 1 minute.",
      "Add pureed tomatoes and the ground kadai masala. Cook until oil separates.",
      "Add paneer cubes and gently toss to coat.",
      "Finish with kasuri methi and serve hot with naan or laccha paratha.",
    ],
    uses: ["paneer", "capsicum", "tomato", "onion"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  // ── Milk / Curd ─────────────────────────────────────────────────────────────
  {
    name: "Kheer (Rice Pudding)",
    description: "Classic Indian dessert made with milk, rice, and sugar. Flavored with cardamom and saffron.",
    baseIngredients: ["milk", "rice", "sugar", "cardamom", "almonds"],
    steps: [
      "Rinse and soak rice for 15 minutes, then drain.",
      "Bring full-fat milk to a boil in a heavy-bottomed pan.",
      "Add the soaked rice and cook on low heat, stirring frequently for 30 minutes.",
      "Add sugar and crushed cardamom. Stir well and cook another 10 minutes.",
      "Add saffron-infused warm milk for colour and flavour.",
      "Garnish with sliced almonds. Serve warm or refrigerate and serve chilled.",
    ],
    uses: ["milk"],
    cookTime: "45 mins", difficulty: "Easy",
  },
  {
    name: "Raita",
    description: "Cool, refreshing yogurt dip with cucumber or onion. The perfect side for any spicy meal.",
    baseIngredients: ["curd", "cucumber", "cumin", "coriander", "salt"],
    steps: [
      "Whisk curd in a bowl until smooth and creamy.",
      "Grate or finely chop cucumber. Squeeze out excess water.",
      "Mix cucumber into the curd.",
      "Add roasted cumin powder, salt, and a pinch of red chili powder.",
      "Stir in fresh chopped coriander.",
      "Chill for 15 minutes before serving alongside biryani or paratha.",
    ],
    uses: ["curd", "cucumber", "coriander"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  {
    name: "Lassi",
    description: "Chilled sweet or salted yogurt drink. A Punjabi classic that takes 2 minutes to make.",
    baseIngredients: ["curd", "water", "sugar or salt", "cardamom", "ice"],
    steps: [
      "Add curd to a blender.",
      "For sweet lassi: add sugar and a pinch of crushed cardamom. For salted: add salt and a pinch of cumin.",
      "Add a splash of chilled water.",
      "Blend on high for 1–2 minutes until frothy.",
      "Pour over ice cubes in tall glasses.",
      "Optionally top with a scoop of cream or a few rose petals before serving.",
    ],
    uses: ["curd"],
    cookTime: "2 mins", difficulty: "Easy",
  },
  // ── Potato ──────────────────────────────────────────────────────────────────
  {
    name: "Aloo Jeera",
    description: "Simple cumin-spiced potatoes. A classic Indian side dish ready in minutes.",
    baseIngredients: ["potato", "cumin", "turmeric", "coriander", "oil"],
    steps: [
      "Boil potatoes until tender, peel and cube them.",
      "Heat oil in a pan on medium-high. Add cumin seeds and let them splutter.",
      "Add the potato cubes and fry for 4–5 minutes, tossing occasionally, until lightly golden.",
      "Add turmeric, red chili powder, and salt. Toss to coat.",
      "Cook for 2 more minutes so the spices are aromatic.",
      "Garnish with fresh coriander and serve with dal-rice or as a side with roti.",
    ],
    uses: ["potato", "coriander"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  {
    name: "Batata Vada",
    description: "Mumbai-style spiced potato fritters in chickpea batter. Perfect tea-time snack.",
    baseIngredients: ["potato", "besan", "turmeric", "green chili", "mustard seeds"],
    steps: [
      "Boil potatoes, mash them with green chili, coriander, mustard seeds, turmeric, and salt.",
      "Shape the mash into golf-ball-sized rounds.",
      "Make a thick batter with besan, turmeric, chili powder, and water.",
      "Heat oil in a deep pan to medium-hot.",
      "Dip each potato ball in batter and fry until crispy and golden — about 3 minutes.",
      "Drain on paper towel and serve hot with green chutney.",
    ],
    uses: ["potato", "green_chili"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  {
    name: "Aloo Paratha",
    description: "Stuffed flatbread with a spiced potato filling. The ultimate Punjabi breakfast.",
    baseIngredients: ["potato", "atta", "green chili", "coriander", "butter"],
    steps: [
      "Boil and mash potatoes. Mix in chopped green chili, coriander, cumin seeds, and salt.",
      "Knead atta with water and a pinch of salt into a smooth dough. Rest 15 minutes.",
      "Divide dough into balls. Roll each into a small disc.",
      "Place a portion of filling in the centre, gather edges, and seal. Flatten gently.",
      "Roll out the stuffed ball carefully into a round paratha.",
      "Cook on a hot tawa with butter on both sides until golden spots appear. Serve with curd and pickle.",
    ],
    uses: ["potato", "green_chili", "coriander", "butter"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  // ── Onion ───────────────────────────────────────────────────────────────────
  {
    name: "Onion Pakoda",
    description: "Crispy onion fritters in chickpea batter — the ultimate monsoon snack.",
    baseIngredients: ["onion", "besan", "green chili", "red chili powder", "oil"],
    steps: [
      "Slice onions thinly into half-rings. Separate the layers.",
      "Add besan, green chili, red chili powder, turmeric, and salt. Mix without water first — the onions will release moisture.",
      "Add just enough water to make a thick batter that coats the onions.",
      "Heat oil in a deep pan until a drop of batter rises to the surface.",
      "Drop small portions of the onion mixture into hot oil and fry on medium heat.",
      "Fry for 4–5 minutes until deep golden and crispy. Serve hot with green chutney and chai.",
    ],
    uses: ["onion", "green_chili"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // ── Carrot ──────────────────────────────────────────────────────────────────
  {
    name: "Gajar Ka Halwa",
    description: "Traditional carrot pudding slow-cooked in milk with ghee and sugar. A winter dessert classic.",
    baseIngredients: ["carrots", "milk", "ghee", "sugar", "cardamom"],
    steps: [
      "Peel and grate carrots on a coarse grater.",
      "Heat ghee in a heavy pan. Add grated carrots and cook on medium heat for 5 minutes.",
      "Pour in full-fat milk and bring to a boil. Reduce heat and simmer, stirring often.",
      "Cook for 30 minutes until all the milk is absorbed and the mixture is dry.",
      "Add sugar and crushed cardamom. Stir and cook another 10 minutes until glossy.",
      "Garnish with roasted cashews and almonds. Serve warm.",
    ],
    uses: ["carrot", "milk"],
    cookTime: "60 mins", difficulty: "Medium",
  },
  {
    name: "Carrot Sambhar",
    description: "South Indian lentil stew with carrots and tamarind. Served with idli or rice.",
    baseIngredients: ["carrots", "toor dal", "tamarind", "sambhar powder", "mustard seeds"],
    steps: [
      "Pressure-cook toor dal until soft. Mash lightly.",
      "Soak tamarind in warm water, extract the pulp.",
      "Chop carrots into rounds and boil in tamarind water with sambhar powder and turmeric for 10 minutes.",
      "Add the cooked dal to the carrot mixture and simmer together for 5 minutes.",
      "Prepare tadka: heat oil, add mustard seeds, curry leaves, and dried red chili.",
      "Pour tadka over the sambhar. Serve hot with idli, dosa, or rice.",
    ],
    uses: ["carrot"],
    cookTime: "35 mins", difficulty: "Medium",
  },
  // ── Cucumber ────────────────────────────────────────────────────────────────
  {
    name: "Cucumber Salad (Kheere Ka Salad)",
    description: "Fresh cucumber salad with lemon, chili, and coriander. A cooling accompaniment to any meal.",
    baseIngredients: ["cucumber", "lemon", "green chili", "coriander", "salt"],
    steps: [
      "Wash and slice cucumbers into thin rounds or half-moons.",
      "Finely chop green chili and coriander.",
      "Combine all in a bowl.",
      "Squeeze fresh lemon juice generously over the top.",
      "Sprinkle salt and a pinch of chaat masala.",
      "Toss well and serve immediately — best eaten fresh.",
    ],
    uses: ["cucumber", "lemon", "coriander", "green_chili"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  {
    name: "Cucumber Raita",
    description: "Chilled yogurt with grated cucumber and cumin. Ready in 5 minutes and perfect alongside biryani.",
    baseIngredients: ["cucumber", "curd", "cumin", "coriander", "salt"],
    steps: [
      "Grate cucumber and squeeze out as much water as possible.",
      "Whisk curd in a bowl until lump-free and smooth.",
      "Mix in the grated cucumber.",
      "Add roasted cumin powder, salt, and a pinch of red chili.",
      "Stir in chopped fresh coriander.",
      "Refrigerate for 10 minutes and serve chilled.",
    ],
    uses: ["cucumber", "curd", "coriander"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  // ── Capsicum ────────────────────────────────────────────────────────────────
  {
    name: "Capsicum Rice",
    description: "Quick South Indian capsicum rice tossed with peanuts, curry leaves, and mustard seeds.",
    baseIngredients: ["capsicum", "rice", "peanuts", "mustard seeds", "curry leaves", "turmeric"],
    steps: [
      "Cook basmati rice and spread to cool (day-old rice works best).",
      "Heat oil in a wide pan. Add mustard seeds and let them pop.",
      "Add curry leaves, peanuts, and dried red chili. Fry 1 minute.",
      "Add diced capsicum and sauté on high heat for 3–4 minutes — keep it slightly crunchy.",
      "Add turmeric, salt, and the cooked rice. Toss gently until combined.",
      "Serve hot with papad and pickle.",
    ],
    uses: ["capsicum"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // ── Lemon ───────────────────────────────────────────────────────────────────
  {
    name: "Lemon Rice (Chitranna)",
    description: "Tangy South Indian lemon rice with peanuts, curry leaves, and turmeric. Meal-prep friendly.",
    baseIngredients: ["lemon", "rice", "peanuts", "mustard seeds", "curry leaves", "turmeric"],
    steps: [
      "Cook basmati rice and let it cool completely.",
      "Heat oil in a pan. Add mustard seeds — they'll begin to pop.",
      "Add peanuts, curry leaves, and dried red chili. Fry 1 minute until peanuts are golden.",
      "Add turmeric and salt, then the cooked rice.",
      "Toss gently to combine and turn off the heat.",
      "Squeeze the juice of 1–2 lemons generously. Mix again and taste for salt. Serve with papad.",
    ],
    uses: ["lemon"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // ── Banana ──────────────────────────────────────────────────────────────────
  {
    name: "Banana Smoothie",
    description: "Creamy banana smoothie with milk and honey. A quick nutritious breakfast.",
    baseIngredients: ["bananas", "milk", "honey", "cardamom"],
    steps: [
      "Peel and slice ripe bananas.",
      "Add banana pieces to a blender.",
      "Pour in chilled milk, a drizzle of honey, and a pinch of crushed cardamom.",
      "Blend on high speed until completely smooth and frothy.",
      "Taste and add more honey if needed.",
      "Pour into glasses and serve immediately.",
    ],
    uses: ["banana", "milk"],
    cookTime: "5 mins", difficulty: "Easy",
  },
  {
    name: "Kela Ki Sabzi",
    description: "Raw banana stir-fry with mustard seeds and coconut. A South Indian speciality.",
    baseIngredients: ["bananas", "mustard seeds", "curry leaves", "coconut", "turmeric"],
    steps: [
      "Peel raw bananas and cut into rounds. Boil in salted water for 5–7 minutes until just tender.",
      "Heat oil in a pan. Add mustard seeds and let them splutter.",
      "Add curry leaves and dried red chili.",
      "Add the boiled banana pieces, turmeric, and salt. Stir to coat.",
      "Cook on medium heat for 5 minutes, tossing occasionally.",
      "Finish with freshly grated coconut. Serve with rice and dal.",
    ],
    uses: ["banana"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // ── Apple ───────────────────────────────────────────────────────────────────
  {
    name: "Apple Halwa",
    description: "Quick apple pudding cooked with ghee, sugar, and cardamom. A 15-minute Indian dessert.",
    baseIngredients: ["apples", "ghee", "sugar", "cardamom", "saffron"],
    steps: [
      "Peel, core, and grate or finely chop the apples.",
      "Heat ghee in a heavy-bottomed pan.",
      "Add the grated apple and cook on medium heat, stirring often for 7–8 minutes.",
      "Add sugar and crushed cardamom. Mix well.",
      "Add a few saffron strands soaked in warm milk for colour.",
      "Cook another 5 minutes until the halwa is thick and glossy. Serve warm topped with nuts.",
    ],
    uses: ["apple"],
    cookTime: "15 mins", difficulty: "Easy",
  },
  // ── Chicken ─────────────────────────────────────────────────────────────────
  {
    name: "Chicken Curry",
    description: "Classic home-style chicken curry with onion-tomato masala. Best enjoyed with roti or rice.",
    baseIngredients: ["chicken", "onion", "tomatoes", "ginger-garlic paste", "garam masala", "oil"],
    steps: [
      "Marinate chicken pieces with curd, turmeric, and chili powder for 20 minutes.",
      "Fry sliced onions in oil until deep golden. Add ginger-garlic paste and cook 2 minutes.",
      "Add pureed tomatoes, garam masala, coriander powder, and chili. Cook until oil separates.",
      "Add marinated chicken and sear for 5 minutes on high heat.",
      "Reduce heat, add 1 cup water, cover and cook 20 minutes until chicken is tender.",
      "Simmer uncovered for 5 more minutes to thicken the gravy. Serve with rice or roti.",
    ],
    uses: ["chicken", "onion", "tomato"],
    cookTime: "45 mins", difficulty: "Medium",
  },
  {
    name: "Chicken Pulao",
    description: "Fragrant one-pot chicken and rice cooked with whole spices. A complete weeknight dinner.",
    baseIngredients: ["chicken", "rice", "onion", "whole spices", "curd", "ghee"],
    steps: [
      "Wash and soak basmati rice for 20 minutes, then drain.",
      "Heat ghee in a pressure cooker. Add whole spices (bay leaf, cinnamon, cardamom, cloves).",
      "Add sliced onions and fry until golden. Add ginger-garlic paste and cook 1 minute.",
      "Add chicken pieces and sear for 5 minutes.",
      "Add whisked curd, salt, and rice. Stir gently.",
      "Add 1.5x water, close cooker, and cook for 2 whistles. Let pressure release naturally. Fluff and serve.",
    ],
    uses: ["chicken", "onion", "curd"],
    cookTime: "50 mins", difficulty: "Medium",
  },
  // ── Bread ───────────────────────────────────────────────────────────────────
  {
    name: "Bread Upma",
    description: "Stale bread transformed into a savory South Indian upma. The best way to use up leftover bread.",
    baseIngredients: ["bread", "onion", "tomatoes", "mustard seeds", "green chili", "curry leaves"],
    steps: [
      "Tear or cut bread slices into small pieces.",
      "Heat oil in a pan. Add mustard seeds and let them pop.",
      "Add curry leaves, green chili, and chopped onion — sauté until golden.",
      "Add chopped tomatoes, turmeric, and salt. Cook until soft.",
      "Add bread pieces and toss gently to mix everything together.",
      "Cook 3–4 minutes until the bread is warmed through. Serve hot with coconut chutney.",
    ],
    uses: ["bread", "onion", "tomato", "green_chili"],
    cookTime: "15 mins", difficulty: "Easy",
  },
  {
    name: "Masala Toast",
    description: "Buttered toast topped with spiced onion-tomato filling. A quick Indian street-food breakfast.",
    baseIngredients: ["bread", "butter", "onion", "tomatoes", "green chili", "coriander"],
    steps: [
      "Mix finely chopped onion, tomato, green chili, and coriander with salt and chaat masala.",
      "Butter both sides of bread slices generously.",
      "Spread the filling on one slice and close with another to make a sandwich.",
      "Heat a tawa or pan on medium. Place the sandwich and press down gently.",
      "Toast for 2–3 minutes per side until crispy and golden.",
      "Cut diagonally and serve hot with ketchup or green chutney.",
    ],
    uses: ["bread", "butter", "onion", "tomato", "green_chili", "coriander"],
    cookTime: "10 mins", difficulty: "Easy",
  },
  // ── Cauliflower ─────────────────────────────────────────────────────────────
  {
    name: "Aloo Gobi",
    description: "Dry-style potato and cauliflower curry with cumin and turmeric. A North Indian staple.",
    baseIngredients: ["cauliflower", "potato", "cumin", "turmeric", "coriander"],
    steps: [
      "Cut cauliflower into florets. Cube potatoes roughly the same size.",
      "Heat oil in a wide pan. Add cumin seeds and grated ginger.",
      "Add potatoes and stir-fry for 5 minutes. Add cauliflower florets.",
      "Add turmeric, coriander powder, chili powder, and salt. Toss to coat.",
      "Cover and cook on low-medium heat for 15 minutes, stirring occasionally.",
      "Uncover and cook 3 more minutes on high to dry out any moisture. Garnish with coriander.",
    ],
    uses: ["cauliflower", "potato", "coriander"],
    cookTime: "25 mins", difficulty: "Easy",
  },
  {
    name: "Gobi Manchurian",
    description: "Crispy cauliflower florets in a sticky Indo-Chinese sauce. A crowd-pleasing party starter.",
    baseIngredients: ["cauliflower", "besan", "soy sauce", "garlic", "green chili", "spring onions"],
    steps: [
      "Make a thick batter with besan, corn flour, soy sauce, red chili sauce, salt, and water.",
      "Coat cauliflower florets in the batter and deep-fry in hot oil until golden and crispy.",
      "In a wok, heat oil and fry minced garlic and green chili until fragrant.",
      "Add soy sauce, red chili sauce, and a splash of water. Simmer to a sauce.",
      "Toss the fried cauliflower in the sauce until coated.",
      "Garnish with chopped spring onion and sesame seeds. Serve hot.",
    ],
    uses: ["cauliflower", "green_chili"],
    cookTime: "30 mins", difficulty: "Medium",
  },
  // ── Mushroom ─────────────────────────────────────────────────────────────────
  {
    name: "Mushroom Masala",
    description: "Earthy mushrooms simmered in a spiced tomato-onion gravy. Ready in 20 minutes.",
    baseIngredients: ["mushrooms", "onion", "tomatoes", "ginger", "garlic", "garam masala"],
    steps: [
      "Clean and slice mushrooms. They should not be washed — just wipe with a damp cloth.",
      "Heat oil. Sauté finely chopped onions until golden.",
      "Add grated ginger and garlic, cook 1 minute.",
      "Add pureed tomatoes, all spices, and salt. Cook until oil separates.",
      "Add sliced mushrooms and stir. They'll release water — cook on high heat until it evaporates.",
      "Finish with garam masala and fresh coriander. Serve with naan or rice.",
    ],
    uses: ["mushroom", "onion", "tomato"],
    cookTime: "20 mins", difficulty: "Easy",
  },
  // ── Methi ───────────────────────────────────────────────────────────────────
  {
    name: "Methi Thepla",
    description: "Gujarati flatbread enriched with fresh fenugreek leaves. Perfect for tiffin or travel.",
    baseIngredients: ["fenugreek leaves", "atta", "curd", "turmeric", "red chili"],
    steps: [
      "Wash methi leaves thoroughly and chop finely.",
      "In a bowl, mix atta, chopped methi, curd, turmeric, red chili, cumin seeds, and salt.",
      "Knead into a soft, smooth dough — add water only if needed.",
      "Divide into small balls and roll into thin, round theplas.",
      "Cook on a hot tawa with a little oil until golden spots appear on both sides.",
      "Stack, wrap in foil to keep soft, and serve with curd and pickle.",
    ],
    uses: ["fenugreek", "curd"],
    cookTime: "25 mins", difficulty: "Medium",
  },
  // ── Coriander ───────────────────────────────────────────────────────────────
  {
    name: "Green Chutney",
    description: "Vibrant fresh coriander chutney with lemon and green chili. Ready in 2 minutes and goes with everything.",
    baseIngredients: ["coriander", "lemon", "green chili", "garlic", "salt"],
    steps: [
      "Wash coriander leaves thoroughly and remove thick stems.",
      "Add coriander, green chili, garlic, and salt to a blender.",
      "Squeeze in fresh lemon juice.",
      "Add 2 tablespoons of water to help it blend.",
      "Blend until completely smooth.",
      "Taste and adjust salt and lemon. Store in a sealed jar in the fridge for up to 5 days.",
    ],
    uses: ["coriander", "lemon", "green_chili"],
    cookTime: "2 mins", difficulty: "Easy",
  },
  // ── Default fallbacks ────────────────────────────────────────────────────────
  {
    name: "Khichdi",
    description: "The ultimate comfort food — a one-pot meal of rice and lentils. Easy on the stomach and very nourishing.",
    baseIngredients: ["rice", "dal", "turmeric", "ghee", "cumin", "ginger"],
    steps: [
      "Wash rice and dal together until water runs clear.",
      "Heat ghee in a pressure cooker. Add cumin seeds and grated ginger.",
      "Add the rice-dal mixture and sauté 2 minutes.",
      "Add turmeric, salt, and 4 cups of water.",
      "Pressure-cook for 3 whistles. Let pressure release naturally.",
      "Open and stir — it should be porridge-like. Add a dollop of ghee on top and serve with pickle.",
    ],
    uses: [],
    cookTime: "30 mins", difficulty: "Easy",
  },
  {
    name: "Mixed Vegetable Sabzi",
    description: "A simple dry curry using whatever vegetables are available, spiced with classic Indian masalas.",
    baseIngredients: ["mixed vegetables", "cumin", "turmeric", "coriander", "garam masala"],
    steps: [
      "Chop all vegetables into similar bite-sized pieces.",
      "Heat oil and add cumin seeds. Once they splutter, add sliced onions.",
      "Sauté onions until soft. Add ginger-garlic paste and cook 1 minute.",
      "Add harder vegetables first (carrot, potato) and cook 5 minutes.",
      "Add softer vegetables, all spices, and salt. Mix well.",
      "Cover and cook on low heat 10–12 minutes until tender. Garnish with coriander.",
    ],
    uses: [],
    cookTime: "25 mins", difficulty: "Easy",
  },
  {
    name: "Vegetable Pulao",
    description: "Fragrant basmati rice cooked with seasonal vegetables and whole spices. A complete meal in itself.",
    baseIngredients: ["rice", "mixed vegetables", "whole spices", "onions", "ghee"],
    steps: [
      "Wash and soak basmati rice for 20 minutes. Drain and set aside.",
      "Heat ghee in a pot. Add whole spices (bay leaf, cardamom, cinnamon, cloves).",
      "Add thinly sliced onions and fry until golden brown.",
      "Add mixed vegetables and sauté 3 minutes.",
      "Add drained rice and gently mix. Add 1.5x cups of water plus salt.",
      "Cover tightly and cook on low heat for 15 minutes. Let it rest 5 minutes, then fluff and serve.",
    ],
    uses: [],
    cookTime: "35 mins", difficulty: "Easy",
  },
];

function resolveIngredientKey(itemName: string): string | null {
  const lower = itemName.toLowerCase().trim();
  for (const [key, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    for (const alias of aliases) {
      if (lower === alias || lower.includes(alias) || alias.includes(lower)) {
        return key;
      }
    }
  }
  return null;
}

// POST /recipes/generate
router.post("/recipes/generate", async (req: Request, res: Response) => {
  try {
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

    const resolvedKeys = new Set<string>();
    const unresolvedItems: string[] = [];

    for (const item of expiringItems) {
      const key = resolveIngredientKey(item);
      if (key) resolvedKeys.add(key);
      else unresolvedItems.push(item);
    }

    const scored = RECIPE_TEMPLATES.map((recipe) => {
      const matchedKeys = recipe.uses.filter((k) => resolvedKeys.has(k));
      return { recipe, score: matchedKeys.length };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const diffOrder = { Easy: 0, Medium: 1, Hard: 2 };
      return (diffOrder[a.recipe.difficulty as keyof typeof diffOrder] ?? 1) -
             (diffOrder[b.recipe.difficulty as keyof typeof diffOrder] ?? 1);
    });

    const withMatches = scored.filter((s) => s.score > 0);
    const defaults = scored.filter((s) => s.score === 0);
    const selected = [...withMatches, ...defaults].slice(0, 5);

    // Custom fallback for fully unrecognised items
    if (unresolvedItems.length > 0 && withMatches.length < unresolvedItems.length) {
      const customRecipe = {
        name: `Use-It-Up: ${unresolvedItems.slice(0, 3).join(" & ")} Stir Fry`,
        description: `A quick improvised stir-fry using your expiring ${unresolvedItems.join(", ")}. Season with turmeric, cumin, and garam masala from your pantry — it will taste great!`,
        ingredients: [...unresolvedItems, "cumin seeds", "turmeric", "garam masala", "garlic", "oil", "salt to taste"],
        steps: [
          "Wash and chop all ingredients into bite-sized pieces.",
          "Heat oil in a wide pan. Add cumin seeds and let them splutter.",
          "Add minced garlic and sauté until golden.",
          "Add the chopped ingredients — start with the firmest ones.",
          "Sprinkle turmeric, garam masala, chili powder, and salt. Toss well.",
          "Cover and cook on medium heat for 8–10 minutes until everything is tender. Serve with roti or rice.",
        ],
        cookTime: "15 mins",
        difficulty: "Easy",
      };
      const formatted = selected.slice(0, 4).map((s) => ({
        name: s.recipe.name,
        description: s.recipe.description,
        ingredients: [...s.recipe.baseIngredients, "salt to taste"],
        steps: s.recipe.steps,
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
      steps: s.recipe.steps,
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
