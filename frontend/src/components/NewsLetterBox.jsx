// frontend/src/components/NewsLetterBox.jsx
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import useShopContext from "../hooks/useShopContext";

const NewsLetterBox = () => {
  const { backendUrl } = useShopContext();
  const [email,   setEmail]   = useState("");
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/subscribers`, {
        email: email.trim(),
        name:  name.trim(),
      });
      if (res.data.success) {
        toast.success("🎉 Đăng ký thành công! Bạn sẽ nhận ưu đãi 20% cho đơn đầu tiên.");
        setDone(true);
        setEmail("");
        setName("");
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-xl font-semibold text-gray-800 mb-2">Đăng ký thành công!</p>
        <p className="text-gray-500 text-sm">
          Cảm ơn bạn đã đăng ký. Ưu đãi <strong>20%</strong> sẽ được áp dụng tự động cho đơn hàng đầu tiên của bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-10 px-4">
      <p className="text-2xl font-bold text-gray-800">Đăng ký ngay & nhận ưu đãi 20%</p>
      <p className="text-gray-500 mt-2 mb-6 max-w-md mx-auto text-sm">
        Nhận thông tin khuyến mãi và sản phẩm mới nhất. Ưu đãi <strong>giảm 20%</strong> sẽ được áp dụng tự động cho đơn hàng đầu tiên của bạn.
      </p>
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-xl mx-auto flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          placeholder="Họ và tên"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
        <input
          type="email"
          placeholder="Email của bạn *"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 whitespace-nowrap text-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang đăng ký...
            </span>
          ) : (
            "Đăng ký"
          )}
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-3">
        * Ưu đãi 20% chỉ áp dụng cho đơn hàng đầu tiên. Bạn có thể hủy đăng ký bất cứ lúc nào.
      </p>
    </div>
  );
};

export default NewsLetterBox;
