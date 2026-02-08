export class CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export class Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;

  get total(): number {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get totalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

export interface CartData {
  id: string;
  userId?: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}