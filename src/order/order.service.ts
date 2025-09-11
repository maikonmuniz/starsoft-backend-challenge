import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../infra/database/order.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
  ) {}

  async register(orderData: Partial<Order>): Promise<Order> {
    if (!orderData.description) throw new BadRequestException('O parâmetro id é obrigatório');
    const order = this.orderRepository.create(orderData);
    return await this.orderRepository.save(order);
  }
}
