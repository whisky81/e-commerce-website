import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import catchAsync from "../middleware/catchAsync.js";
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";

const SHOP_NAME = process.env.SHOP_NAME || "ABC Shop";
const FRONTEND_URL = process.env.FRONTEND_URL;

/**
 * Giữ tối đa MAX_HISTORY tin nhắn gần nhất để tránh history phình token.
 * Tin nhắn cuối (của user) luôn được giữ lại ở ngoài history.
 */
const MAX_HISTORY_TURNS = 5; // 5 lượt = 10 messages (user + model)

/**
 * Lọc sản phẩm liên quan theo từ khóa trong câu hỏi.
 * Tránh gửi toàn bộ catalog mỗi request.
 */
const filterRelevantProducts = (products, query) => {
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 1);

  if (!keywords.length) return products.slice(0, 6);

  const scored = products.map((p) => {
    const haystack =
      `${p.name} ${p.category} ${p.brand} ${p.description ?? ""}`.toLowerCase();
    const score = keywords.reduce((s, k) => s + (haystack.includes(k) ? 1 : 0), 0);
    return { product: p, score };
  });

  const relevant = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.product);

  // Nếu không match gì → gửi 6 sản phẩm đầu làm fallback
  return (relevant.length > 0 ? relevant : products).slice(0, 8);
};

/** Format gọn 1 sản phẩm thành 1 dòng để tiết kiệm token */
const formatProduct = (p) => {
  const desc = p.description ? p.description.slice(0, 80) : "";
  const price = p.salePrice?.toLocaleString("vi-VN") ?? "?";
  return `[${p._id}] ${p.name} | ${price}đ | ${p.brand} | ${p.category}${desc ? ` | ${desc}` : ""}`;
};

export const chatWithBot = catchAsync(async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError("Messages array is required", 400);
  }

  if (!process.env.GEMINI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
    throw new AppError("AI API chưa được cấu hình", 500);
  }

  const userLastMessage = messages[messages.length - 1].text;

  // ── 1. Fetch & filter products ────────────────────────────────────────────
  const allProducts = await Product.find({})
    .select("name salePrice category brand description images")
    .limit(60) // Fetch nhiều nhưng chỉ gửi những cái relevant
    .lean({ virtuals: true });

  const relevantProducts = filterRelevantProducts(allProducts, userLastMessage);

  const productsText = relevantProducts.map(formatProduct).join("\n");

  // ── 2. Fetch reviews chỉ cho sản phẩm relevant ───────────────────────────
  const productIds = relevantProducts.map((p) => p._id);
  const reviews = await Review.find({ product: { $in: productIds } })
    .select("product rating comment")
    .populate("product", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const reviewsText = reviews.length
    ? reviews
        .map((r) => `${r.product?.name}: ${r.rating}★ – ${r.comment?.slice(0, 70)}`)
        .join("\n")
    : "(không có)";

  // ── 3. System prompt gọn ─────────────────────────────────────────────────
  const systemPrompt = `Bạn là tư vấn viên của ${SHOP_NAME}. Trả lời bằng HTML (không dùng markdown).
Quy tắc quan trọng:
- Chỉ tư vấn dựa trên dữ liệu bên dưới. Không bịa giá/sản phẩm.
- Link sản phẩm: <a href="${FRONTEND_URL}/product/[id]" class="chat-link">Tên SP</a>
- Sản phẩm không có trong danh sách → báo "shop đang cập nhật".
- Thân thiện, ngắn gọn. Dùng <b>, <ul>, <li>, <br> để trình bày rõ ràng.

SẢN PHẨM (format: [id] tên | giá | brand | category | mô tả):
${productsText}

ĐÁNH GIÁ GẦN ĐÂY:
${reviewsText}`;

  // ── 4. Trim history để tiết kiệm token ───────────────────────────────────
  // Giữ MAX_HISTORY_TURNS lượt gần nhất, bỏ tin cuối (sẽ sendMessage riêng)
  const historyMessages = messages
    .slice(0, -1)
    .slice(-(MAX_HISTORY_TURNS * 2));

  // ── Gemini ────────────────────────────────────────────────────────────────
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const history = historyMessages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const chat = model.startChat({
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        history,
      });

      const result = await chat.sendMessage(userLastMessage);
      const text = result.response.text();

      return new ApiResponse(true, 200, "OK", { role: "model", text }).send(res);
    } catch (err) {
      console.error("[Gemini] Error:", err.message);
    }
  }

  // ── DeepSeek fallback ─────────────────────────────────────────────────────
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const openai = new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: process.env.DEEPSEEK_API_KEY,
      });

      const openAiMessages = [
        { role: "system", content: systemPrompt },
        ...historyMessages.map((msg) => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.text,
        })),
        { role: "user", content: userLastMessage },
      ];

      const completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: openAiMessages,
        stream: false,
      });

      const text = completion.choices[0].message.content;

      return new ApiResponse(true, 200, "OK", { role: "model", text }).send(res);
    } catch (err) {
      console.error("[DeepSeek] Error:", err.message);
    }
  }

  throw new AppError("Không thể kết nối AI lúc này. Vui lòng thử lại sau.", 500);
});