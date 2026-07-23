import { Router, type IRouter } from "express";
import authRouter from "../auth";
import commerceRouter from "../commerce";
import emailRouter from "../email";
import healthRouter from "../health";
import registerRouter from "../register";
import walletRouter from "../wallet";

/** Version 1 API surface. Every application API is mounted below /api/v1. */
const v1Router: IRouter = Router();

v1Router.use(healthRouter);
v1Router.use(authRouter);
v1Router.use(emailRouter);
v1Router.use(registerRouter);
v1Router.use(walletRouter);
v1Router.use(commerceRouter);

export default v1Router;
