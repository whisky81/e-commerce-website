// frontend/src/pages/Product.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useShopContext from "../hooks/useShopContext";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import SaleCountdown from "../components/SaleCountdown";
import { toast } from "react-toastify";
import axios from "axios";
import Review from "./Review";

const fmt = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const Product = () => {
  const { productId } = useParams();
  const { backendUrl, addToCart, toggleFavorite, favoriteIds } = useShopContext();
  const isFavorite = favoriteIds.some(fid => String(fid) === String(productId));

  const [productData, setProductData] = useState(null);
  const [reviews,     setReviews]     = useState([]);
  const [image,       setImage]       = useState("");
  const [activeTab,   setActiveTab]   = useState("description");

  const fetchProductData = async () => {
    try {
      const response = await axios.get(
        backendUrl + `/api/v2/products/${productId}`,
        { withCredentials: true }
      );
      if (response.data.success) {
        setProductData(response.data.data.product);
        setReviews(response.data.data.reviews);
        setImage(response.data.data.product.images[0]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => { fetchProductData(); }, [productId]);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (!productData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const hasDiscount  = productData.discount > 0 && productData.salePrice && productData.salePrice < productData.price;
  const displayPrice = hasDiscount ? productData.salePrice : productData.price;

  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      <div className="flex gap-12 flex-col sm:flex-row">
        {/* Images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.images.map((item, index) => (
              <img
                key={index} onClick={() => setImage(item)} src={item} alt={productData.name}
                className={`w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer rounded transition-all ${
                  image === item ? "ring-2 ring-indigo-400" : "hover:ring-2 hover:ring-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%] relative">
            {hasDiscount && (
              <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-lg text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#EF4444,#F97316)" }}>
                -{productData.discount}%
              </div>
            )}
            <img src={image} alt={productData.name} className="w-full h-auto rounded-xl shadow-sm" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium">
              {productData.brand}
            </span>
            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
              {productData.category}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 mt-2">
            <h1 className="font-bold text-2xl sm:text-3xl flex-1 text-gray-900 leading-tight">
              {productData.name}
            </h1>
            <button
              type="button"
              onClick={() => toggleFavorite(productData._id)}
              className="shrink-0 w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-rose-50 transition-colors shadow-sm"
              aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill={isFavorite ? "#e11d48" : "none"}
                stroke={isFavorite ? "#e11d48" : "currentColor"}
                className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map(star => (
              <img key={star}
                src={star <= averageRating ? assets.star_icon : assets.star_dull_icon}
                alt="star" className="w-4" />
            ))}
            <p className="pl-2 text-gray-500 text-sm">({reviews.length} đánh giá)</p>
          </div>

          {/* Price */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-bold" style={{ color: "#4F46E5" }}>{fmt(displayPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-gray-400 line-through">{fmt(productData.price)}</span>
                <span className="px-2 py-0.5 rounded-lg text-sm font-bold"
                  style={{ background: "#FEE2E2", color: "#EF4444" }}>
                  Tiết kiệm {fmt(productData.price - productData.salePrice)}
                </span>
              </>
            )}
          </div>

          {/* ✅ Countdown giảm giá */}
          {hasDiscount && productData.saleEndAt && (
            <div className="mt-3">
              <SaleCountdown saleEndAt={productData.saleEndAt} />
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={() => addToCart(productData._id, productData.name, productData.images[0], productData.price, productData.salePrice)}
            className="mt-6 px-8 py-3 rounded-xl text-white font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}
          >
            Thêm vào giỏ hàng
          </button>

          <hr className="mt-8 sm:w-4/5" />

          {/* Meta */}
          <div className="text-sm mt-5 flex flex-col gap-2">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 w-24">Tình trạng:</span>
              <span className={(productData.stock ?? 0) > 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                {(productData.stock ?? 0) > 0 ? `Còn ${productData.stock} sản phẩm` : "Hết hàng"}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 w-24">Đã bán:</span>
              <span className="text-gray-600">{(productData.soldCount ?? 0).toLocaleString("vi-VN")}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 w-24">Vận chuyển:</span>
              <span className="text-emerald-600">Miễn phí toàn quốc</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-20">
        <div className="flex border-b">
          {[
            ["description", "Mô tả sản phẩm"],
            ["reviews", `Đánh giá (${reviews.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === key
                  ? "text-indigo-700 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "description" && (
          <div className="border-x border-b px-6 py-6 text-sm text-gray-600">
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 text-base mb-3">Mô tả chi tiết</h3>
              <p className="leading-relaxed whitespace-pre-line">{productData.description}</p>
            </div>
            {productData.specifications?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 text-base mb-3">Thông số kỹ thuật</h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  {productData.specifications.map((spec, index) => (
                    <div key={index}
                      className={`flex py-2.5 px-4 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                      <span className="font-medium w-1/3 text-gray-700">{spec.key}</span>
                      <span className="w-2/3 text-gray-600">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {productData.note && (
              <div>
                <h3 className="font-semibold text-gray-800 text-base mb-2">Lưu ý</h3>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <p className="text-amber-800 leading-relaxed">{productData.note}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <Review reviews={reviews} setReviews={setReviews} productId={productData._id} />
        )}
      </div>

      <RelatedProducts category={productData.category} brand={productData.brand} />
    </div>
  );
};

export default Product;
