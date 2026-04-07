import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Clock, Snowflake, AlertTriangle, Lightbulb, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

// ─── Food storage knowledge base ────────────────────────────────────────────
interface FoodInfo {
  name: string;
  emoji: string;
  fridgeDays: [number, number]; // [min, max]
  freezerMonths: [number, number] | null;
  cautionNote: string;
  tips: string[];
  spoilageSigns: string[];
}

const FOOD_DB: Record<string, FoodInfo> = {
  fish: {
    name: "Fish / Seafood",
    emoji: "🐟",
    fridgeDays: [1, 2],
    freezerMonths: [2, 3],
    cautionNote: "Fish is the most perishable item — use it the same day or next day at the latest.",
    tips: [
      "Store on the lowest shelf of your fridge (coldest spot).",
      "Keep it on a bed of ice inside a container for extra freshness.",
      "Marinate before refrigerating — the acids slow bacterial growth.",
    ],
    spoilageSigns: ["Strong 'fishy' or ammonia smell", "Cloudy or sunken eyes", "Slimy texture", "Dull grey flesh instead of translucent pink"],
  },
  prawn: {
    name: "Prawns / Shrimp",
    emoji: "🦐",
    fridgeDays: [1, 2],
    freezerMonths: [3, 6],
    cautionNote: "Prawns spoil very fast once thawed — never refreeze thawed prawns.",
    tips: [
      "Keep in a sealed container submerged in ice water.",
      "Devein before storing to slow deterioration.",
      "Freeze immediately if you won't cook within a day.",
    ],
    spoilageSigns: ["Ammonia or bleach smell", "Black spots on shell", "Mushy texture when pinched", "Discoloured grey-black flesh"],
  },
  chicken: {
    name: "Chicken (Raw)",
    emoji: "🍗",
    fridgeDays: [1, 2],
    freezerMonths: [9, 12],
    cautionNote: "Raw chicken must be stored below 4°C. Never leave it at room temperature for more than 2 hours.",
    tips: [
      "Store on the bottom shelf to prevent drip contamination.",
      "Keep in original packaging or a sealed container.",
      "Marinate in the fridge, not on the counter.",
    ],
    spoilageSigns: ["Sour or off smell", "Slimy or sticky surface", "Grey or dull colour instead of pink", "Any visible mould"],
  },
  mutton: {
    name: "Mutton / Lamb",
    emoji: "🥩",
    fridgeDays: [1, 2],
    freezerMonths: [3, 4],
    cautionNote: "Like all raw meat, store away from ready-to-eat foods.",
    tips: [
      "Wrap tightly in plastic or keep in a sealed container.",
      "Store on the bottom shelf of the fridge.",
      "Freeze in meal-sized portions for easy use.",
    ],
    spoilageSigns: ["Sour or putrid smell", "Slimy texture", "Brown or grey colour throughout", "Any greenish tint"],
  },
  egg: {
    name: "Eggs",
    emoji: "🥚",
    fridgeDays: [21, 35],
    freezerMonths: null,
    cautionNote: "In India, unwashed eggs can safely sit at room temperature for 1–2 weeks.",
    tips: [
      "Store in the carton to prevent absorbing fridge odours.",
      "Keep in the coldest part of the fridge, not the door.",
      "Float test: a fresh egg sinks flat, an old egg stands upright — don't eat it.",
    ],
    spoilageSigns: ["Sulphur smell when cracked", "Egg floats in water", "Runny, watery whites when cracked open", "Discoloured yolk"],
  },
  milk: {
    name: "Milk",
    emoji: "🥛",
    fridgeDays: [5, 7],
    freezerMonths: [1, 3],
    cautionNote: "After opening, consume within 5–7 days. Boil once daily to extend shelf life by 1–2 more days.",
    tips: [
      "Store away from light — it degrades vitamins.",
      "Don't store in the fridge door — it's the warmest spot.",
      "Boiled milk keeps longer in Indian conditions.",
    ],
    spoilageSigns: ["Sour smell", "Curdled or clumpy texture", "Yellow or off-white colour", "Visible chunks"],
  },
  paneer: {
    name: "Paneer",
    emoji: "🧀",
    fridgeDays: [2, 3],
    freezerMonths: [1, 3],
    cautionNote: "Store-bought paneer lasts 2–3 days; fresh homemade paneer should ideally be used within 1 day.",
    tips: [
      "Submerge in water in a covered container — change water daily to extend life.",
      "Freeze in cubes; thaw in the fridge (not on the counter).",
      "Don't leave it in the air — it dries out and absorbs odours.",
    ],
    spoilageSigns: ["Sour or tangy smell", "Slimy surface", "Pink or yellow discolouration", "Visible mould spots"],
  },
  curd: {
    name: "Curd / Yogurt (Dahi)",
    emoji: "🫙",
    fridgeDays: [7, 14],
    freezerMonths: [1, 2],
    cautionNote: "Curd is live cultured and keeps well, but always use a clean, dry spoon to avoid contamination.",
    tips: [
      "Store in a ceramic or glass container rather than metal.",
      "Keep covered at all times.",
      "Slightly sour curd is still safe — use it for marinating meat or in kadhi.",
    ],
    spoilageSigns: ["Pink, yellow or green mould on surface", "Very strong sour smell beyond normal", "Extremely watery with solid separation", "Fizzy or fermented taste"],
  },
  butter: {
    name: "Butter",
    emoji: "🧈",
    fridgeDays: [30, 90],
    freezerMonths: [6, 9],
    cautionNote: "Salted butter lasts longer than unsalted due to the preserving effect of salt.",
    tips: [
      "Keep in a covered dish away from strong-smelling foods.",
      "Freeze extra sticks and thaw as needed.",
      "A butter crock (with water seal) lets you store butter safely at room temp for up to 30 days.",
    ],
    spoilageSigns: ["Yellow-brown rancid patches", "Off or sour smell", "Visible mould", "Greasy, oily texture throughout"],
  },
  tomato: {
    name: "Tomatoes",
    emoji: "🍅",
    fridgeDays: [5, 7],
    freezerMonths: [2, 3],
    cautionNote: "Ripe tomatoes are best stored at room temperature — fridge makes them mealy. Refrigerate only when fully ripe.",
    tips: [
      "Store stem-side down to slow ripening.",
      "Never refrigerate unripe tomatoes.",
      "Freeze whole or pureed for cooking use later.",
    ],
    spoilageSigns: ["Very soft and mushy", "Mould on skin", "Fermented or off smell", "Leaking liquid"],
  },
  spinach: {
    name: "Spinach / Palak",
    emoji: "🌿",
    fridgeDays: [3, 5],
    freezerMonths: [10, 12],
    cautionNote: "Leafy greens are highly perishable — blanch and freeze for long-term storage.",
    tips: [
      "Store dry — moisture causes rapid rot.",
      "Wrap in a dry paper towel inside an open bag.",
      "Don't wash until just before use.",
    ],
    spoilageSigns: ["Yellow or brown leaves", "Slimy or wet texture", "Strong unpleasant smell", "Very wilted and limp"],
  },
  potato: {
    name: "Potatoes (Aloo)",
    emoji: "🥔",
    fridgeDays: [14, 21],
    freezerMonths: null,
    cautionNote: "Potatoes are best in a cool, dark, dry place — not the fridge. Cold converts starch to sugar, making them taste sweet.",
    tips: [
      "Store in a paper bag in a cool, dark pantry.",
      "Keep away from onions — they release gases that ripen each other faster.",
      "Remove any sprouted ones immediately to keep the rest fresh.",
    ],
    spoilageSigns: ["Green tinge on skin (toxic — cut away generously)", "Foul smell", "Very soft and mushy", "Deep black rot inside"],
  },
  onion: {
    name: "Onions (Pyaz)",
    emoji: "🧅",
    fridgeDays: [7, 14],
    freezerMonths: [2, 3],
    cautionNote: "Whole onions last 1–2 months at room temperature. Use fridge only after cutting.",
    tips: [
      "Store whole, uncut onions in a cool dry place with good airflow.",
      "Keep cut onions in a sealed container in the fridge.",
      "Keep away from potatoes — they cause each other to spoil faster.",
    ],
    spoilageSigns: ["Soft, mushy spots", "Strong or foul smell beyond normal", "Visible mould", "Wet or slimy outer layer"],
  },
  carrot: {
    name: "Carrots (Gajar)",
    emoji: "🥕",
    fridgeDays: [14, 21],
    freezerMonths: [10, 12],
    cautionNote: "Carrots last well in the fridge — one of the more forgiving vegetables.",
    tips: [
      "Remove tops before storing — they draw out moisture.",
      "Store in a container of cold water for extra crispness.",
      "Avoid storing near ethylene-producing fruits like apples.",
    ],
    spoilageSigns: ["Soft and limp", "White blush (just dehydration — safe to eat if no smell)", "Slimy surface", "Very strong smell or mould"],
  },
  cucumber: {
    name: "Cucumber (Kheera)",
    emoji: "🥒",
    fridgeDays: [5, 7],
    freezerMonths: null,
    cautionNote: "Cucumbers are sensitive to cold — store at around 10–12°C if possible. Very cold fridges can cause pitting.",
    tips: [
      "Wrap whole cucumber in a paper towel to absorb moisture.",
      "Store in a bag on the warmest shelf of the fridge (or door).",
      "Use within 3 days of cutting.",
    ],
    spoilageSigns: ["Soft, mushy ends", "Slimy or wet skin", "Hollow watery interior", "Strong bitter smell"],
  },
  capsicum: {
    name: "Capsicum / Bell Pepper",
    emoji: "🫑",
    fridgeDays: [7, 14],
    freezerMonths: [6, 8],
    cautionNote: "Green capsicum lasts longer than red or yellow — they are less ripe.",
    tips: [
      "Don't cut until ready to use — cut capsicum dries out fast.",
      "Freeze diced capsicum (no blanching needed) — perfect for cooking.",
      "Store in the crisper drawer of the fridge.",
    ],
    spoilageSigns: ["Shrivelled skin", "Soft or watery flesh", "Mould near stem", "Strong unpleasant smell"],
  },
  lemon: {
    name: "Lemon / Lime (Nimbu)",
    emoji: "🍋",
    fridgeDays: [21, 28],
    freezerMonths: [3, 4],
    cautionNote: "Lemons last up to a week at room temperature and up to a month in the fridge.",
    tips: [
      "Store in a sealed bag in the fridge for maximum life.",
      "Freeze juice in ice-cube trays for easy portioning.",
      "Rub cut surfaces with salt to prevent browning.",
    ],
    spoilageSigns: ["Very soft and shrivelled", "White or green mould", "Hollow or dry inside when cut", "Off or fermented smell"],
  },
  banana: {
    name: "Banana (Kela)",
    emoji: "🍌",
    fridgeDays: [5, 7],
    freezerMonths: [2, 3],
    cautionNote: "Refrigerate only when fully ripe — the skin turns black but the fruit inside is fine. Unripe bananas should be kept at room temp.",
    tips: [
      "Separate bananas from the bunch to slow ripening.",
      "Wrap stems in plastic wrap to extend freshness.",
      "Freeze ripe bananas (peeled) for smoothies or baking.",
    ],
    spoilageSigns: ["Completely black mushy flesh (not just skin)", "Fermented or alcoholic smell", "Leaking liquid from peel", "Mould at tip"],
  },
  apple: {
    name: "Apple (Seb)",
    emoji: "🍎",
    fridgeDays: [30, 60],
    freezerMonths: [8, 12],
    cautionNote: "Apples give off ethylene gas — store separately from other fruits and vegetables.",
    tips: [
      "Store in the crisper drawer away from vegetables.",
      "Don't wash until ready to eat — moisture accelerates decay.",
      "Slightly mealy texture is safe — just a quality change, not spoilage.",
    ],
    spoilageSigns: ["Large soft, brown, sunken areas", "Strong fermented or vinegar smell", "Visible mould", "Leaking juice"],
  },
  bread: {
    name: "Bread / Pav",
    emoji: "🍞",
    fridgeDays: [7, 10],
    freezerMonths: [3, 6],
    cautionNote: "Fridge bread lasts longer but goes stale faster. Room temperature is better for texture.",
    tips: [
      "Store in a sealed bag at room temperature for up to 5–7 days.",
      "Freeze slices — they toast straight from the freezer.",
      "Keep away from heat and moisture.",
    ],
    spoilageSigns: ["Visible white, green or black mould", "Strong stale or musty smell", "Unusual wet or slimy texture"],
  },
  mushroom: {
    name: "Mushrooms",
    emoji: "🍄",
    fridgeDays: [5, 7],
    freezerMonths: [10, 12],
    cautionNote: "Never store mushrooms in a plastic bag — they need to breathe.",
    tips: [
      "Store in a paper bag in the fridge — absorbs moisture.",
      "Don't wash until just before use.",
      "Sauté and then freeze for longer storage.",
    ],
    spoilageSigns: ["Very slimy surface", "Strong ammonia smell", "Dark brown spots throughout", "Collapsed or shrunken caps"],
  },
  cauliflower: {
    name: "Cauliflower / Gobi",
    emoji: "🥦",
    fridgeDays: [3, 5],
    freezerMonths: [8, 12],
    cautionNote: "Small black spots are natural oxidation and safe — large brown areas indicate spoilage.",
    tips: [
      "Store stem-side down to keep moisture away from the florets.",
      "Wrap loosely in a plastic bag — needs some airflow.",
      "Blanch before freezing to preserve texture and colour.",
    ],
    spoilageSigns: ["Large brown or soft areas", "Strong sulphur smell when cut", "Slimy surface", "Mould between florets"],
  },
  dal: {
    name: "Dal (Cooked)",
    emoji: "🍲",
    fridgeDays: [3, 5],
    freezerMonths: [2, 3],
    cautionNote: "Cooked dal must be cooled and refrigerated within 2 hours of cooking to be safe.",
    tips: [
      "Cool completely before refrigerating — never put hot dal in the fridge.",
      "Freeze in portions for quick weeknight meals.",
      "Add a thin layer of oil on top before refrigerating to prevent a skin.",
    ],
    spoilageSigns: ["Sour or fermented smell", "Pink or unusual discolouration", "Bubbling or fizzing when reheated", "Mould on surface"],
  },
  rice: {
    name: "Cooked Rice",
    emoji: "🍚",
    fridgeDays: [4, 6],
    freezerMonths: [1, 2],
    cautionNote: "Cooked rice can harbour Bacillus cereus — never leave it at room temperature for more than 2 hours.",
    tips: [
      "Spread on a tray to cool quickly before refrigerating.",
      "Reheat thoroughly until steaming hot throughout.",
      "Freeze in zip-lock bags flat — thaws quickly in the microwave.",
    ],
    spoilageSigns: ["Hard, dried-out texture beyond normal", "Sour or strange smell", "Sticky clumped texture (different from fresh)", "Visible mould"],
  },
  methi: {
    name: "Methi / Fenugreek Leaves",
    emoji: "🌿",
    fridgeDays: [2, 4],
    freezerMonths: [6, 10],
    cautionNote: "One of the most delicate leafy greens — use within 2–3 days for best flavour.",
    tips: [
      "Store with a paper towel to absorb excess moisture.",
      "Wash and dry well, then freeze in zip-lock bags.",
      "Pick out yellow leaves before storing to keep the rest fresh.",
    ],
    spoilageSigns: ["Yellowing leaves", "Slimy or wet texture", "Strong bitter or off smell", "Mostly wilted with no crispness"],
  },
  peas: {
    name: "Green Peas (Matar)",
    emoji: "🫛",
    fridgeDays: [3, 5],
    freezerMonths: [8, 12],
    cautionNote: "Shelled peas have a shorter life than peas still in the pod.",
    tips: [
      "Keep in pods and shell just before use.",
      "Blanch shelled peas and freeze — they stay bright green and tasty.",
      "Avoid washing before storing.",
    ],
    spoilageSigns: ["Yellowed or wrinkled pods", "Sour or off smell", "Mushy texture when squeezed", "Discoloured or darkened peas"],
  },
  brinjal: {
    name: "Brinjal / Baingan",
    emoji: "🍆",
    fridgeDays: [5, 7],
    freezerMonths: [10, 12],
    cautionNote: "Brinjal is cold-sensitive — temperatures below 10°C cause pitting and browning. Store on a warmer shelf.",
    tips: [
      "Store whole — cut brinjal browns rapidly.",
      "Keep away from ethylene-producing fruits.",
      "Roast and freeze the pulp for easy bharta later.",
    ],
    spoilageSigns: ["Very soft and indented when pressed", "Brown or mushy flesh inside", "Wrinkled, shrivelled skin", "Strong off smell"],
  },
  corn: {
    name: "Corn / Sweet Corn",
    emoji: "🌽",
    fridgeDays: [1, 3],
    freezerMonths: [8, 12],
    cautionNote: "Corn loses its sweetness rapidly after harvest — cook or eat as soon as possible.",
    tips: [
      "Keep in the husk until ready to cook.",
      "Blanch ears and freeze on the cob, or cut kernels off and freeze.",
      "Refrigerate immediately after buying.",
    ],
    spoilageSigns: ["Slimy or mushy kernels", "Brown or black tassels (not just dry tassels)", "Sour or fermented smell", "Visible mould inside husk"],
  },
  coconut: {
    name: "Coconut (Fresh / Grated)",
    emoji: "🥥",
    fridgeDays: [4, 7],
    freezerMonths: [6, 8],
    cautionNote: "Fresh grated coconut goes rancid quickly — freeze unused portions immediately.",
    tips: [
      "Store grated coconut in a sealed container.",
      "Freeze in small portions for convenient use in chutneys.",
      "A whole coconut with intact shell lasts 2–4 months at room temp.",
    ],
    spoilageSigns: ["Sour or rancid smell", "Pink or grey discolouration", "Mould on the surface", "Very oily or sticky texture"],
  },
  cheese: {
    name: "Cheese (Processed / Amul)",
    emoji: "🧀",
    fridgeDays: [14, 28],
    freezerMonths: [1, 3],
    cautionNote: "Once opened, keep tightly wrapped in cling film to prevent drying and mould.",
    tips: [
      "Wrap cut surfaces in butter paper then cling film.",
      "Store in the coldest part of the fridge.",
      "Firm cheeses like cheddar can have mould cut off (1 cm margin) and still be eaten.",
    ],
    spoilageSigns: ["Blue or green mould (on non-blue cheese)", "Very slimy surface", "Strong ammonia smell", "Cracked and very dried"],
  },
};

// Aliases → canonical key mapping
const ALIASES: Record<string, string> = {
  machli: "fish", mach: "fish", pomfret: "fish", rohu: "fish", hilsa: "fish",
  tilapia: "fish", salmon: "fish", tuna: "fish", "sea bass": "fish",
  jhinga: "prawn", chingri: "prawn", shrimp: "prawn", prawns: "prawn",
  murgh: "chicken", "chicken curry": "chicken",
  lamb: "mutton", "lamb chops": "mutton", goat: "mutton",
  anda: "egg", eggs: "egg",
  doodh: "milk",
  "cottage cheese": "paneer",
  dahi: "curd", yogurt: "curd",
  makkhan: "butter", "white butter": "butter",
  tamatar: "tomato", tomatoes: "tomato",
  palak: "spinach",
  aloo: "potato", potatoes: "potato",
  pyaz: "onion", onions: "onion",
  gajar: "carrot", carrots: "carrot",
  kheera: "cucumber", cucumbers: "cucumber",
  "bell pepper": "capsicum", "shimla mirch": "capsicum",
  nimbu: "lemon", lime: "lemon", lemons: "lemon",
  kela: "banana", bananas: "banana",
  seb: "apple", apples: "apple",
  pav: "bread", "double roti": "bread",
  mushrooms: "mushroom",
  gobi: "cauliflower",
  "toor dal": "dal", "masoor dal": "dal", "moong dal": "dal", "chana dal": "dal", lentils: "dal",
  "cooked rice": "rice", chawal: "rice",
  fenugreek: "methi",
  matar: "peas",
  baingan: "brinjal", eggplant: "brinjal", aubergine: "brinjal",
  "sweet corn": "corn", maize: "corn",
  "amul cheese": "cheese", cheddar: "cheese",
};

function resolveFood(query: string): FoodInfo | null {
  const q = query.toLowerCase().trim();
  const directKey = FOOD_DB[q];
  if (directKey) return directKey;
  const aliasKey = ALIASES[q];
  if (aliasKey && FOOD_DB[aliasKey]) return FOOD_DB[aliasKey]!;
  // Partial match
  for (const [key, info] of Object.entries(FOOD_DB)) {
    if (q.includes(key) || key.includes(q)) return info;
  }
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (q.includes(alias) || alias.includes(q)) return FOOD_DB[key] ?? null;
  }
  return null;
}

// ─── Timeline bar component ──────────────────────────────────────────────────
function StorageTimeline({ days }: { days: [number, number] }) {
  const maxDisplay = Math.max(days[1] * 2, 30);
  const safeEnd = (days[0] / maxDisplay) * 100;
  const cautionEnd = (days[1] / maxDisplay) * 100;

  return (
    <div className="mt-3 mb-1">
      <div className="relative h-5 rounded-full overflow-hidden bg-muted flex">
        <div className="h-full bg-emerald-400 transition-all" style={{ width: `${safeEnd}%` }} />
        <div className="h-full bg-orange-400 transition-all" style={{ width: `${cautionEnd - safeEnd}%` }} />
        <div className="h-full bg-red-400 flex-1" />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
        <span>Day 0</span>
        <span className="text-emerald-600 font-medium">Day {days[0]} — safe</span>
        <span className="text-orange-600 font-medium">Day {days[1]} — use now</span>
        <span className="text-red-500 font-medium">After — discard</span>
      </div>
      <div className="flex gap-3 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Safe</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Use soon</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Discard</span>
      </div>
    </div>
  );
}

// ─── Message types ───────────────────────────────────────────────────────────
type Message =
  | { kind: "user"; text: string }
  | { kind: "bot-result"; info: FoodInfo }
  | { kind: "bot-unknown"; query: string }
  | { kind: "bot-welcome" };

// ─── Main component ──────────────────────────────────────────────────────────
const SUGGESTIONS = ["Fish", "Chicken", "Paneer", "Eggs", "Spinach", "Milk", "Tomatoes", "Mushrooms"];

export function ExpiryChat() {
  const [messages, setMessages] = useState<Message[]>([{ kind: "bot-welcome" }]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (query: string = input) => {
    const q = query.trim();
    if (!q) return;
    const info = resolveFood(q);
    setMessages(prev => [
      ...prev,
      { kind: "user", text: q },
      info ? { kind: "bot-result", info } : { kind: "bot-unknown", query: q },
    ]);
    setInput("");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]">
        {/* Page title */}
        <div className="mb-4 shrink-0">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" /> Expiry Guide
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Ask about any ingredient and get storage timelines, tips, and spoilage signs.</p>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {messages.map((msg, i) => {
            if (msg.kind === "bot-welcome") {
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-3xl rounded-tl-sm p-5 shadow-sm max-w-full">
                    <p className="font-semibold text-foreground mb-3">👋 Hello! I'm your Expiry Guide.</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Type any ingredient below and I'll tell you exactly how long it's safe in the fridge, how to store it right, and what spoilage looks like.
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Try asking about:</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => handleSend(s)}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.kind === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-3xl rounded-br-sm px-5 py-3 max-w-xs shadow-md shadow-primary/20">
                    <p className="font-medium">{msg.text}</p>
                  </div>
                </div>
              );
            }

            if (msg.kind === "bot-unknown") {
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-3xl rounded-tl-sm p-5 shadow-sm">
                    <p className="text-foreground">
                      I don't have specific data for <strong>"{msg.query}"</strong> yet. As a general rule, most perishables are safe for <strong>2–5 days</strong> in the fridge. Try asking about a similar item!
                    </p>
                  </div>
                </div>
              );
            }

            if (msg.kind === "bot-result") {
              const { info } = msg;
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-3xl rounded-tl-sm p-5 shadow-sm flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-3xl">{info.emoji}</span>
                      <h3 className="font-display font-bold text-xl text-foreground">{info.name}</h3>
                    </div>

                    {/* Storage times */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs mb-1">
                          <Clock className="w-3.5 h-3.5" /> FRIDGE
                        </div>
                        <p className="font-bold text-lg text-emerald-800">
                          {info.fridgeDays[0] === info.fridgeDays[1]
                            ? `${info.fridgeDays[0]} days`
                            : `${info.fridgeDays[0]}–${info.fridgeDays[1]} days`}
                        </p>
                      </div>
                      <div className={cn("border rounded-2xl p-3", info.freezerMonths ? "bg-blue-50 border-blue-200" : "bg-muted border-border")}>
                        <div className={cn("flex items-center gap-1.5 font-semibold text-xs mb-1", info.freezerMonths ? "text-blue-700" : "text-muted-foreground")}>
                          <Snowflake className="w-3.5 h-3.5" /> FREEZER
                        </div>
                        <p className={cn("font-bold text-lg", info.freezerMonths ? "text-blue-800" : "text-muted-foreground")}>
                          {info.freezerMonths
                            ? `${info.freezerMonths[0]}–${info.freezerMonths[1]} months`
                            : "Not recommended"}
                        </p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Storage Timeline</p>
                      <StorageTimeline days={info.fridgeDays} />
                    </div>

                    {/* Caution note */}
                    <div className="flex gap-2 bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-4">
                      <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-orange-800">{info.cautionNote}</p>
                    </div>

                    {/* Tips */}
                    <div className="mb-4">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Storage Tips
                      </p>
                      <ul className="space-y-1.5">
                        {info.tips.map((tip, ti) => (
                          <li key={ti} className="flex gap-2 text-sm text-foreground">
                            <span className="text-primary font-bold shrink-0">•</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Spoilage signs */}
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Signs of Spoilage
                      </p>
                      <ul className="space-y-1.5">
                        {info.spoilageSigns.map((sign, si) => (
                          <li key={si} className="flex gap-2 text-sm text-foreground">
                            <span className="text-red-500 font-bold shrink-0">×</span> {sign}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="shrink-0 pt-3 border-t border-border">
          <div className="flex gap-3 items-center bg-card border border-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Type an ingredient, e.g. fish, paneer, milk..."
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-2">Storage times are general guidelines. Always trust your senses.</p>
        </div>
      </div>
    </AppLayout>
  );
}
