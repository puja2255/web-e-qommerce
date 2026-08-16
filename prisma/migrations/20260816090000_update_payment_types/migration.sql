-- Rename payment enum values to match the new payment options.
ALTER TYPE "PaymentType" RENAME VALUE 'DANA' TO 'E_WALLET';
ALTER TYPE "PaymentType" RENAME VALUE 'BANK' TO 'BANK_TRANSFER';
