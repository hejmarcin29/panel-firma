import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from "sonner";

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  image: string | null;
  pricePerUnit: number; // Cena za sztukę/opakowanie
  vatRate: number; // np. 0.23
  quantity: number; // Ilość sztuk/opakowań
  
  // Specific for flooring
  unit: string; // 'm2', 'szt', 'op'
  packageSize: number; // Ile m2 w paczce (jeśli dotyczy)
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean; // Stan otwarcia bocznego panelu (Sheet)
  
  addItem: (item: CartItem) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setOpen: (open: boolean) => void;
  
  // Computed
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const items = get().items;
        
        // Validation: Block mixing samples and regular products
        const isNewSample = newItem.productId.startsWith('sample_');
        const hasSamples = items.some(i => i.productId.startsWith('sample_'));
        const hasRegular = items.some(i => !i.productId.startsWith('sample_'));

        if (items.length > 0) {
            if (isNewSample && hasRegular) {
                toast.error("Nie można łączyć próbek z produktami paletowymi. Złóż osobne zamówienia.");
                return false;
            }
            if (!isNewSample && hasSamples) {
                toast.error("Nie można łączyć produktów paletowych z próbkami. Złóż osobne zamówienia.");
                return false;
            }
        }

        const existingItem = items.find((i) => i.productId === newItem.productId);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.productId === newItem.productId
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
            isOpen: true, // Otwórz koszyk po dodaniu
          });
        } else {
          set({ items: [...items, newItem], isOpen: true });
        }
        return true;
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set({ isOpen: !get().isOpen }),
      setOpen: (open) => set({ isOpen: open }),

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.pricePerUnit * item.quantity,
          0
        );
      },
      
      // New helper to get Cart Type
      getCartType: () => {
          const items = get().items;
          if (items.length === 0) return 'empty';
          return items.some(i => i.productId.startsWith('sample_')) ? 'sample' : 'production';
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Pomiń zapisywanie stanu 'isOpen' w localStorage
      partialize: (state) => ({ items: state.items }),
    }
  )
);
