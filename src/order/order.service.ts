import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
    @Inject('order_created')
    private kafkaClient: ClientKafka,
    @Inject('order_status_updated')
    private orderUpdatedKafka: ClientKafka,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async register(orderData: Partial<Order>): Promise<Order> {
    try {
      if (!orderData.description)
        throw new BadRequestException('O parâmetro description é obrigatório');
      if (!orderData.items)
        throw new BadRequestException('O parâmetro items é obrigatório');
      if (!orderData.quantity)
        throw new BadRequestException('O parâmetro quantity é obrigatório');
      const quantityItems = orderData.items.length;
      const quantity = orderData.quantity;
      const validationQuantityAndItems = quantityItems == quantity;
      if (!validationQuantityAndItems)
        throw new BadRequestException('Divergência na quantidade e nos itens!');
      const order = this.orderRepository.create(orderData);
      const createdOrder = await this.orderRepository.save(order);
      if (!createdOrder)
        throw new BadRequestException('No register in database!');
      const convertCretedOrderString = JSON.stringify(createdOrder);

      await lastValueFrom(
        this.kafkaClient.emit('orders', convertCretedOrderString),
      );
      await this.elasticsearchService.index({
        index: 'orders',
        id: createdOrder.id.toString(),
        document: createdOrder,
      });

      return createdOrder;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Erro inesperado ao registrar o pedido');
    }
  }

  async update(orderData: Partial<Order>): Promise<Order> {
    try {
      if (!orderData.id) {
        throw new BadRequestException('O parâmetro id é obrigatório');
      }

      const existingOrder = await this.orderRepository.findOne({
        where: { id: orderData.id },
      });

      if (!existingOrder) {
        throw new BadRequestException(
          `Pedido com id ${orderData.id} não encontrado`,
        );
      }

      const updatedOrder = this.orderRepository.merge(existingOrder, orderData);
      const savedOrder = await this.orderRepository.save(updatedOrder);

      if (!savedOrder) {
        throw new BadRequestException('Falha ao atualizar no banco de dados!');
      }

      const orderString = JSON.stringify(savedOrder);

      await lastValueFrom(
        this.orderUpdatedKafka.emit('orders-updated', orderString),
      );

      await this.elasticsearchService.index({
        index: 'orders',
        id: savedOrder.id.toString(),
        document: savedOrder,
      });

      return savedOrder;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Erro inesperado no update:', error);
      throw new InternalServerErrorException(
        'Erro inesperado ao atualizar o pedido',
      );
    }
  }

  async find(id?: string, status?: string, date?: string, quantity?: number) {
    try {
      const filters: any[] = [];

      if (id) {
        filters.push({ term: { id: id } });
      }

      if (status) {
        filters.push({ term: { status: status } });
      }

      if (date) {
        filters.push({ range: { createdAt: { gte: date } } });
      }

      if (quantity) {
        filters.push({ term: { quantity: quantity } });
      }

      if (filters.length === 0) {
        throw new BadRequestException(
          'É necessário informar pelo menos um filtro (id, status ou data)!',
        );
      }

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
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Erro inesperado no find:', error);
      throw new InternalServerErrorException(
        'Erro inesperado ao buscar os pedidos',
      );
    }
  }

  async delete(id: number): Promise<{ message: string }> {
    try {
      if (!id) {
        throw new BadRequestException('O parâmetro id é obrigatório');
      }

      const existingOrder = await this.orderRepository.findOne({
        where: { id },
      });

      if (!existingOrder) {
        throw new BadRequestException(`Pedido com id ${id} não encontrado`);
      }

      await this.orderRepository.delete(id);

      await this.elasticsearchService.delete({
        index: 'orders',
        id: id.toString(),
      });

      return { message: `Pedido com id ${id} deletado com sucesso.` };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Erro inesperado no delete:', error);
      throw new InternalServerErrorException(
        'Erro inesperado ao deletar o pedido',
      );
    }
  }
}
