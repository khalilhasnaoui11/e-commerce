import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Controller('carts')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Post()
  create(@Body() dto: CreateCartDto) {
    return this.service.create(dto);
  }

  @Post(':id/items')
  addItem(
    @Param('id') id: string,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number = 1,
  ) {
    return this.service.addItem(id, productId, quantity);
  }

  @Post(':id/items/batch')
  addItems(
    @Param('id') id: string,
    @Body() items: { productId: string; quantity: number }[],
  ) {
    return this.service.addItems(id, items);
  }

  @Put(':id/items/:productId')
  updateItem(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.service.updateItem(id, productId, quantity);
  }

  @Put(':id')
  updateCart(
    @Param('id') id: string,
    @Body() dto: UpdateCartDto,
  ) {
    return this.service.updateCart(id, dto);
  }

  @Delete(':id/items/:productId')
  removeItem(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.service.removeItem(id, productId);
  }

  @Delete(':id/clear')
  clearCart(@Param('id') id: string) {
    return this.service.clearCart(id);
  }

  @Get(':id/total')
  getTotal(@Param('id') id: string) {
    return this.service.getCartTotal(id);
  }

  @Post(':id/checkout')
  checkout(@Param('id') id: string) {
    return this.service.checkout(id);
  }
}