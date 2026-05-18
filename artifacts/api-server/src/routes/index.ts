import { Router, type IRouter, type Request, type Response } from "express";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);

router.post("/is-admin", (req: Request, res: Response) => {
  const email = (req.body?.email || "").toString().toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  res.json({ admin: Boolean(adminEmail && email === adminEmail) });
});

export default router;
