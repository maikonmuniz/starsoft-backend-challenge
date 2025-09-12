import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from '../order.service';
import { Order } from '../../infra/database/order.entity';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('OrderService - register', () => {
  let service: OrderService;
  let repository: jest.Mocked<Repository<Order>>;
  let orderCreatedKafka: jest.Mocked<ClientKafka>;
  let orderUpdatedKafka: jest.Mocked<ClientKafka>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            merge: jest.fn(),
          },
        },
        {
          provide: 'order_created',
          useValue: {
            emit: jest.fn().mockReturnValue(of(null)),
          },
        },
        {
          provide: 'order_status_updated',
          useValue: {
            emit: jest.fn().mockReturnValue(of(null)),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get(getRepositoryToken(Order));
    orderCreatedKafka = module.get('order_created');
    orderUpdatedKafka = module.get('order_status_updated');
  });

  it('should throw an exception if description is missing', async () => {
    const orderData: Partial<Order> = {};
    await expect(service.register(orderData)).rejects.toThrow(BadRequestException);
    await expect(service.register(orderData)).rejects.toThrow('O parâmetro id é obrigatório');
  });

  it('should throw an exception if save returns null', async () => {
    const orderData: Partial<Order> = { description: 'new order' };
    const orderEntity: Order = { id: 1, description: 'new order' } as Order;

    repository.create.mockReturnValue(orderEntity);
    repository.save.mockResolvedValue(null as any);

    await expect(service.register(orderData)).rejects.toThrow(BadRequestException);
    await expect(service.register(orderData)).rejects.toThrow('No register in database!');
  });

  it('should create and save the order and emit a Kafka event', async () => {
    const orderData: Partial<Order> = { description: 'valid order' };
    const orderEntity: Order = { id: 1, description: 'valid order' } as Order;

    repository.create.mockReturnValue(orderEntity);
    repository.save.mockResolvedValue(orderEntity);

    const result = await service.register(orderData);

    expect(repository.create).toHaveBeenCalledWith(orderData);
    expect(repository.save).toHaveBeenCalledWith(orderEntity);
    expect(orderCreatedKafka.emit).toHaveBeenCalledWith(
      'orders',
      JSON.stringify(orderEntity),
    );
    expect(result).toEqual(orderEntity);
  });
});
