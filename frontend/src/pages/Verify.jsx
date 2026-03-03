import React, { useEffect } from 'react'
import useShopContext from '../hooks/useShopContext'
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
const Verify = () => {
    const { navigate, isAuthenticated, setCartItems, backendUrl } = useShopContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');

    const verifyPayment = async () => {
        try {
            // if (!token) return;
            const response = await axios.post(
                backendUrl + '/api/v2/orders/verify-stripe',
                { orderId, success },
                { withCredentials: true }
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
    }, [isAuthenticated])
    return (
        <div>
            <p>Success: {success}</p>
            <p>Order ID: {orderId}</p>
        </div>
    )
}

export default Verify
