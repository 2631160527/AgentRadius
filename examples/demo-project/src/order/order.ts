// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { pay } from "../payment/payment";
import { ship } from "../shipping/shipping";
export function updateOrderStatus(status: string) {
  const order = { status };
  pay(order);
  ship(order);
  return order;
}
