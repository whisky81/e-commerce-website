import React, { useEffect } from 'react'
import useShopContext from '../hooks/useShopContext'
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
const Verify = () => {
    const { navigate, token, setCartItems, backendUrl } = useShopContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');

    const verifyPayment = async () => {
        try {
            if (!token) return;
            const response = await axios.post(
                backendUrl + '/api/order/verify-stripe',
                { orderId, success },
                { headers: { token } }
            )
            if (response.data.success) {
                toast.success(response.data.message);
                setCartItems({})
                navigate('/orders')
            } else {
                toast.error(response.data.message);
                navigate('/cart')
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    useEffect(() => {
        verifyPayment();
    }, [token])
    return (
        <div>

        </div>
    )
}

export default Verify
