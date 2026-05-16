import GhnAdapter from "../adapters/shipping/GhnAdapter.js";
import ThirdPartyServiceError from "../errors/ThirdPartyServiceError.js";
const connectShippingProvider = async (serviceName = 'ghn') => {
    try {
        const shippingProvider = await GhnAdapter.create("", process.env.GHN_TOKEN, process.env.GHN_CLIENT_ID);
        console.log(`Shipping service connected ${serviceName}`);
        return shippingProvider;
    } catch (error) {
        throw new ThirdPartyServiceError("Shipping service error", "ghn");
    }
}

const shippingProvider = await connectShippingProvider('ghn');
export default shippingProvider;