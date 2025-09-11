import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../infra/database/order.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @Inject("order_created")
        private kafkaClient: ClientKafka,
        @Inject('order_status_updated')
        private orderUpdatedKafka: ClientKafka,
  ) {}

  async register(orderData: Partial<Order>): Promise<Order> {
    if (!orderData.description) throw new BadRequestException('O parâmetro id é obrigatório');
    const order = this.orderRepository.create(orderData);
    const createdOrder = await this.orderRepository.save(order)
    if(!createdOrder) throw new BadRequestException('No register in database!');
    const convertCretedOrderString = JSON.stringify(createdOrder)
    await lastValueFrom(this.kafkaClient.emit('orders', convertCretedOrderString))
    return createdOrder;
  }

  async update(orderData: Partial<Order>): Promise<Order> {
    if (!orderData.id) throw new BadRequestException('O parâmetro id é obrigatório');
    const existingOrder = await this.orderRepository.findOne({ where: { id: orderData.id } });
    if (!existingOrder) throw new BadRequestException(`Pedido com id ${orderData.id} não encontrado`);
    const updatedOrder = this.orderRepository.merge(existingOrder, orderData);
    const savedOrder = await this.orderRepository.save(updatedOrder);
    if (!savedOrder) throw new BadRequestException('Falha ao atualizar no banco de dados!');
    const orderString = JSON.stringify(savedOrder);
    await lastValueFrom(this.orderUpdatedKafka.emit('orders-updated', orderString));
    return savedOrder;
  }
}
