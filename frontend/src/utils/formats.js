export const formatPrice = (price) => {
    const n = Number(price);
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(Number.isFinite(n) ? n : 0);
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/** Một dòng địa chỉ (user hoặc shipping V3 có wardName...) */
export const formatAddressLine = (addr) => {
    if (!addr) return '';
    const w = addr.wardName ?? addr.ward;
    const d = addr.districtName ?? addr.district;
    const p = addr.provinceName ?? addr.province;
    return [addr.street, w, d, p].filter(Boolean).join(', ');
};

/** Thời gian còn lại đến hàng (preview hoặc profile api_v3_docs) */
export const formatDeliveryCountdown = (dtr) => {
    if (dtr == null) return '';
    if (typeof dtr === 'object' && ('days' in dtr || 'hours' in dtr)) {
        const { days = 0, hours = 0, minutes = 0 } = dtr;
        return `≈ ${days} ngày ${hours} giờ ${minutes} phút`;
    }
    return '';
};