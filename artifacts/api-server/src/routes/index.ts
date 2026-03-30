import { Router, type IRouter } from "express";
import healthRouter from "./health";
import itemsRouter from "./items";
import recipesRouter from "./recipes";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(itemsRouter);
router.use(recipesRouter);
router.use(analyticsRouter);

export default router;
