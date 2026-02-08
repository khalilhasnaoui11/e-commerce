import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JsonStorageService } from '../storage/json-storage.service';
import { randomUUID } from 'crypto';
import { Cart, CartItem } from './model/cart.model';
import { CreateCartDto, CartItemDto } from './dto/create-cart.dto';
import { UpdateCartDto, UpdateCartItemDto } from './dto/update-cart.dto';
import { Product } from '../products/model/product.model';

@Injectable()
export class CartService {
  private readonly file = 'carts.json';
  private readonly productsFile = 'products.json';

  constructor(private storage: JsonStorageService) {}

  async findAll(): Promise<Cart[]> {
    const cartData = await this.storage.read<any>(this.file);
    return cartData.map(data => this.createCartInstance(data));
  }

  async findOne(id: string): Promise<Cart> {
    const carts = await this.findAll();
    const cart = carts.find(c => c.id === id);
    
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    
    return cart;
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const carts = await this.findAll();
    return carts.find(c => c.userId === userId) || null;
  }

  async create(dto: CreateCartDto): Promise<Cart> {
    const carts = await this.findAll();
    
    const cartData = {
      id: randomUUID(),
      userId: dto.userId || null,
      items: [] as CartItem[],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (dto.items && dto.items.length > 0) {
      await this.addItemsToCart(cartData.id, dto.items);
      const cartsAfterAdd = await this.storage.read<any>(this.file);
      const cartAfterAdd = cartsAfterAdd.find((c: any) => c.id === cartData.id);
      if (cartAfterAdd) {
        cartData.items = cartAfterAdd.items;
      }
    }

    const cart = this.createCartInstance(cartData);
    const allCartsData = await this.storage.read<any>(this.file) || [];
    allCartsData.push(cartData);
    await this.storage.write(this.file, allCartsData);

    return cart;
  }

  async addItem(cartId: string, productId: string, quantity: number = 1): Promise<Cart> {
    const products = await this.storage.read<Product>(this.productsFile);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${product.stock}`);
    }

    const cartsData = await this.storage.read<any>(this.file);
    const cartIndex = cartsData.findIndex((c: any) => c.id === cartId);
    
    if (cartIndex === -1) {
      throw new NotFoundException('Cart not found');
    }

    const cartData = cartsData[cartIndex];
    const existingItemIndex = cartData.items.findIndex((item: CartItem) => item.productId === productId);

    if (existingItemIndex !== -1) {
      cartData.items[existingItemIndex].quantity += quantity;
    } else {
      cartData.items.push({
        productId,
        quantity,
        price: product.price,
        name: product.name,
      });
    }

    cartData.updatedAt = new Date();
    cartsData[cartIndex] = cartData;
    
    await this.storage.write(this.file, cartsData);
    
    return this.createCartInstance(cartData);
  }

  async addItems(cartId: string, items: CartItemDto[]): Promise<Cart> {
    for (const item of items) {
      await this.addItem(cartId, item.productId, item.quantity);
    }
    
    return this.findOne(cartId);
  }

  async updateItem(cartId: string, productId: string, quantity: number): Promise<Cart> {
    const cartsData = await this.storage.read<any>(this.file);
    const cartIndex = cartsData.findIndex((c: any) => c.id === cartId);
    
    if (cartIndex === -1) {
      throw new NotFoundException('Cart not found');
    }

    const cartData = cartsData[cartIndex];
    const itemIndex = cartData.items.findIndex((item: CartItem) => item.productId === productId);
    
    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    if (quantity === 0) {
      cartData.items.splice(itemIndex, 1);
    } else {
      const products = await this.storage.read<Product>(this.productsFile);
      const product = products.find(p => p.id === productId);
      
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      
      if (product.stock < quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${product.stock}`);
      }
      
      cartData.items[itemIndex].quantity = quantity;
    }

    cartData.updatedAt = new Date();
    cartsData[cartIndex] = cartData;
    
    await this.storage.write(this.file, cartsData);
    
    return this.createCartInstance(cartData);
  }

  async updateCart(cartId: string, dto: UpdateCartDto): Promise<Cart> {
    if (dto.items) {
      for (const item of dto.items) {
        await this.updateItem(cartId, item.productId, item.quantity);
      }
    }
    
    return this.findOne(cartId);
  }

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    return this.updateItem(cartId, productId, 0);
  }

  async clearCart(cartId: string): Promise<Cart> {
    const cartsData = await this.storage.read<any>(this.file);
    const cartIndex = cartsData.findIndex((c: any) => c.id === cartId);
    
    if (cartIndex === -1) {
      throw new NotFoundException('Cart not found');
    }

    cartsData[cartIndex].items = [];
    cartsData[cartIndex].updatedAt = new Date();
    
    await this.storage.write(this.file, cartsData);
    
    return this.createCartInstance(cartsData[cartIndex]);
  }

  async getCartTotal(cartId: string): Promise<{ total: number; totalItems: number }> {
    const cart = await this.findOne(cartId);
    
    return {
      total: cart.total,
      totalItems: cart.totalItems,
    };
  }

  async checkout(cartId: string): Promise<{ success: boolean; orderId: string; total: number }> {
    const cart = await this.findOne(cartId);
    
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const products = await this.storage.read<Product>(this.productsFile);
    
    for (const item of cart.items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }
    }

    for (const item of cart.items) {
      const productIndex = products.findIndex(p => p.id === item.productId);
      products[productIndex].stock -= item.quantity;
    }

    const orderId = randomUUID();
    await this.storage.write(this.productsFile, products);
    await this.clearCart(cartId);

    return {
      success: true,
      orderId,
      total: cart.total,
    };
  }

  private async addItemsToCart(cartId: string, items: CartItemDto[]): Promise<void> {
    for (const item of items) {
      await this.addItem(cartId, item.productId, item.quantity);
    }
  }

  private createCartInstance(data: any): Cart {
    const cart = new Cart();
    cart.id = data.id;
    cart.userId = data.userId;
    cart.items = data.items || [];
    cart.createdAt = new Date(data.createdAt);
    cart.updatedAt = new Date(data.updatedAt);
    
    return cart;
  }
}