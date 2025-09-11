import { Body, Controller, Post, Put } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {

  constructor(private readonly orderService: OrderService) {}

  @Post("create")
  create(@Body() body: any) {
    return this.orderService.register(body)
  }

  @Put('update')
  update(@Body() body: any) {
    return this.orderService.update(body);
  }
}
