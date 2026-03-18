-- SQL Commands to create Owner Return Request tables

-- 1. Main table for Return Requests
CREATE TABLE owner_return_requests (
    return_id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, COMPLETED
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_po FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id),
    CONSTRAINT fk_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);

-- 2. Table for specific items being returned (to handle partial returns)
CREATE TABLE owner_return_items (
    return_item_id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL REFERENCES owner_return_requests(return_id) ON DELETE CASCADE,
    po_item_id INTEGER NOT NULL REFERENCES purchase_order_items(po_item_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    CONSTRAINT fk_return FOREIGN KEY (return_id) REFERENCES owner_return_requests(return_id),
    CONSTRAINT fk_po_item FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(po_item_id)
);

-- 3. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_owner_return_requests_updated_at
    BEFORE UPDATE ON owner_return_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
