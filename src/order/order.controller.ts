import { Body, Controller, Post, Put } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from '../../src/infra/database/order.entity';

@Controller('order')
export class OrderController {

  constructor(private readonly orderService: OrderService) {}

  @Post("create")
  create(@Body() body: Order) {
    return this.orderService.register(body)
  }

  @Put('update')
  update(@Body() body: Order) {
    return this.orderService.update(body);
  }
}
