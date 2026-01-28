import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

const useShopContext = () => {
    return useContext(ShopContext);
}

export default useShopContext;