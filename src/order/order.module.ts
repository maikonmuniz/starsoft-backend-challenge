import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from '../infra/database/order.entity';
import { OrderRepository } from '../infra/database/order.repository';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([Order]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        nodes: [configService.get<string>('ELASTIC_URL')],
        auth: {
          username: configService.get<string>('ELASTIC_USER') || 'elastic',
          password: configService.get<string>('ELASTIC_PASS'),
        },
      }),
    }),
    ClientsModule.register([
      {
        name: 'order_created',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'orders',
            brokers: ['kafka:29092'],
          },
        },
      },
      {
        name: 'order_status_updated',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'orders-updated',
            brokers: ['kafka:29092'],
          },
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
})
export class OrderModule {}
