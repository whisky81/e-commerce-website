import IShippingAdapter from "./IShippingAdaper.js";
import ThirdPartyServiceError from "../../errors/ThirdPartyServiceError.js";


class GhnAdapter extends IShippingAdapter {
    constructor(baseUrl, tokenId, clientId, shops) {
        super();
        this.tokenId = tokenId;
        this.clientId = clientId;
        this.shops = shops || [];
        this.baseUrl = baseUrl;
    }
    static async create(baseUrl, tokenId, clientId, offset = 0, limit = 50, clientPhone = null) {
        // fetch shops 
        const response = await fetch(
            "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shop/all",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Token: tokenId,
                },
                body: JSON.stringify({
                    offset,
                    limit,
                    client_phone: clientPhone,
                }),
            }
        );
        if (!response.ok) {
            throw new ThirdPartyServiceError("Api Error", "ghn");
        }
        const data = await response.json();
        const shops = data.data?.shops?.map(shop => ({
            id: shop._id,
            name: shop.name,
            phone: shop.phone,
            address: shop.address,
            wardCode: shop.ward_code,
            districtId: shop.district_id,
            createdDate: shop.created_date
        }));
        return new GhnAdapter(baseUrl, tokenId, clientId, shops);
    }
    async provinces() {
        const response = await fetch(
            "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province",
            {
                method: "GET",
                headers: {
                    Token: this.tokenId
                }
            }
        );
        if (!response.ok) {
            throw new ThirdPartyServiceError("Api Error", "ghn");
        }
        const data = await response.json();
        if (!data?.code || !(data.code >= 200 && data.code < 300)) {
            return {
                success: false,
                message: data?.message
            }
        }
        const provinces = data.data?.map(o => ({
            id: o.ProvinceID,
            name: o.ProvinceName,
            nameExtension: o.NameExtension,
            status: o.Status === 1
        }))
        return {
            success: true,
            message: data.message,
            data: provinces || []
        }
    }
    async districts(provinceId) {
        const response = await fetch(
            "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district",
            {
                method: "POST",
                headers: {
                    token: this.tokenId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    province_id: provinceId,
                }),
            }
        );
        if (!response.ok) {
            throw new ThirdPartyServiceError("Api Error", "ghn");
        }
        const data = await response.json();
        if (!data?.code || !(data.code >= 200 && data.code < 300)) {
            return {
                success: false,
                message: data?.message
            }
        }
        const districts = data.data?.map(o => ({
            id: o.DistrictID,
            provinceId: o.ProvinceID,
            name: o.DistrictName,
            nameExtension: o.NameExtension,
            status: o.Status === 1
        }))
        return {
            success: true,
            message: data.message,
            data: districts
        }
    }
    async wards(districtId) {
        const response = await fetch(
            "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward",
            {
                method: "POST",
                headers: {
                    token: this.tokenId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    district_id: districtId,
                }),
            }
        );
        if (!response.ok) {
            throw new ThirdPartyServiceError("Api Error", "ghn");
        }
        const data = await response.json();
        if (!data?.code || !(data.code >= 200 && data.code < 300)) {
            return {
                success: false,
                message: data?.message
            }
        }
        const wards = data.data?.map(o => ({
            id: o.WardCode,
            districtID: o.DistrictID,
            name: o.WardName,
            nameExtension: o.NameExtension,
            status: o.Status === 1
        }));
        return {
            success: true,
            message: data.message,
            data: wards
        }
    }
    /**
     * Calculate shipping fee before placing order
     */
    async calcShippingFee(
        serviceType = 2,
        shopIdx = 0,
        toWard, toDistrict,
        weight, length, width, height,
        items
    ) {
        const payload = {
            service_type_id: serviceType,
            to_district_id: toDistrict,
            to_ward_code: toWard,
            weight, length, width, height,
            items: items.map(item => ({
                name: item.name,
                quantity: item.quantity
            })),
        };
        const response = await fetch(
            "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Token: this.tokenId,
                    ShopId: this.shops[shopIdx].id,
                },
                body: JSON.stringify(payload),
            }
        );
        console.log(payload);
        if (!response.ok) {
            throw new ThirdPartyServiceError("Api Error", "ghn");
        }
        const data = await response.json();
        if (!data?.code || !(data.code >= 200 && data.code < 300)) {
            return {
                success: false,
                message: data?.message
            }
        }
        return {
            success: true,
            message: data.message,
            data: {
                total: data.data?.total,
                serviceFee: data.data?.service_fee
            }
        }
    }
    /**
     * service id - service type
     * 53320 - 2 | light item 
     * 100039 - 5 | heavy item
     */
    async estimateDeliveryTime(
        shopIdx = 0,
        toDistrict,
        toWard,
        serviceId = 53320
    ) {
        const response = await fetch(
            "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/leadtime",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ShopId: this.shops[shopIdx].id,
                    Token: this.tokenId,
                },
                body: JSON.stringify({
                    from_district_id: this.shops[shopIdx].districtId,
                    from_ward_code: this.shops[shopIdx].wardCode,
                    to_district_id: toDistrict,
                    to_ward_code: toWard,
                    service_id: serviceId,
                }),
            }
        );
        if (!response.ok) {
            throw new ThirdPartyServiceError("Api Error", "ghn");
        }
        const data = await response.json();
        const leadtime = data.data.leadtime;
        const diffMs = new Date(leadtime * 1000).getTime() - Date.now();
        const days = Math.floor(diffMs / 86400000);
        const hours = Math.floor((diffMs % 86400000) / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return {
            success: true,
            message: data.message,
            data: {
                leadtime,
                deliveryTimeRemaining: {
                    days,
                    hours,
                    minutes
                }
            }
        }
    }
    async placeOrder(shopIdx = 0, order) {
        const isCOD = order.payment.method === "cod";
        const toAddress = order.shippingAddress.street + ", " 
                        + order.shippingAddress.wardName + ", "
                        + order.shippingAddress.districtName + ", "
                        + order.shippingAddress.provinceName;
        const codAmount = Math.min(isCOD ? (order.fee.subtotal - order.fee.discount) : 0, 50_000_000);
        const payload = {
            to_name: order.shippingAddress.fullName,
            to_phone: order.shippingAddress.phone,
            to_address: toAddress,
            to_ward_name: order.shippingAddress.wardName,
            to_district_name: order.shippingAddress.districtName,
            to_province_name: order.shippingAddress.provinceName,
            cod_amount: codAmount,
            payment_type_id: isCOD ? 2 : 1,
            service_type_id: 2,
            required_note: 'KHONGCHOXEMHANG',
            weight: Math.min(order.package.weight, 50_000),
            length: Math.min(order.package.length, 200),
            width: Math.min(order.package.width, 200),
            height: Math.min(order.package.height, 200),
            insurance_value: Math.min(order.fee.subtotal, 5_000_000), // <= 5_000_000
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
        };
        const res = await fetch(
            'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create', 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Token: this.tokenId,
                    ShopId: this.shops[shopIdx].id,
                },
                body: JSON.stringify(payload),
            }
        )
        const data = await res.json()
        if (data.code !== 200) throw new ThirdPartyServiceError("Place order error", "ghn");
        // normalize place order response
        // return data.data;
        return {
            order: order._id,
            providerOrderCode: data.data.order_code,
            clientOrderCode: order.code,
            fee: {
                total: data.data.total_fee,
                main: data.data.fee.main_service,
                insurance: data.data.fee.insurance
            },
            expectedDelivery: new Date(data.data.expected_delivery_time),
            lastResponse: data.data
        }
    }
    /**
     * @link https://api.ghn.vn/home/docs/detail?id=99
     * @returns {Object} {
            "code": 200,
            "message": "Success",
            "data": {
                "shop_id": 200275,
                "client_id": 2511534,
                "return_name": "Sưởng Ly",
                "return_phone": "0372307991",
                "return_address": "96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội, Vietnam",
                "return_ward_code": "1B1507",
                "return_district_id": 1542,
                "return_location": {
                    "lat": 20.980646,
                    "long": 105.787634,
                    "cell_code": "00000000",
                    "place_id": "TLJaTpABBk92Ejobs4M8",
                    "trust_level": 5,
                    "wardcode": "1B1507",
                    "map_source": "ahamove"
                },
                "from_name": "Sưởng Ly",
                "from_phone": "0372307991",
                "from_hotline": "",
                "from_address": "96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội, Vietnam",
                "from_ward_code": "1B1507",
                "from_district_id": 1542,
                "from_location": {
                    "lat": 20.980646,
                    "long": 105.787634,
                    "cell_code": "00000000",
                    "place_id": "TLJaTpABBk92Ejobs4M8",
                    "trust_level": 5,
                    "wardcode": "1B1507",
                    "map_source": "ahamove"
                },
                "deliver_station_id": 0,
                "to_name": "test name",
                "to_phone": "0321123999",
                "to_address": "Xã Mông Ân, Huyện Bảo Lâm, Cao Bằng",
                "to_ward_code": "61204",
                "to_district_id": 1890,
                "to_location": {
                    "lat": 22.8126769,
                    "long": 105.5357139,
                    "cell_code": "00000000",
                    "place_id": "7SNfTpABX97k1KSKhRoz",
                    "trust_level": 5,
                    "wardcode": "61204",
                    "map_source": "google"
                },
                "weight": 30,
                "length": 40,
                "width": 20,
                "height": 10,
                "converted_weight": 1600,
                "calculate_weight": 1600,
                "image_ids": null,
                "service_type_id": 5,
                "service_id": 100039,
                "payment_type_id": 2,
                "payment_type_ids": [
                    2
                ],
                "custom_service_fee": 0,
                "sort_code": "PRI-A-05-00",
                "cod_amount": 100000,
                "cod_collect_date": null,
                "cod_transfer_date": null,
                "is_cod_transferred": false,
                "is_cod_collected": false,
                "insurance_value": 0,
                "order_value": 0,
                "pick_station_id": 0,
                "client_order_code": "",
                "cod_failed_amount": 0,
                "cod_failed_collect_date": null,
                "required_note": "KHONGCHOXEMHANG",
                "content": "test [3 kiện]",
                "note": "",
                "employee_note": "",
                "seal_code": "",
                "pickup_time": "2026-05-12T14:45:23.384Z",
                "request_delivery_time": null,
                "deadline_pickup_time": null,
                "items": [
                    {
                        "name": "test",
                        "quantity": 3,
                        "length": 10,
                        "width": 20,
                        "height": 40,
                        "category": {},
                        "weight": 30,
                        "calculate_weight": 1600,
                        "convert_weight": 1600,
                        "status": "ready_to_pick",
                        "item_order_code": "LXFDFT_1",
                        "current_warehouse_id": 2461
                    }
                ],
                "coupon": "",
                "coupon_campaign_id": 0,
                "_id": "6a033d03fc138605b85ff3e3",
                "order_code": "LXFDFT",
                "version_no": "05b9c5b3-28f0-4eff-818a-d7ccad001fbf",
                "updated_ip": "27.79.150.94",
                "updated_employee": 0,
                "updated_client": 2511534,
                "updated_source": "shiip",
                "updated_date": "2026-05-12T14:45:23.383Z",
                "updated_warehouse": 0,
                "created_ip": "27.79.150.94",
                "created_employee": 0,
                "created_client": 2511534,
                "created_source": "shiip",
                "created_date": "2026-05-12T14:45:23.383Z",
                "status": "ready_to_pick",
                "internal_process": {
                    "status": "",
                    "type": ""
                },
                "pick_warehouse_id": 2461,
                "deliver_warehouse_id": 1167,
                "current_warehouse_id": 2461,
                "return_warehouse_id": 1303,
                "next_warehouse_id": 0,
                "last_warehouse_change_reason": "",
                "current_transport_warehouse_id": 0,
                "leadtime": "2026-05-15T16:59:59Z",
                "leadtime_order": {
                    "from_estimate_date": "2026-05-15T16:59:59Z",
                    "to_estimate_date": "2026-05-16T16:59:59Z"
                },
                "order_date": "2026-05-12T14:45:23.384Z",
                "data": {},
                "soc_id": "6a033d03fc138605b85ff3e2",
                "finish_date": null,
                "tag": [
                    "truck"
                ],
                "is_partial_return": false,
                "is_document_return": false,
                "pickup_shift": {},
                "transaction_ids": [
                    "de0555af-50d0-4aaf-95d2-03cf57c606c6"
                ],
                "transportation_status": "",
                "transportation_phase": "",
                "extra_service": {
                    "document_return": null,
                    "double_check": false,
                    "lastmile_ahamove_bulky": false,
                    "lastmile_trip_code": "",
                    "original_deliver_warehouse_id": 0
                },
                "config_fee_id": "686237b57735fdd61f22d642",
                "extra_cost_id": "668ba9a47c8d5f119036bf47",
                "standard_config_fee_id": "",
                "standard_extra_cost_id": "",
                "ecom_config_fee_id": 0,
                "ecom_extra_cost_id": 0,
                "ecom_standard_config_fee_id": 0,
                "ecom_standard_extra_cost_id": 0,
                "is_b2b": false,
                "gxt_type": {
                    "pick": "",
                    "delivery": "",
                    "return": ""
                },
                "operation_partner": "",
                "process_partner_name": "",
                "type_order": "freight",
                "type_order_code": "FSME",
                "delivery_days_of_week": 127,
                "is_new_multiple": false,
                "from_address_v2": "",
                "from_ward_id_v2": 0,
                "from_province_id_v2": 0,
                "is_new_from_address": false,
                "to_address_v2": "",
                "to_ward_id_v2": 0,
                "to_province_id_v2": 0,
                "is_new_to_address": false,
                "return_address_v2": "",
                "return_ward_id_v2": 0,
                "return_province_id_v2": 0,
                "is_new_return_address": false
            }
        }
     */
    async getOrderDetails(orderCode) {
        const response = await fetch(
            "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Token: this.tokenId,
                },
                body: JSON.stringify({
                    order_code: orderCode,
                }),
            }
        );

        if (!response.ok) {
            throw new ThirdPartyServiceError("Api Error", "ghn");
        }
        const data = await response.json();
        return data.data;
    }
    /**
     * @link https://api.ghn.vn/home/docs/detail?id=102
     */
    async cancelOrder(shopIdx  = 0, orderCodes = []) {
        const response = await fetch(
            "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/switch-status/cancel",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ShopId: this.shops[shopIdx].id,
                    Token: this.tokenId,
                },
                body: JSON.stringify({
                    order_codes: orderCodes,
                }),
            }
        );
        if (!response.ok) {
            throw new Error(`GHN API Error: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        return data.code === 200;
    }
}

export default GhnAdapter;