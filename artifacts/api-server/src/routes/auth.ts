import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// POST /api/auth/signup
router.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body as { email: string; name: string; password: string };
    if (!email || !name || !password) {
      res.status(400).json({ error: "email, name and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      name,
      passwordHash,
    }).returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name });

    const token = signToken({ userId: user!.id, email: user!.email });
    res.status(201).json({ user: { id: user!.id, email: user!.email, name: user!.name }, token });
  } catch (err) {
    req.log.error({ err }, "Signup failed");
    res.status(500).json({ error: "Signup failed" });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signToken({ userId: user.id, email: user.email });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).auth;
    const [user] = await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
      .from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ user });
  } catch (err) {
    req.log.error({ err }, "Auth me failed");
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
