import { Body, Controller, Post, Put } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrderDto } from '../dto/order.dto';

@ApiTags('order')
@Controller('order')
export class OrderController {

  constructor(private readonly orderService: OrderService) {}

  @Post("create")
  @ApiOperation({ summary: 'Cria pedido e seus itens' })
  @ApiResponse({ status: 200, description: 'Retorna o pedido e seus itens criados com sucesso.' })
  create(@Body() body: OrderDto) {
    return this.orderService.register(body)
  }

  @Put('update')
  @ApiOperation({ summary: 'Faz update de pedido' })
  @ApiResponse({ status: 200, description: 'Retorna o update de pedido.' })
  update(@Body() body: OrderDto) {
    return this.orderService.update(body);
  }
}
