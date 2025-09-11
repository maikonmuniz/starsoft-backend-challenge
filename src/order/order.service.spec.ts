import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { Order } from '../infra/database/order.entity';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('OrderService', () => {
  let service: OrderService;
  let repository: jest.Mocked<Repository<Order>>;

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
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get(getRepositoryToken(Order));
  });

  it('Should throw BadRequestException when description is missing', async () => {
    const orderData: Partial<Order> = {};
    await expect(service.register(orderData)).rejects.toThrow(BadRequestException);
    await expect(service.register(orderData)).rejects.toThrow('O parâmetro id é obrigatório');
  });

  it('Should create and save the order when description is valid', async () => {
    const orderData: Partial<Order> = { description: 'Pedido de teste' };
    const orderEntity: Order = { id: 1, description: 'Pedido de teste' } as Order;

    repository.create.mockReturnValue(orderEntity);
    repository.save.mockResolvedValue(orderEntity);

    const result = await service.register(orderData);

    expect(repository.create).toHaveBeenCalledWith(orderData);
    expect(repository.save).toHaveBeenCalledWith(orderEntity);
    expect(result).toEqual(orderEntity);
  });
});
