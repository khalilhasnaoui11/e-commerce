import { Injectable, NotFoundException } from '@nestjs/common';
import { JsonStorageService } from '../storage/json-storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { randomUUID } from 'crypto';
import { Product } from './model/product.model';

@Injectable()
export class ProductsService {
  private readonly file = 'products.json';

  constructor(private storage: JsonStorageService) {}

  async findAll(): Promise<Product[]> {
    return this.storage.read<Product>(this.file);
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const products = await this.findAll();

    const product: Product = {
      id: randomUUID(),
      name: dto.name,
      price: dto.price,
      stock: dto.stock,
      categoryId: dto.categoryId,
    };

    products.push(product);
    await this.storage.write(this.file, products);

    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const products = await this.findAll();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      throw new NotFoundException('Product not found');
    }

    products[index] = { ...products[index], ...dto };
    await this.storage.write(this.file, products);

    return products[index];
  }

  async remove(id: string): Promise<void> {
    const products = await this.findAll();
    await this.storage.write(
      this.file,
      products.filter(p => p.id !== id),
    );
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
  const products = await this.findAll();
  return products.filter(p => p.categoryId === categoryId);
}
}
