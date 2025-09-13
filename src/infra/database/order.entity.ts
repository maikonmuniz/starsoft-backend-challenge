import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';

export enum OrderStatus {
  PENDING = 'pendente',
  PROCESSING = 'processando',
  SENT = 'enviado',
  DELIVERED = 'entregue',
  CANCELED = 'cancelado',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @OneToMany(() => Item, (item) => item.order, { cascade: true })
  items: Item[];

  @Column()
  quantity?: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;
}
