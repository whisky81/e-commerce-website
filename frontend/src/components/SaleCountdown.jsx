// frontend/src/components/SaleCountdown.jsx
import { useState, useEffect } from "react";

/**
 * Hiển thị đếm ngược thời gian kết thúc sale
 * @param {string|Date} saleEndAt - Thời điểm kết thúc sale
 */
const SaleCountdown = ({ saleEndAt }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!saleEndAt) return;
    const end = new Date(saleEndAt).getTime();
    if (isNaN(end)) return;

    const calc = () => {
      const diff = end - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000)  / 60000);
      const s = Math.floor((diff % 60000)    / 1000);
      setTimeLeft({ d, h, m, s });
    };

    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [saleEndAt]);

  if (!timeLeft) return null;

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg"
      style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
      <span>⏱</span>
      <span>Còn:</span>
      {timeLeft.d > 0 && <span>{timeLeft.d}n</span>}
      <span
        style={{
          background: "#92400E",
          color: "#fff",
          padding: "1px 5px",
          borderRadius: "4px",
        }}
      >
        {pad(timeLeft.h)}
      </span>
      <span style={{ color: "#92400E" }}>:</span>
      <span
        style={{
          background: "#92400E",
          color: "#fff",
          padding: "1px 5px",
          borderRadius: "4px",
        }}
      >
        {pad(timeLeft.m)}
      </span>
      <span style={{ color: "#92400E" }}>:</span>
      <span
        style={{
          background: "#92400E",
          color: "#fff",
          padding: "1px 5px",
          borderRadius: "4px",
        }}
      >
        {pad(timeLeft.s)}
      </span>
    </div>
  );
};

export default SaleCountdown;
