// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
export function ship(order: { status: string }) {
  return db.query("UPDATE shipments SET status = '" + order.status + "'");
}
