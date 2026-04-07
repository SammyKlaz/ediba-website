import express from "express";
import { getInvolvedPage, contactPage } from "../controllers/contactController.js";

const router = express.Router();

router.get("/get-involved", getInvolvedPage);
router.get("/contact", contactPage);

export default router;
