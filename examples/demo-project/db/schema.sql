CREATE TABLE orders (id TEXT PRIMARY KEY, status TEXT);
CREATE TABLE payments (id INTEGER PRIMARY KEY, order_id TEXT, status TEXT);
CREATE TABLE shipments (id INTEGER PRIMARY KEY, status TEXT);
