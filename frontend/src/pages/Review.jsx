// frontend/src/pages/Review.jsx
import { useState, useRef } from 'react';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';
import useShopContext from '../hooks/useShopContext';

const ProductReviews = ({ reviews, setReviews, productId }) => {
    const { backendUrl } = useShopContext();
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const reviewsPerPage = 5;

    const [submitting, setSubmitting] = useState(false);
    const [newReview, setNewReview] = useState({
        rating: 0,
        comment: '',
        media: []
    });
    const [hoverRating, setHoverRating] = useState(0);
    const fileInputRef = useRef(null);

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
        rating: star,
        count: reviews.filter(r => Math.floor(r.rating) === star).length,
        percentage: reviews.length > 0
            ? (reviews.filter(r => Math.floor(r.rating) === star).length / reviews.length * 100).toFixed(0)
            : 0
    }));

    const getSortedReviews = () => {
        let sorted = [...reviews];
        switch (sortBy) {
            case 'highest':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'lowest':
                return sorted.sort((a, b) => a.rating - b.rating);
            case 'withMedia':
                return sorted.filter(r => r.media?.length > 0);
            case 'newest':
            default:
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    };

    const sortedReviews = getSortedReviews();
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = sortedReviews.slice(indexOfFirstReview, indexOfLastReview);
    const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (newReview.rating === 0) {
            toast.warning('Vui lòng chọn số sao đánh giá');
            return;
        }

        if (newReview.media.length > 2) {
            toast.warning('Chỉ được tải lên tối đa 2 file');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
        const invalidFiles = newReview.media.filter(file => !validTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            toast.warning('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF) hoặc video (MP4, MOV)');
            return;
        }

        for (let file of newReview.media) {
            const maxSize = file.type.startsWith('video/') ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
            if (file.size > maxSize) {
                toast.warning(`File ${file.name} vượt quá kích thước cho phép (${file.type.startsWith('video/') ? '10MB' : '5MB'})`);
                return;
            }
        }

        try {
            const formData = new FormData();
            formData.append("productId", productId);
            formData.append("rating", newReview.rating);
            formData.append("comment", newReview.comment);
            // FIX: was appending both files as "media1"; second file must be "media2"
            if (newReview.media[0]) formData.append("media1", newReview.media[0]);
            if (newReview.media[1]) formData.append("media2", newReview.media[1]);

            let response = await axios.post(
                backendUrl + "/api/reviews",
                formData,
                { withCredentials: true }
            );
            if (!response.data.success) {
                throw new Error(response.data.message);
            }
            response = await axios.get(
                backendUrl + `/api/products/${productId}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setReviews(response.data.data.reviews || response.data.data);
            }
            setNewReview({ rating: 0, comment: '', media: [] });
            setShowReviewForm(false);
            toast.success('Đánh giá của bạn đã được gửi thành công!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setNewReview(prev => ({
            ...prev,
            media: [...prev.media, ...files].slice(0, 2)
        }));
    };

    const removeFile = (index) => {
        setNewReview(prev => ({
            ...prev,
            media: prev.media.filter((_, i) => i !== index)
        }));
    };

    const MediaPreview = ({ file, index }) => {
        const isVideo = file.type?.startsWith('video/');
        const url = URL.createObjectURL(file);

        return (
            <div className="relative group">
                {isVideo ? (
                    <video src={url} className="w-20 h-20 object-cover rounded-lg border" />
                ) : (
                    <img src={url} alt="preview" className="w-20 h-20 object-cover rounded-lg border" />
                )}
                <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full 
                     text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 
                     transition-opacity"
                >
                    ×
                </button>
            </div>
        );
    };

    return (
        <div className="border-x border-b px-6 py-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-center">
                        <p className="text-4xl font-bold text-gray-800">{averageRating}</p>
                        <p className="text-sm text-gray-500 whitespace-nowrap">trên 5</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 mb-1 flex-wrap">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <img
                                    key={star}
                                    src={star <= Math.round(averageRating) ? assets.star_icon : assets.star_dull_icon}
                                    alt=""
                                    className="w-4 h-4"
                                />
                            ))}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-nowrap">
                            {reviews.length} đánh giá từ khách hàng
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     transition-colors whitespace-nowrap"
                >
                    {showReviewForm ? 'Hủy' : 'Viết đánh giá'}
                </button>
            </div>

            {/* Form */}
            {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-3">Viết đánh giá của bạn</h3>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chất lượng sản phẩm *
                        </label>
                        <div className="flex items-center gap-1 flex-wrap">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview({ ...newReview, rating: star })}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none"
                                >
                                    <img
                                        src={star <= (hoverRating || newReview.rating)
                                            ? assets.star_icon
                                            : assets.star_dull_icon}
                                        alt={`${star} star`}
                                        className="w-6 h-6"
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-500 whitespace-nowrap">
                                {newReview.rating > 0 ? `${newReview.rating} sao` : 'Chọn số sao'}
                            </span>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nhận xét của bạn *
                        </label>
                        <textarea
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            rows="3"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 
                         focus:ring-blue-500"
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hình ảnh / Video (tối đa 2 file)
                        </label>
                        <div className="flex items-center gap-3 flex-wrap">
                            {newReview.media.map((file, index) => (
                                <MediaPreview key={index} file={file} index={index} />
                            ))}

                            {newReview.media.length < 2 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-20 h-20 border-2 border-dashed border-gray-300 
                             rounded-lg flex flex-col items-center justify-center 
                             hover:border-blue-500 transition-colors"
                                >
                                    <span className="text-2xl text-gray-400">+</span>
                                    <span className="text-xs text-gray-500">Tải lên</span>
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Chấp nhận: JPEG, PNG, GIF, MP4, MOV (Ảnh tối đa 5MB, Video tối đa 10MB)
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 
                       transition-colors whitespace-nowrap"
                    >
                        Gửi đánh giá
                    </button>
                </form>
            )}

            {/* Rating Distribution */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Phân bố đánh giá</h4>
                <div className="space-y-2">
                    {ratingDistribution.map((item) => (
                        <div key={item.rating} className="flex items-center gap-2 flex-wrap">
                            <span className="w-8 text-sm text-gray-600 whitespace-nowrap">{item.rating} sao</span>
                            <div className="flex-1 min-w-25 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                            <span className="w-10 text-xs text-gray-500 whitespace-nowrap">{item.count} đánh giá</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sort controls */}
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <p className="text-sm text-gray-600 whitespace-nowrap">
                    Hiển thị {indexOfFirstReview + 1}-{Math.min(indexOfLastReview, sortedReviews.length)}
                    {' '}trên {sortedReviews.length} đánh giá
                </p>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 
                     focus:ring-blue-500 whitespace-nowrap"
                >
                    <option value="newest">Mới nhất</option>
                    <option value="highest">Đánh giá cao nhất</option>
                    <option value="lowest">Đánh giá thấp nhất</option>
                    <option value="withMedia">Có hình ảnh/video</option>
                </select>
            </div>

            {/* Reviews list */}
            {reviews.length > 0 ? (
                <div className="space-y-6">
                    {currentReviews.map((review) => (
                        <div key={review._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start gap-3 mb-3 flex-wrap">
                                <img
                                    src={review.user?.avatar?.url || assets.default_avatar}
                                    alt="avatar"
                                    className="w-10 h-10 rounded-full object-cover shrink-0"
                                />
                                <div className="flex-1 min-w-50">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="font-medium text-gray-800">{review.user?.name}</p>
                                        {review.user?.purchaseCount > 0 && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">
                                                Đã mua hàng
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <img
                                                    key={star}
                                                    src={star <= review.rating ? assets.star_icon : assets.star_dull_icon}
                                                    alt=""
                                                    className="w-3 h-3"
                                                />
                                            ))}
                                        </div>
                                        <p className="text-gray-400 text-xs whitespace-nowrap">
                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-700 mb-3 wrap-break-word">{review.comment}</p>

                            {review.media && review.media.length > 0 && (
                                <div className="flex gap-2 mb-3 flex-wrap">
                                    {review.media.map((item, index) => (
                                        <div key={index} className="relative group">
                                            {item.isVideo ? (
                                                <video
                                                    src={item.url}
                                                    className="w-24 h-24 object-cover rounded-lg border cursor-pointer 
                                     hover:opacity-80 transition-opacity"
                                                    onClick={() => window.open(item.url, '_blank')}
                                                />
                                            ) : (
                                                <img
                                                    src={item.url}
                                                    alt="review media"
                                                    className="w-24 h-24 object-cover rounded-lg border cursor-pointer 
                                     hover:opacity-80 transition-opacity"
                                                    onClick={() => window.open(item.url, '_blank')}
                                                />
                                            )}
                                            <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/50 
                                       text-white text-xs rounded">
                                                {item.isVideo ? '🎥' : '📷'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                                <button className="flex items-center gap-1 hover:text-blue-500 transition-colors whitespace-nowrap">
                                    <span>👍</span>
                                    <span>Hữu ích ({review.helpful || 0})</span>
                                </button>
                                <button className="hover:text-blue-500 transition-colors whitespace-nowrap">
                                    Trả lời
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded-lg disabled:opacity-50 
                           disabled:cursor-not-allowed hover:bg-gray-50 transition-colors whitespace-nowrap"
                            >
                                Trước
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg ${currentPage === i + 1
                                            ? 'bg-blue-500 text-white'
                                            : 'border hover:bg-gray-50'
                                        } transition-colors`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded-lg disabled:opacity-50 
                           disabled:cursor-not-allowed hover:bg-gray-50 transition-colors whitespace-nowrap"
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Hãy là người đầu tiên đánh giá sản phẩm!
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProductReviews;
