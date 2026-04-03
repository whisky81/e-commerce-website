// frontend/src/components/ProductItem.jsx
import React from "react";
import { Link } from "react-router-dom";
import useShopContext from "../hooks/useShopContext";
import SaleCountdown from "./SaleCountdown";

const fmt = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const ProductItem = ({ id, images, name, price, salePrice, discount, soldCount, saleEndAt, showFavorite = true }) => {
  const { toggleFavorite, favoriteIds } = useShopContext();
  const isFav = favoriteIds.some(fid => String(fid) === String(id));

  const displayPrice = salePrice && salePrice < price ? salePrice : price;
  const hasDiscount  = discount > 0 && salePrice && salePrice < price;

  return (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ background: "#fff", border: "1.5px solid #EDE9FE" }}>

      {/* Discount badge */}
      {hasDiscount && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-lg text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg,#EF4444,#F97316)" }}>
          -{discount}%
        </div>
      )}

      {/* Favorite button */}
      {showFavorite && (
        <button type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(id); }}
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
            isFav ? "bg-rose-500 text-white" : "bg-white/90 text-slate-400 hover:text-rose-500"
          }`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill={isFav ? "currentColor" : "none"} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      )}

      <Link to={`/product/${id}`} className="block">
        {/* Image */}
        <div className="overflow-hidden" style={{ background: "#F5F4FF", aspectRatio: "3/4" }}>
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={images[0]} alt={name} loading="lazy" />
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: "#1E1B4B" }}>{name}</p>
          {soldCount > 0 && (
            <p className="text-xs mb-1.5" style={{ color: "#9CA3AF" }}>
              Đã bán {soldCount.toLocaleString("vi-VN")}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold" style={{ color: "#4F46E5" }}>
              {fmt(displayPrice)}
            </p>
            {hasDiscount && (
              <p className="text-xs line-through" style={{ color: "#9CA3AF" }}>
                {fmt(price)}
              </p>
            )}
          </div>
          {/* ✅ Countdown giảm giá */}
          {hasDiscount && saleEndAt && (
            <div className="mt-1.5">
              <SaleCountdown saleEndAt={saleEndAt} />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductItem;
