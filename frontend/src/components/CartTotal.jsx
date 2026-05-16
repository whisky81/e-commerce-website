import React from 'react'
import useShopContext from '../hooks/useShopContext'
import Title from './Title'
import { formatDate, formatDeliveryCountdown } from '../utils/formats'

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n ?? 0)

/**
 * @param {{
 *   items?: Array<{ price:number, originalPrice?:number, quantity:number }>,
 *   preview?: null | {
 *     fee: { subtotal:number, shipping:number, discount?:number, total:number },
 *     estimatedDeliveryTime?: string|null,
 *     deliveryTimeRemaining?: { days?:number, hours?:number, minutes?:number } | null,
 *     warnings?: unknown[],
 *   },
 * }} props
 */
const CartTotal = ({ items, preview }) => {
  const { cartItems, deliveryFee } = useShopContext()

  const cartData = items ?? Object.values(cartItems)
  const subtotal = cartData.reduce((acc, item) => acc + item.quantity * item.price, 0)
  const originalSubtotal = cartData.reduce(
    (acc, item) => acc + item.quantity * (item.originalPrice || item.price),
    0,
  )

  const feeObj = preview?.fee
  const showPreview = !!(
    feeObj &&
    typeof feeObj === 'object' &&
    typeof feeObj.total === 'number'
  )

  const displaySubtotal = showPreview ? feeObj.subtotal ?? 0 : subtotal
  const displayShipping = showPreview ? feeObj.shipping ?? 0 : subtotal > 0 ? deliveryFee : 0
  const discount = showPreview ? feeObj.discount ?? 0 : 0
  const total = showPreview ? feeObj.total : subtotal > 0 ? subtotal + deliveryFee : 0
  const savings =
    showPreview && discount > 0 ? discount : !showPreview ? originalSubtotal - subtotal : 0

  let etaSection = null
  if (
    showPreview &&
    preview &&
    (preview.estimatedDeliveryTime ||
      preview.deliveryTimeRemaining != null ||
      preview.warnings?.length)
  ) {
    const etaIso = preview.estimatedDeliveryTime
    const etaFmt =
      typeof etaIso === 'string'
        ? formatDate(etaIso)
        : etaIso instanceof Date && !Number.isNaN(+etaIso)
          ? formatDate(etaIso)
          : ''
    const countdown = formatDeliveryCountdown(preview.deliveryTimeRemaining)
    etaSection = (
      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-1">
        {(etaFmt || countdown) && <p className="font-semibold text-gray-800">Ước tính giao hàng</p>}
        {etaFmt && <p>Giao khoảng: {etaFmt}</p>}
                    {countdown && (
                      <p className="mt-1 text-gray-600">{countdown}</p>
                    )}
        {preview.warnings?.length ? (
          <ul className="list-disc pl-4 text-amber-800">
            {preview.warnings.map((w, i) => (
              <li key={i}>{typeof w === 'string' ? w : w?.message ?? String(w)}</li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={'Đơn hàng'} text2={'Thanh toán'} />
      </div>
      {showPreview && (
        <p className="text-xs text-indigo-600 mt-2">
          Tam tính, phí ship và tổng theo GHN và địa chỉ đã chọn (API xem trước đơn)
        </p>
      )}
      <div className="flex flex-col gap-2 mt-2 text-sm">
        <div className="flex justify-between">
          <p className="text-gray-600">Tạm tính</p>
          <p className="font-medium">{fmt(displaySubtotal)}</p>
        </div>
        {savings > 0 && (
          <div className="flex justify-between">
            <p className="text-emerald-600">{showPreview ? 'Giảm giá' : 'Tiết kiệm'}</p>
            <p className="font-medium text-emerald-600">
              -{fmt(savings)}
            </p>
          </div>
        )}
        <hr />
        <div className="flex justify-between">
          <p className="text-gray-600">Phí vận chuyển</p>
          <p className="font-medium">
            {(showPreview ? displaySubtotal > 0 : subtotal > 0) ? fmt(displayShipping) : '—'}
          </p>
        </div>
        <hr />
        <div className="flex justify-between font-semibold text-base">
          <p>Tổng cộng</p>
          <p className="text-blue-600">{fmt(total)}</p>
        </div>
      </div>
      {etaSection}
    </div>
  )
}

export default CartTotal
