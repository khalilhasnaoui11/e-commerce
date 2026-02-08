import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

export class UpdateCartDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCartItemDto)
  items?: UpdateCartItemDto[];
}