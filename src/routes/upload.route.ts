import { Router } from "express";
import { uploadZip } from "../controllers/upload.controller";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.post("/", upload.single("file"), uploadZip);

export default router;