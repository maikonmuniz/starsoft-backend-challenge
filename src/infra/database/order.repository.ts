import { Injectable } from "@nestjs/common";
import { Order } from "src/infra/database/order.entity";
import { Repository } from "typeorm";

@Injectable()
export class OrderRepository extends Repository<Order> { }