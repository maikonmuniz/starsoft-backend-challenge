import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { BadRequestException } from '@nestjs/common';

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
    const body = { description: 'Test order' };
    const expected = { id: 1, description: 'Test order' };

    mockOrderService.register.mockResolvedValue(expected);

    const result = await controller.create(body);

    expect(service.register).toHaveBeenCalledWith(body);
    expect(result).toEqual(expected);
  });

  it('should throw BadRequestException if service throws it', async () => {
    const body = {};
    mockOrderService.register.mockRejectedValue(
      new BadRequestException('The parameter "description" is required'),
    );

    await expect(controller.create(body)).rejects.toThrow(BadRequestException);
    await expect(controller.create(body)).rejects.toThrow(
      'The parameter "description" is required',
    );
  });
});
