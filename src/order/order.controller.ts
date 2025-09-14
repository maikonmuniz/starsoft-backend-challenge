import { Body, Controller, Get, Param, Post, Put, Query, Delete } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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

  @Get('find')
  @ApiOperation({ summary: 'Faz consulta de pedido por filtros.' })
  @ApiResponse({ status: 200, description: 'Retorna a consulta de pedido.' })
  @ApiQuery({ name: 'id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'quantity', required: false, type: Number })
  async find(
    @Query('id') id?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('quantity') quantity?: number
  ) {
    return this.orderService.find(
      id,
      status,
      date,
      quantity
    );
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Deleta um pedido pelo ID.' })
  @ApiResponse({ status: 200, description: 'Pedido deletado com sucesso.' })
  async delete(@Param('id') id: number) {
    return this.orderService.delete(id);
  }
}
