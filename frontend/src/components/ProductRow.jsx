import { Link } from "react-router-dom";
import { formatPrice } from "../utils/formats";
const ProductRow = ({ image, name, productId, price, quantity }) => {
    return (<div className='flex flex-col sm:flex-row sm:items-center gap-4 py-2 border-b last:border-0'>
        <img
            className="w-20 h-20 object-cover rounded"
            src={image}
            alt={name}
        />
        <div className='flex-1'>
            <p className='font-medium text-gray-800 line-clamp-2'><Link to={`/product/${productId}`}>{name}</Link></p>
            <div className='flex flex-wrap items-center gap-4 mt-2 text-sm'>
                <p className='text-blue-600 font-semibold'>{formatPrice(price)}</p>
                <p className='text-gray-600'>Số lượng: {quantity}</p>
                <p className='text-gray-800'>Tổng: {formatPrice(price * quantity)}</p>
            </div>
        </div>
    </div>)
}

export default ProductRow;