import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

@Entity()
export class Item {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
    order: Order;
}
