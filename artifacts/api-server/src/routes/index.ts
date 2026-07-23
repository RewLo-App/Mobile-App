import { Router, type IRouter } from "express";
import healthRouter from "./health";
import emailRouter from "./email";
import registerRouter from "./register";
import walletRouter from "./wallet";
import commerceRouter from "./commerce";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
// Auth contains public routes (register, login, reset) and must be mounted
// before feature routers that apply authentication to all incoming requests.
router.use(authRouter);
router.use(emailRouter);
router.use(registerRouter);
router.use(walletRouter);
router.use(commerceRouter);

export default router;
