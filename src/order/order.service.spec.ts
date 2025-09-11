import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { Order } from '../infra/database/order.entity';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('OrderService', () => {
  let service: OrderService;
  let repository: jest.Mocked<Repository<Order>>;
  let kafkaClient: jest.Mocked<ClientKafka>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'order_created',
          useValue: {
            emit: jest.fn().mockReturnValue(of(null)), // mock do Kafka emit
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get(getRepositoryToken(Order));
    kafkaClient = module.get('order_created');
  });

  it('Should throw BadRequestException when description is missing', async () => {
    const orderData: Partial<Order> = {};
    await expect(service.register(orderData)).rejects.toThrow(BadRequestException);
    await expect(service.register(orderData)).rejects.toThrow('O parâmetro id é obrigatório');
  });

  it('Should create, save the order and emit Kafka event when description is valid', async () => {
    const orderData: Partial<Order> = { description: 'Pedido de teste' };
    const orderEntity: Order = { id: 1, description: 'Pedido de teste' } as Order;

    repository.create.mockReturnValue(orderEntity);
    repository.save.mockResolvedValue(orderEntity);

    const result = await service.register(orderData);

    expect(repository.create).toHaveBeenCalledWith(orderData);
    expect(repository.save).toHaveBeenCalledWith(orderEntity);
    expect(kafkaClient.emit).toHaveBeenCalledWith(
      'orders',
      JSON.stringify(orderEntity),
    );
    expect(result).toEqual(orderEntity);
  });

  it('Should throw BadRequestException when save fails', async () => {
    const orderData: Partial<Order> = { description: 'Pedido de teste' };
    const orderEntity: Order = { id: 1, description: 'Pedido de teste' } as Order;

    repository.create.mockReturnValue(orderEntity);
    repository.save.mockResolvedValue(null as any); // simula falha no save

    await expect(service.register(orderData)).rejects.toThrow(BadRequestException);
    await expect(service.register(orderData)).rejects.toThrow('No register in database!');
  });
});
