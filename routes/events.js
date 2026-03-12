import express from "express";
import { eventsPage, singleEventPage, createComment, toggleEventLike, updateComment, deleteComment } from "../controllers/eventController.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";



const router = express.Router();

router.get("/events", eventsPage);
router.get("/events/:slug", singleEventPage);
router.post("/events/:slug/comments", isLoggedIn, createComment);
router.post("/events/:slug/like", isLoggedIn, toggleEventLike);
router.post("/events/:slug/comments/:id/edit", isLoggedIn, updateComment);
router.post("/events/:slug/comments/:id/delete", isLoggedIn, deleteComment);


export default router;
