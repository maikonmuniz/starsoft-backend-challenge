import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { BadRequestException } from '@nestjs/common';
import { OrderDto } from '../dto/order.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  const mockOrderService = {
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
    jest.clearAllMocks();
  });

  it('should call OrderService.register with the request body', async () => {
    const body: OrderDto = {description: 'Test order',  "items": [ {"price": 30} ]};
    const expected = { description: 'Test order',  "items": [ {"price": 30} ], "status": "pendente"};

    mockOrderService.register.mockResolvedValue(expected);

    const result = await controller.create(body);

    expect(service.register).toHaveBeenCalledWith(body);
    expect(result).toEqual(expected);
  });

  it('should throw BadRequestException if service throws it', async () => {
    const body: OrderDto | any = {};
    mockOrderService.register.mockRejectedValue(
      new BadRequestException('The parameter "description" is required'),
    );

    await expect(controller.create(body)).rejects.toThrow(BadRequestException);
    await expect(controller.create(body)).rejects.toThrow(
      'The parameter "description" is required',
    );
  });
});
