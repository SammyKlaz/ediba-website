import express from "express";
import {sermonsPage, singleSermonPage} from "../controllers/sermonController.js";
import { createSermonComment, toggleSermonLike } from "../controllers/sermonController.js";
import { isLoggedIn } from "../middleware/authmiddleware.js";




const router = express.Router();

router.get("/sermons", sermonsPage);
router.get("/sermons/:slug", singleSermonPage);
router.post("/sermons/:slug/comments", isLoggedIn, createSermonComment);
router.post("/sermons/:slug/like", isLoggedIn, toggleSermonLike);


export default router;
