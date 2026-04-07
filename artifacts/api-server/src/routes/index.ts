import { Router, type IRouter } from "express";
import healthRouter from "./health";
import itemsRouter from "./items";
import recipesRouter from "./recipes";
import analyticsRouter from "./analytics";
import authRouter from "./auth";
import fridgesRouter from "./fridges";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(fridgesRouter);
router.use(itemsRouter);
router.use(recipesRouter);
router.use(analyticsRouter);

export default router;
