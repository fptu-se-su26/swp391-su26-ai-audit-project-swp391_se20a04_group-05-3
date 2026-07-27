import { useAppContext } from "../context/AppContext";

export const useCart = () => {
  const { cart, cartSubtotal, addToCart, updateCartQuantity, removeFromCart, clearCart } = useAppContext();

  // Use the backend-calculated promotional subtotal directly
  const cartTotal = cartSubtotal;
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
  
  // Computes carbon reductions based on standard GreenLife metrics (avg 1.5kg CO2 offset per organic item)
  const co2OffsetKg = Number((cartItemCount * 1.5).toFixed(1));

  return {
    items: cart,
    cartTotal,
    cartItemCount,
    co2OffsetKg,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
  };
};
export default useCart;
