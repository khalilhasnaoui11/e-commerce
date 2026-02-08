
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JsonStorageService } from '../storage/json-storage.service';
import { randomUUID } from 'crypto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './model/category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Product } from 'src/products/model/product.model';

@Injectable()
export class CategoriesService {
  private readonly file = 'categories.json';
  private readonly productsFile = 'products.json';

  constructor(private storage: JsonStorageService) {}

  async findAll(): Promise<Category[]> {
    return this.storage.read<Category>(this.file);
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const categories = await this.findAll();

    if (dto.productIds && dto.productIds.length > 0) {
      await this.validateProductsExist(dto.productIds);
    }

    const category: Category = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
      parentId: dto.parentId ?? null,
      productIds: dto.productIds ?? [],
    };

    if (category.productIds.length > 0) {
      await this.linkProductsToCategory(category.productIds, category.id);
    }

    categories.push(category);
    await this.storage.write(this.file, categories);

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const categories = await this.findAll();
    const index = categories.findIndex(c => c.id === id);

    if (index === -1) {
      throw new NotFoundException('Category not found');
    }

    const category = categories[index];
    const oldProductIds = [...category.productIds];
    const newProductIds = dto.productIds ?? category.productIds;

    await this.validateProductsExist(newProductIds);

    categories[index] = { 
      ...category, 
      ...dto,
      productIds: newProductIds
    };

    await this.updateProductCategoryLinks(oldProductIds, newProductIds, id);

    await this.storage.write(this.file, categories);
    return categories[index];
  }

  async remove(id: string): Promise<void> {
    const categories = await this.findAll();
    const category = categories.find(c => c.id === id);
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.productIds.length > 0) {
      await this.unlinkProductsFromCategory(category.productIds);
    }

    const filtered = categories.filter(
      c => c.id !== id && c.parentId !== id,
    );

    await this.storage.write(this.file, filtered);
  }

  async linkProduct(categoryId: string, productId: string): Promise<Category> {
    const categories = await this.findAll();
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const products = await this.storage.read<Product>(this.productsFile);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (category.productIds.includes(productId)) {
      throw new BadRequestException('Product already linked to this category');
    }

    category.productIds.push(productId);
    product.categoryId = categoryId;

    await this.storage.write(this.file, categories);
    await this.storage.write(this.productsFile, products);

    return category;
  }

  async unlinkProduct(categoryId: string, productId: string): Promise<Category> {
    const categories = await this.findAll();
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const productIndex = category.productIds.indexOf(productId);
    if (productIndex === -1) {
      throw new BadRequestException('Product not linked to this category');
    }

    category.productIds.splice(productIndex, 1);

    const products = await this.storage.read<Product>(this.productsFile);
    const product = products.find(p => p.id === productId);
    
    if (product && product.categoryId === categoryId) {
      product.categoryId = null;
      await this.storage.write(this.productsFile, products);
    }

    await this.storage.write(this.file, categories);
    return category;
  }

  private async validateProductsExist(productIds: string[]): Promise<void> {
    const products = await this.storage.read<Product>(this.productsFile);
    
    for (const productId of productIds) {
      const productExists = products.some(p => p.id === productId);
      if (!productExists) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }
    }
  }

  private async linkProductsToCategory(productIds: string[], categoryId: string): Promise<void> {
    const products = await this.storage.read<Product>(this.productsFile);
    
    for (const product of products) {
      if (productIds.includes(product.id)) {
        product.categoryId = categoryId;
      }
    }
    
    await this.storage.write(this.productsFile, products);
  }

  private async unlinkProductsFromCategory(productIds: string[]): Promise<void> {
    const products = await this.storage.read<Product>(this.productsFile);
    
    for (const product of products) {
      if (productIds.includes(product.id)) {
        product.categoryId = null;
      }
    }
    
    await this.storage.write(this.productsFile, products);
  }

  private async updateProductCategoryLinks(
    oldProductIds: string[], 
    newProductIds: string[], 
    categoryId: string
  ): Promise<void> {
    const products = await this.storage.read<Product>(this.productsFile);

    const productsToUnlink = oldProductIds.filter(id => !newProductIds.includes(id));
    const productsToLink = newProductIds.filter(id => !oldProductIds.includes(id));
    
    for (const product of products) {
      if (productsToUnlink.includes(product.id) && product.categoryId === categoryId) {
        product.categoryId = null;
      }
      
      if (productsToLink.includes(product.id)) {
        product.categoryId = categoryId;
      }
    }
    
    await this.storage.write(this.productsFile, products);
  }
}