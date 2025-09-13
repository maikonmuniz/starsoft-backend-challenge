import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../infra/database/order.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @Inject("order_created")
        private kafkaClient: ClientKafka,
        @Inject('order_status_updated')
        private orderUpdatedKafka: ClientKafka,
        private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async register(orderData: Partial<Order>): Promise<Order> {
    if (!orderData.description) throw new BadRequestException('O parâmetro description é obrigatório');
    const order = this.orderRepository.create(orderData);
    const createdOrder = await this.orderRepository.save(order);
    if (!createdOrder) throw new BadRequestException('No register in database!');
    const convertCretedOrderString = JSON.stringify(createdOrder);
    await lastValueFrom(this.kafkaClient.emit('orders', convertCretedOrderString));
    await this.elasticsearchService.index({
      index: 'orders',
      id: createdOrder.id.toString(),
      document: createdOrder,
    });
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
    await this.elasticsearchService.index({
      index: 'orders',
      id: savedOrder.id.toString(),
      document: savedOrder,
    });
    return savedOrder;
  }

  async find(id?: string, status?: string, data?: string) {
    const filters: any[] = [];

    if (id) {
      filters.push({ term: { id: id } });
    }

    if (status) {
      filters.push({ term: { status: status } });
    }

    if (data) {
      filters.push({ range: { createdAt: { gte: data } } });
    }

    if (filters.length === 0) throw new BadRequestException("É necessário informar pelo menos um filtro (id, status ou data)!");
  
    const result = await this.elasticsearchService.search<any>({
      index: 'orders',
      body: {
        query: {
          bool: {
            must: filters,
          },
        },
      } as any,
    });

    return result.hits.hits.map((hit: any) => hit._source);
  }

  async delete(id: number): Promise<{ message: string }> {
    if (!id) throw new BadRequestException('O parâmetro id é obrigatório');
    const existingOrder = await this.orderRepository.findOne({ where: { id } });
    if (!existingOrder) throw new BadRequestException(`Pedido com id ${id} não encontrado`);
    await this.orderRepository.delete(id);
    await this.elasticsearchService.delete({
      index: 'orders',
      id: id.toString(),
    });
    return { message: `Pedido com id ${id} deletado com sucesso.` };
  }
}
