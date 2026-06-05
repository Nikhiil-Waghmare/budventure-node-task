-- This is an empty migration.
ALTER TABLE items ADD CONSTRAINT stock_not_negative CHECK (stock >= 0);
ALTER TABLE users ADD CONSTRAINT wallet_balance_not_negative CHECK (wallet_balance >= 0.00);