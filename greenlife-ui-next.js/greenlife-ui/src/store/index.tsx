import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Plant } from '@/src/types';

interface CartItem extends Plant {
  quantity: number;
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: Plant[];
  addToCart: (plant: Plant, quantity?: number) => void;
  removeFromCart: (plantId: string) => void;
  updateQuantity: (plantId: string, quantity: number) => void;
  toggleWishlist: (plant: Plant) => void;
  isInWishlist: (plantId: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Plant[]>([]);

  const addToCart = (plant: Plant, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === plant.id);
      if (existing) {
        return prev.map(item => 
          item.id === plant.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...plant, quantity }];
    });
  };

  const removeFromCart = (plantId: string) => {
    setCart(prev => prev.filter(item => item.id !== plantId));
  };

  const updateQuantity = (plantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(plantId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === plantId ? { ...item, quantity } : item
    ));
  };

  const toggleWishlist = (plant: Plant) => {
    setWishlist(prev => {
      if (prev.find(item => item.id === plant.id)) {
        return prev.filter(item => item.id !== plant.id);
      }
      return [...prev, plant];
    });
  };

  const isInWishlist = (plantId: string) => {
    return wishlist.some(item => item.id === plantId);
  };

  return (
    <StoreContext.Provider value={{ cart, wishlist, addToCart, removeFromCart, updateQuantity, toggleWishlist, isInWishlist }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
