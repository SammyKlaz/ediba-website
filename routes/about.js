import express from "express";
import { aboutPage } from "../controllers/aboutController.js";
import { ministerProfile } from "../controllers/aboutController.js";

const router = express.Router();

router.get("/about", aboutPage);
router.get("/about/minister-in-charge/:slug", ministerProfile);



export default router;

