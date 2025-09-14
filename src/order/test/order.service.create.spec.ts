/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from '../order.service';
import { Order } from '../../infra/database/order.entity';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { of } from 'rxjs';

describe('OrderService - register', () => {
  let service: OrderService;
  let repository: jest.Mocked<Repository<Order>>;
  let orderCreatedKafka: jest.Mocked<ClientKafka>;
  let orderUpdatedKafka: jest.Mocked<ClientKafka>;
  let elasticsearchService: ElasticsearchService;

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
            emit: jest.fn().mockReturnValue(of(null)),
          },
        },
        {
          provide: 'order_status_updated',
          useValue: {
            emit: jest.fn().mockReturnValue(of(null)),
          },
        },
        {
          provide: ElasticsearchService,
          useValue: {
            index: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get(getRepositoryToken(Order));
    orderCreatedKafka = module.get('order_created');
    orderUpdatedKafka = module.get('order_status_updated');
    elasticsearchService = module.get(ElasticsearchService);
  });

  it('should throw an exception if description is missing', async () => {
    const orderData: Partial<Order> = { quantity: 3 };
    await expect(service.register(orderData)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.register(orderData)).rejects.toThrow(
      'O parâmetro description é obrigatório',
    );
  });

  it('should throw an exception if items is missing', async () => {
    const orderData: Partial<Order> = {
      description: 'Test order',
      quantity: 1,
    };
    await expect(service.register(orderData)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.register(orderData)).rejects.toThrow(
      'O parâmetro items é obrigatório',
    );
  });

  it('should throw an exception if quantity is missing', async () => {
    const orderData: Partial<Order> = {
      description: 'Test order',
      items: [{ price: 30 }],
    };
    await expect(service.register(orderData)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.register(orderData)).rejects.toThrow(
      'O parâmetro quantity é obrigatório',
    );
  });

  it('should throw an error if quantity and items do not match', async () => {
    const orderData: Partial<Order> = {
      description: 'Test order',
      items: [{ price: 30 }],
      quantity: 2,
    };
    await expect(service.register(orderData)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.register(orderData)).rejects.toThrow(
      'Divergência na quantidade e nos itens!',
    );
  });

  it('should throw an exception if save returns null', async () => {
    const orderData: Partial<Order> = {
      description: 'Test order',
      items: [{ price: 30 }],
      quantity: 1,
    };
    const orderEntity: Order = {
      id: 1,
      description: 'new order',
      items: [{ price: 30 }],
      quantity: 1,
    } as Order;

    repository.create.mockReturnValue(orderEntity);
    repository.save.mockResolvedValue(null as any);

    await expect(service.register(orderData)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.register(orderData)).rejects.toThrow(
      'No register in database!',
    );
  });

  it('should create, save, emit Kafka event, and index in Elasticsearch', async () => {
    const orderData: Partial<Order> = {
      description: 'Test order',
      items: [{ price: 30 }],
      quantity: 1,
    };
    const orderEntity: Order = {
      id: 1,
      description: 'Test order',
      items: [{ price: 30 }],
      quantity: 1,
    } as Order;

    repository.create.mockReturnValue(orderEntity);
    repository.save.mockResolvedValue(orderEntity);

    const result = await service.register(orderData);

    expect(repository.create).toHaveBeenCalledWith(orderData);
    expect(repository.save).toHaveBeenCalledWith(orderEntity);
    expect(orderCreatedKafka.emit).toHaveBeenCalledWith(
      'orders',
      JSON.stringify(orderEntity),
    );
    expect(elasticsearchService.index).toHaveBeenCalledWith({
      index: 'orders',
      id: orderEntity.id.toString(),
      document: orderEntity,
    });
    expect(result).toEqual(orderEntity);
  });
});
