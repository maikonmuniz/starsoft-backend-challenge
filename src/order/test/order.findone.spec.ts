import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../order.service';
import { BadRequestException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../../infra/database/order.entity';

describe('OrderService - findOne', () => {
  let service: OrderService;
  let elasticsearchService: jest.Mocked<ElasticsearchService>;

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
          useValue: { emit: jest.fn() },
        },
        {
          provide: 'order_status_updated',
          useValue: { emit: jest.fn() },
        },
        {
          provide: ElasticsearchService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    elasticsearchService = module.get(ElasticsearchService);
  });

  it('should throw exception if id is not provided', async () => {
    await expect(service.findOne(null as any)).rejects.toThrow(BadRequestException);
    await expect(service.findOne(null as any)).rejects.toThrow(
      'O parametro id está vazio!',
    );
  });

  it('should call elasticsearchService.get with correct params', async () => {
    const mockSource = { id: 1, description: 'pedido teste' };
    (elasticsearchService.get as jest.Mock).mockResolvedValue({ _source: mockSource });

    const result = await service.findOne(1);

    expect(elasticsearchService.get).toHaveBeenCalledWith({
      index: 'orders',
      id: '1',
    });
    expect(result).toEqual(mockSource);
  });

  it('should throw if elasticsearchService.get fails', async () => {
    (elasticsearchService.get as jest.Mock).mockRejectedValue(new Error('Elasticsearch error'));

    await expect(service.findOne(1)).rejects.toThrow('Elasticsearch error');
  });
});
