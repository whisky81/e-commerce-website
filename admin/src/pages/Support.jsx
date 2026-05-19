import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Support = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/admin/support`, { withCredentials: true });
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi tải tin nhắn hỗ trợ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleReply = async (id) => {
        if (!replyText.trim()) return toast.warning("Vui lòng nhập nội dung phản hồi");
        
        try {
            const res = await axios.patch(`${backendUrl}/api/admin/support/${id}/reply`, { reply: replyText }, { withCredentials: true });
            if (res.data.success) {
                toast.success("Đã gửi phản hồi");
                setReplyingTo(null);
                setReplyText("");
                fetchMessages();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi gửi phản hồi");
        }
    };

    if (loading) return <div className="text-center py-10">Đang tải...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Hỗ trợ Khách hàng</h1>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {messages.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Chưa có yêu cầu hỗ trợ nào</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {messages.map((msg) => (
                            <div key={msg._id} className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{msg.user?.name} <span className="text-slate-500 font-normal">({msg.user?.email})</span></h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Đơn hàng: {msg.order?.code ? (
                                                <Link to={`/orders?search=${msg.order.code}`} className="font-medium text-blue-600 hover:underline" title="Xem chi tiết đơn hàng">
                                                    {msg.order.code}
                                                </Link>
                                            ) : (
                                                <span className="font-medium text-slate-400">N/A</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">{new Date(msg.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${msg.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {msg.status === 'resolved' ? 'Đã giải quyết' : 'Chờ xử lý'}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg mb-4 text-slate-700 text-sm">
                                    <p className="font-semibold mb-1">Khách hàng hỏi:</p>
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                </div>

                                {msg.status === 'resolved' ? (
                                    <div className="bg-blue-50 p-4 rounded-lg text-slate-700 text-sm border border-blue-100">
                                        <p className="font-semibold mb-1 text-blue-800">Admin trả lời:</p>
                                        <p className="whitespace-pre-wrap">{msg.reply}</p>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        {replyingTo === msg._id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    rows="3"
                                                    placeholder="Nhập nội dung phản hồi..."
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setReplyingTo(null)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Hủy</button>
                                                    <button onClick={() => handleReply(msg._id)} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">Gửi phản hồi</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setReplyingTo(msg._id); setReplyText(""); }} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                Trả lời
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Support;
