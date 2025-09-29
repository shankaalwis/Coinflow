ALTER TABLE public.cashbooks
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

UPDATE public.cashbooks
SET currency = 'USD'
WHERE currency IS NULL;

ALTER TABLE public.cashbooks
  ALTER COLUMN currency DROP DEFAULT;
