import { Router, type IRouter, type Request, type Response } from "express";
import { db, itemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Carbon footprint per kg of food waste (average estimate in kg CO2)
const CARBON_PER_RUPEE = 0.002; // rough approximation: 2g CO2 per ₹1 of food value

function getLevelFromRate(rate: number, consumed: number): string {
  if (consumed === 0) return "New Member";
  if (rate >= 90) return "Zero Waste Hero 🌍";
  if (rate >= 75) return "Eco Warrior ♻️";
  if (rate >= 50) return "Green Guardian 🌿";
  if (rate >= 25) return "Eco Learner 🌱";
  return "Eco Beginner 🌾";
}

// GET /analytics/waste - waste avoided metrics and gamification
router.get("/analytics/waste", async (req: Request, res: Response) => {
  try {
    const allItems = await db.select().from(itemsTable);

    const consumed = allItems.filter((i) => i.status === "consumed");
    const wasted = allItems.filter((i) => i.status === "wasted");
    const active = allItems.filter((i) => i.status === "active");

    const moneySaved = consumed.reduce(
      (sum, i) => sum + (i.estimatedCost ? Number(i.estimatedCost) : 0),
      0
    );

    const moneyWasted = wasted.reduce(
      (sum, i) => sum + (i.estimatedCost ? Number(i.estimatedCost) : 0),
      0
    );

    const carbonSaved = +(moneySaved * CARBON_PER_RUPEE).toFixed(3);

    const totalFinished = consumed.length + wasted.length;
    const wasteAvoidanceRate =
      totalFinished > 0 ? +((consumed.length / totalFinished) * 100).toFixed(1) : 0;

    // Simple streak: count consecutive days with consumed items (stub: use total consumed count for now)
    const streak = Math.min(consumed.length, 30);

    const level = getLevelFromRate(wasteAvoidanceRate, consumed.length);

    res.json({
      totalConsumed: consumed.length,
      totalWasted: wasted.length,
      totalActive: active.length,
      moneySaved: +moneySaved.toFixed(2),
      moneyWasted: +moneyWasted.toFixed(2),
      carbonSaved,
      wasteAvoidanceRate,
      streak,
      level,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics");
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

export default router;
