// utils/ApiResponse.js — Factory Pattern: chuẩn hoá response toàn bộ app
class ApiResponse {
  constructor(success, statusCode, message, data, meta) {
    this.success   = success;
    this.statusCode = statusCode;
    this.message   = message;
    this.data      = data ?? null;
    this.meta      = meta  ?? null;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Trả về response thành công (200)
   * @param {string} message
   * @param {*}      data
   */
  static success(message = "Success", data) {
    return new ApiResponse(true, 200, message, data ?? null, null);
  }

  /**
   * Trả về response tạo mới thành công (201)
   * @param {*}      data
   * @param {string} message
   */
  static created(data, message = "Created successfully") {
    return new ApiResponse(true, 201, message, data, null);
  }

  /**
   * Trả về response có phân trang (200 + meta pagination)
   * @param {Array}  data
   * @param {{ page, limit, total, optional? }} paginationInfo
   */
  static paginated(data, { page, limit, total, optional = {} }) {
    const meta = {
      ...optional,
      page:       Number(page),
      limit:      Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext:    Number(page) < Math.ceil(total / limit),
      hasPrev:    Number(page) > 1,
    };
    return new ApiResponse(true, 200, "Success", data, meta);
  }

  /**
   * Gửi response về client
   * @param {import('express').Response} res
   */
  send(res) {
    return res.status(this.statusCode).json(this);
  }
}

export default ApiResponse;