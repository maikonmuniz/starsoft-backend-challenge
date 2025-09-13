import { BadRequestException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OrderService } from '../order.service'; // ajuste o path conforme sua estrutura
import { Repository } from 'typeorm';
import { Order } from '../../infra/database/order.entity';
import { ClientKafka } from '@nestjs/microservices';

describe('OrderService - find', () => {
  let orderService: OrderService;
  let elasticsearchService: jest.Mocked<ElasticsearchService>;

  beforeEach(() => {
    elasticsearchService = {
      search: jest.fn(),
    } as any;

    orderService = new OrderService(
      {} as Repository<Order>,
      {} as ClientKafka,
      {} as ClientKafka,
      elasticsearchService,
    );
  });

  it('deve lançar BadRequestException se nenhum filtro for informado', async () => {
    await expect(orderService.find()).rejects.toThrow(
      new BadRequestException('É necessário informar pelo menos um filtro (id, status ou data)!'),
    );
  });

  it('deve buscar por id', async () => {
    const mockResponse = {
      hits: {
        hits: [
          { _source: { id: '123', status: 'pending', createdAt: '2023-01-01' } },
        ],
      },
    };

    elasticsearchService.search.mockResolvedValue(mockResponse as any);

    const result = await orderService.find('123');

    expect(elasticsearchService.search).toHaveBeenCalledWith({
      index: 'orders',
      body: {
        query: {
          bool: {
            must: [{ term: { id: '123' } }],
          },
        },
      },
    });

    expect(result).toEqual([{ id: '123', status: 'pending', createdAt: '2023-01-01' }]);
  });

  it('deve buscar por status e data', async () => {
    const mockResponse = {
      hits: {
        hits: [
          { _source: { id: '456', status: 'completed', createdAt: '2023-02-01' } },
        ],
      },
    };

    elasticsearchService.search.mockResolvedValue(mockResponse as any);

    const result = await orderService.find(undefined, 'completed', '2023-01-31');

    expect(elasticsearchService.search).toHaveBeenCalledWith({
      index: 'orders',
      body: {
        query: {
          bool: {
            must: [
              { term: { status: 'completed' } },
              { range: { createdAt: { gte: '2023-01-31' } } },
            ],
          },
        },
      },
    });

    expect(result).toEqual([{ id: '456', status: 'completed', createdAt: '2023-02-01' }]);
  });
});
