import express from "express";
import { chatWithBot } from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/", chatWithBot);

export default router;
