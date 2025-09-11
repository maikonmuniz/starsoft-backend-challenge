import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/infra/database/order.entity';
import { OrderRepository } from '../infra/database/order.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [TypeOrmModule.forFeature([Order]),
  ClientsModule.register([{
    name: "order_created",
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'orders',
        brokers: ['kafka:29092'],
      }
    }
  }])
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository]
})
export class OrderModule {}
