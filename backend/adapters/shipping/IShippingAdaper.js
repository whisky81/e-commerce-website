class IShippingAdapter {
    async provinces() { throw new Error('Not implemented'); }
    async districts(provinceId) { throw new Error('Not implemented'); }
    async wards(districtId) { throw new Error('Not implemented'); }
    /**
     * Calculate shipping fee before placing order
     */
    async calcShippingFee(
        serviceType = 2, 
        shopIdx = 0,
        toWard, toDistrict, 
        weight, length, width, height,
        items
    ) { throw new Error('Not implemented'); }
    async estimateDeliveryTime(shopIdx = 0,
        toDistrict,
        toWard,
        serviceId = 53320) { throw new Error('Not implemented'); }
    async getOrderDetails(orderCode) { throw new Error('Not implemented'); }
    async cancelOrder(shopIdx = 0, orderCodes = []) { throw new Error('Not implemented'); }
    async placeOrder(shopIdx = 0, order) { throw new Error('Not implemented'); }
}

export default IShippingAdapter;