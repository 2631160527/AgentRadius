// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
export function pay(order: { status: string }) {
  return db.query("INSERT INTO payments (order_id, status) VALUES ('demo', '" + order.status + "')");
}
