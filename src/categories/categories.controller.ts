import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':categoryId/products/:productId/link')
  linkProduct(
    @Param('categoryId') categoryId: string,
    @Param('productId') productId: string,
  ) {
    return this.service.linkProduct(categoryId, productId);
  }

  @Post(':categoryId/products/:productId/unlink')
  unlinkProduct(
    @Param('categoryId') categoryId: string,
    @Param('productId') productId: string,
  ) {
    return this.service.unlinkProduct(categoryId, productId);
  }
}