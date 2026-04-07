import { Router, type IRouter, type Request, type Response } from "express";
import { db, fridgesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// GET /api/fridges — list fridges for logged-in user
router.get("/fridges", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).auth;
    const fridges = await db.select().from(fridgesTable).where(eq(fridgesTable.userId, userId));
    res.json({ fridges });
  } catch (err) {
    req.log.error({ err }, "List fridges failed");
    res.status(500).json({ error: "Failed to list fridges" });
  }
});

// POST /api/fridges — create a new fridge
router.post("/fridges", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).auth;
    const { name, icon } = req.body as { name: string; icon?: string };
    if (!name?.trim()) {
      res.status(400).json({ error: "Fridge name is required" });
      return;
    }
    const [fridge] = await db.insert(fridgesTable).values({
      name: name.trim(),
      icon: icon ?? "🧊",
      userId,
    }).returning();
    res.status(201).json({ fridge });
  } catch (err) {
    req.log.error({ err }, "Create fridge failed");
    res.status(500).json({ error: "Failed to create fridge" });
  }
});

// DELETE /api/fridges/:id
router.delete("/fridges/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).auth;
    const fridgeId = Number(req.params.id);
    const deleted = await db.delete(fridgesTable)
      .where(and(eq(fridgesTable.id, fridgeId), eq(fridgesTable.userId, userId)))
      .returning({ id: fridgesTable.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: "Fridge not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete fridge failed");
    res.status(500).json({ error: "Failed to delete fridge" });
  }
});

export default router;
