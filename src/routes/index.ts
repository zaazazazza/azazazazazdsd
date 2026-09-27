import { Router, type IRouter } from "express";
import healthRouter from "./health";
import komerzaRouter from "./komerza";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(komerzaRouter);
router.use(storageRouter);

export default router;
