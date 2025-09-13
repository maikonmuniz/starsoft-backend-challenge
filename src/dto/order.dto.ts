import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemDto {
    @ApiPropertyOptional({ example: 1, description: 'ID do item (opcional)' })
    id?: number;

    @ApiProperty({ example: 10.00, description: 'price the item' })
    price: number;
}

export class OrderDto {
    @ApiPropertyOptional({ example: 1, description: 'ID do item (opcional)' })
    id?: number;

    @ApiProperty({ example: 'Generate order', description: 'description the order!' })
    description: string;

    @ApiProperty({ example: '[{ "price": 30.00 }]', description: 'list itens' })
    items: ItemDto[];

    @ApiProperty({ example: '3', description: 'quantity itens' })
    quantity: number

    @ApiPropertyOptional({ example: "pendente", description: 'status the order' })
    status?: OrderStatus;
}

enum OrderStatus {
  PENDING = 'pendente',
  PROCESSING = 'processando',
  SENT = 'enviado',
  DELIVERED = 'entregue',
  CANCELED = 'cancelado',
}