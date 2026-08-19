// components/restaurant/pos/pos.store.ts
import { create } from "zustand";
import type { CartItem , FulfillmentType, PaymentMethod } from "@/utils/pos.types";

interface PosStore {
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem["menuItem"]) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, diff: number) => void;
  clearCart: () => void;

  // Checkout
  discountPct: number;
  setDiscount: (value: number) => void;
  fulfillmentType: FulfillmentType;
  setFulfillmentType: (type: FulfillmentType) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
 
  // Settlement
  selectedSettleOrderId: string | null;
  setSelectedSettleOrder: (id: string | null) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
}

export const usePosStore = create<PosStore>((set) => ({
  // -----------------
  // CART
  // -----------------

  cart: [],
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(
        (cartItem) => cartItem.menuItem.id === item.id,
      );

      if (existing) {
        return {
          cart: state.cart.map((cartItem) =>
            cartItem.menuItem.id === item.id
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + 1,
                }
              : cartItem,
          ),
        };
      }

      return {
        cart: [
          ...state.cart,
          {
            menuItem: item,
            quantity: 1,
          },
        ],
      };
    }),

  removeFromCart: (itemId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.menuItem.id !== itemId),
    })),

  updateQuantity: (itemId, diff) =>
    set((state) => ({
      cart: state.cart
        .map((item) => {
          if (item.menuItem.id !== itemId) return item;

          return {
            ...item,

            quantity: item.quantity + diff,
          };
        })

        .filter((item) => item.quantity > 0),
    })),

  clearCart: () =>
    set({
      cart: [],

      discountPct: 0,

      customerName: "Customer",
    }),

  // -----------------
  // CHECKOUT
  // -----------------

  discountPct: 0,

  setDiscount: (value) =>
    set({
      discountPct: value,
    }),

  fulfillmentType: "Takeout",

  setFulfillmentType: (type) =>
    set({
      fulfillmentType: type,
    }),

  customerName: "Customer",

  setCustomerName: (name) =>
    set({
      customerName: name,
    }),

  // -----------------
  // SETTLEMENT
  // -----------------

  selectedSettleOrderId: null,

  setSelectedSettleOrder: (id) =>
    set({
      selectedSettleOrderId: id,
    }),

  paymentMethod: "Cash",

  setPaymentMethod: (method) =>
    set({
      paymentMethod: method,
    }),
}));
