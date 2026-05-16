import { useContext } from "react";
import { ShopContext } from "../context/ShopContextDef";

const useShopContext = () => {
    return useContext(ShopContext);
}

export default useShopContext;