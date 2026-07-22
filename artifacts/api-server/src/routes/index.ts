import { Router, type IRouter } from "express";
import healthRouter from "./health";
import emailRouter from "./email";
import registerRouter from "./register";
import walletRouter from "./wallet";

const router: IRouter = Router();

router.use(healthRouter);
router.use(emailRouter);
router.use(registerRouter);
router.use(walletRouter);

export default router;
