import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from '../order.service';
import { Order } from '../../infra/database/order.entity';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { of } from 'rxjs';

describe('OrderService - update', () => {
  let service: OrderService;
  let repository: jest.Mocked<Repository<Order>>;
  let orderUpdatedKafka: jest.Mocked<ClientKafka>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findOne: jest.fn(),
            merge: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'order_created',
          useValue: { emit: jest.fn().mockReturnValue(of(null)) },
        },
        {
          provide: 'order_status_updated',
          useValue: { emit: jest.fn().mockReturnValue(of(null)) },
        },
        {
          provide: ElasticsearchService,
          useValue: { index: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get(getRepositoryToken(Order));
    orderUpdatedKafka = module.get('order_status_updated');
  });

  it('should throw exception if id is not given', async () => {
    const orderData: Partial<Order> = { description: 'teste' };
    await expect(service.update(orderData)).rejects.toThrow(BadRequestException);
    await expect(service.update(orderData)).rejects.toThrow(
      'O parâmetro id é obrigatório'
    );
  });

  it('should throw exception if order is not found', async () => {
    const orderData: Partial<Order> = { id: 1, description: 'teste' };
    repository.findOne.mockResolvedValue(null);

    await expect(service.update(orderData)).rejects.toThrow(BadRequestException);
    await expect(service.update(orderData)).rejects.toThrow(
      'Pedido com id 1 não encontrado'
    );
  });

  it('should throw exception if save fails', async () => {
    const orderData: Partial<Order> = { id: 1, description: 'teste' };
    const existingOrder: Order = { id: 1, description: 'antigo' } as Order;

    repository.findOne.mockResolvedValue(existingOrder);
    repository.merge.mockReturnValue({ ...existingOrder, ...orderData });
    repository.save.mockResolvedValue(null as any);

    await expect(service.update(orderData)).rejects.toThrow(BadRequestException);
    await expect(service.update(orderData)).rejects.toThrow(
      'Falha ao atualizar no banco de dados!'
    );
  });

  it('should update the order and emit Kafka event', async () => {
    const orderData: Partial<Order> = { id: 1, description: 'atualizado' };
    const existingOrder: Order = { id: 1, description: 'antigo' } as Order;
    const savedOrder: Order = { id: 1, description: 'atualizado' } as Order;

    repository.findOne.mockResolvedValue(existingOrder);
    repository.merge.mockReturnValue(savedOrder);
    repository.save.mockResolvedValue(savedOrder);

    const result = await service.update(orderData);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: orderData.id } });
    expect(repository.merge).toHaveBeenCalledWith(existingOrder, orderData);
    expect(repository.save).toHaveBeenCalledWith(savedOrder);
    expect(orderUpdatedKafka.emit).toHaveBeenCalledWith(
      'orders-updated',
      JSON.stringify(savedOrder)
    );
    expect(result).toEqual(savedOrder);
  });
});
