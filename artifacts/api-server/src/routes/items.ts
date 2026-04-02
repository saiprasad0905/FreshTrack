import { Router, type IRouter, type Request, type Response } from "express";
import { db, itemsTable, insertItemSchema, updateItemSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import multer from "multer";

// Drizzle numeric columns expect strings. Pre-process the body so numbers become strings.
function coerceNumericFields(body: Record<string, unknown>) {
  const result = { ...body };
  if (result["quantity"] !== undefined) result["quantity"] = String(result["quantity"]);
  if (result["estimatedCost"] !== undefined) result["estimatedCost"] = String(result["estimatedCost"]);
  return result;
}

const router: IRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /items - list all items, optionally filtered by status
router.get("/items", async (req: Request, res: Response) => {
  try {
    const statusParam = req.query["status"] as string | undefined;
    const validStatuses = ["active", "consumed", "wasted"];

    let items;
    if (statusParam && validStatuses.includes(statusParam)) {
      items = await db
        .select()
        .from(itemsTable)
        .where(eq(itemsTable.status, statusParam as "active" | "consumed" | "wasted"));
    } else {
      items = await db.select().from(itemsTable);
    }

    const mapped = items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: Number(item.quantity),
      unit: item.unit,
      purchaseDate: item.purchaseDate ?? null,
      expiryDate: item.expiryDate,
      status: item.status,
      estimatedCost: item.estimatedCost ? Number(item.estimatedCost) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list items");
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// POST /items - create a new item
router.post("/items", async (req: Request, res: Response) => {
  try {
    const parsed = insertItemSchema.safeParse(coerceNumericFields(req.body));
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }

    const [item] = await db
      .insert(itemsTable)
      .values(parsed.data)
      .returning();

    res.status(201).json({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: Number(item.quantity),
      unit: item.unit,
      purchaseDate: item.purchaseDate ?? null,
      expiryDate: item.expiryDate,
      status: item.status,
      estimatedCost: item.estimatedCost ? Number(item.estimatedCost) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create item");
    res.status(500).json({ error: "Failed to create item" });
  }
});

// GET /items/:id - get single item
router.get("/items/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid item ID" });
      return;
    }

    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, id));
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: Number(item.quantity),
      unit: item.unit,
      purchaseDate: item.purchaseDate ?? null,
      expiryDate: item.expiryDate,
      status: item.status,
      estimatedCost: item.estimatedCost ? Number(item.estimatedCost) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get item");
    res.status(500).json({ error: "Failed to get item" });
  }
});

// PATCH /items/:id - update item (especially status)
router.patch("/items/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid item ID" });
      return;
    }

    const parsed = updateItemSchema.safeParse(coerceNumericFields(req.body));
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }

    const [updated] = await db
      .update(itemsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(itemsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json({
      id: updated.id,
      name: updated.name,
      category: updated.category,
      quantity: Number(updated.quantity),
      unit: updated.unit,
      purchaseDate: updated.purchaseDate ?? null,
      expiryDate: updated.expiryDate,
      status: updated.status,
      estimatedCost: updated.estimatedCost ? Number(updated.estimatedCost) : null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update item");
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE /items/:id - delete item
router.delete("/items/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid item ID" });
      return;
    }

    await db.delete(itemsTable).where(eq(itemsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete item");
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// POST /items/scan - receipt OCR stub
router.post("/items/scan", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Insert a receipt record for audit trail
    const { receiptsTable, insertReceiptSchema: receiptSchema } = await import("@workspace/db");
    const [receipt] = await db
      .insert(receiptsTable)
      .values({
        originalFilename: file.originalname,
        status: "processed",
        extractedData: { stubbed: true },
      })
      .returning();

    // Stub OCR response with plausible Indian grocery items
    const extractedItems = [
      { name: "Tomatoes", quantity: 1, unit: "kg", estimatedCost: 40 },
      { name: "Spinach", quantity: 1, unit: "bunch", estimatedCost: 20 },
      { name: "Paneer", quantity: 200, unit: "g", estimatedCost: 90 },
      { name: "Milk", quantity: 1, unit: "liters", estimatedCost: 60 },
    ];

    res.json({
      receiptId: receipt.id,
      extractedItems,
      message: "OCR processing complete (stub). Review and confirm items to add to your fridge.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to scan receipt");
    res.status(500).json({ error: "Failed to process receipt" });
  }
});

export default router;
