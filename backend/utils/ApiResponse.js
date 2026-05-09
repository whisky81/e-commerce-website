class ApiResponse {
    constructor(success, statusCode, message, data, meta) {
        this.success = success;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.meta = meta;
    }
    static success(message = 'Success', data) {
        return new ApiResponse(true, 200, message, data, null);
    }
    static created(data, message = 'Created successfully') {
        return new ApiResponse(true, 201, message, data, null);
    }
    static paginated(data, { optional, page, limit, total }) {
        const meta = {
            ...optional,
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        }
        return new ApiResponse(true, 200, 'Success', data, meta);
    }
    send(res) {
        return res.status(this.statusCode).json(this);
    }
}

export default ApiResponse;