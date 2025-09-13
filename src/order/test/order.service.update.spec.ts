import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../../infra/database/order.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { of } from 'rxjs';

describe('OrderService - update', () => {
  let service: OrderService;
  let repository: jest.Mocked<Repository<Order>>;
  let kafkaClient: jest.Mocked<ClientKafka>;
  let orderUpdatedKafka: jest.Mocked<ClientKafka>;
  let elasticsearchService: jest.Mocked<ElasticsearchService>;

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
          useValue: { emit: jest.fn() },
        },
        {
          provide: 'order_status_updated',
          useValue: { emit: jest.fn() },
        },
        {
          provide: ElasticsearchService,
          useValue: {
            index: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get(getRepositoryToken(Order));
    kafkaClient = module.get('order_created');
    orderUpdatedKafka = module.get('order_status_updated');
    elasticsearchService = module.get(ElasticsearchService);
  });

  it('should throw an error if id is not provided', async () => {
    await expect(service.update({})).rejects.toThrow(
      new BadRequestException('O parâmetro id é obrigatório'),
    );
  });

  it('should throw an error if the order is not found', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.update({ id: 123 })).rejects.toThrow(
      new BadRequestException('Pedido com id 123 não encontrado'),
    );
  });

  it('should throw an error if saving to database fails', async () => {
    const existingOrder = { id: 123, description: 'teste' } as Order;
    repository.findOne.mockResolvedValue(existingOrder);
    repository.merge.mockReturnValue({ ...existingOrder, description: 'novo' });
    repository.save.mockResolvedValue(null);

    await expect(
      service.update({ id: 123, description: 'novo' }),
    ).rejects.toThrow(new BadRequestException('Falha ao atualizar no banco de dados!'));
  });

  it('should update the order, emit to Kafka, and index in Elasticsearch', async () => {
    const existingOrder = { id: 123, description: 'teste' } as Order;
    const updatedOrder = { ...existingOrder, description: 'novo' } as Order;

    repository.findOne.mockResolvedValue(existingOrder);
    repository.merge.mockReturnValue(updatedOrder);
    repository.save.mockResolvedValue(updatedOrder);
    orderUpdatedKafka.emit.mockReturnValue(of(true));

    await expect(
      service.update({ id: 123, description: 'novo' }),
    ).resolves.toEqual(updatedOrder);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 123 } });
    expect(repository.merge).toHaveBeenCalledWith(existingOrder, {
      id: 123,
      description: 'novo',
    });
    expect(repository.save).toHaveBeenCalledWith(updatedOrder);
    expect(orderUpdatedKafka.emit).toHaveBeenCalledWith(
      'orders-updated',
      JSON.stringify(updatedOrder),
    );
    expect(elasticsearchService.index).toHaveBeenCalledWith({
      index: 'orders',
      id: updatedOrder.id.toString(),
      document: updatedOrder,
    });
  });
});
