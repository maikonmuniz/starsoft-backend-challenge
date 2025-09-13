import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from '../order.controller';
import { OrderService } from '../order.service';
import { BadRequestException } from '@nestjs/common';
import { OrderDto } from '../../dto/order.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  const mockOrderService = {
    register: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
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
    const body: OrderDto = { description: 'Test order', items: [{ price: 30 }], quantity:3 };
    const expected = { description: 'Test order', items: [{ price: 30 }], status: 'pendente' };

    mockOrderService.register.mockResolvedValue(expected);

    const result = await controller.create(body);

    expect(service.register).toHaveBeenCalledWith(body);
    expect(result).toEqual(expected);
  });

  it('should throw BadRequestException if register throws it', async () => {
    const body: any = {};
    mockOrderService.register.mockRejectedValue(
      new BadRequestException('The parameter "description" is required')
    );

    await expect(controller.create(body)).rejects.toThrow(BadRequestException);
    await expect(controller.create(body)).rejects.toThrow(
      'The parameter "description" is required'
    );
  });

  it('should call OrderService.update with the request body', async () => {
    const body: OrderDto = { id: 1, description: 'Updated order', items: [{ price: 50 }], quantity: 3 };
    const expected = { id: 1, description: 'Updated order', items: [{ price: 50 }], status: 'atualizado' };

    mockOrderService.update.mockResolvedValue(expected);

    const result = await controller.update(body);

    expect(service.update).toHaveBeenCalledWith(body);
    expect(result).toEqual(expected);
  });

  it('should throw BadRequestException if update throws it', async () => {
    const body: any = { id: 1 };
    mockOrderService.update.mockRejectedValue(
      new BadRequestException('Falha ao atualizar no banco de dados!')
    );

    await expect(controller.update(body)).rejects.toThrow(BadRequestException);
    await expect(controller.update(body)).rejects.toThrow(
      'Falha ao atualizar no banco de dados!'
    );
  });

  it('should call OrderService.find with the correct id', async () => {
    const id = '1';
    const expected = { id: '1', description: 'Test order' };

    mockOrderService.find.mockResolvedValue(expected);

    const result = await controller.find(id);

    expect(result).toEqual(expected);
  });

  it('should throw BadRequestException if find throws it', async () => {
    const id = '2';
    mockOrderService.find.mockRejectedValue(
      new BadRequestException('Pedido não encontrado')
    );

    await expect(controller.find(id)).rejects.toThrow(BadRequestException);
    await expect(controller.find(id)).rejects.toThrow('Pedido não encontrado');
  });

  it('should call OrderService.delete with the correct id', async () => {
    const id = 1;
    const expected = { message: 'Pedido deletado com sucesso' };

    mockOrderService.delete.mockResolvedValue(expected);

    const result = await controller.delete(id);

    expect(service.delete).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('should throw BadRequestException if delete throws it', async () => {
    const id = 2;
    mockOrderService.delete.mockRejectedValue(
      new BadRequestException('Falha ao deletar pedido')
    );

    await expect(controller.delete(id)).rejects.toThrow(BadRequestException);
    await expect(controller.delete(id)).rejects.toThrow('Falha ao deletar pedido');
  });
});
