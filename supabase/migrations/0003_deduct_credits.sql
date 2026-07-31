-- ============================================================
-- WebCraft AI Studio — Migración 0003: Función deduct_credits
-- ============================================================

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type credit_transaction_type,
  p_reference JSONB DEFAULT '{}',
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM credit_transactions WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'Duplicate transaction' USING ERRCODE = '23505';
    END IF;
  END IF;

  -- Lock and read
  SELECT credits_balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: have %, need %', v_balance, p_amount
      USING ERRCODE = 'P0001';
  END IF;

  -- Debit
  UPDATE profiles
  SET credits_balance = credits_balance - p_amount
  WHERE id = p_user_id;

  -- Log
  INSERT INTO credit_transactions (user_id, amount, type, balance_after, reference, idempotency_key)
  VALUES (p_user_id, -p_amount, p_type, v_balance - p_amount, p_reference, p_idempotency_key);

  RETURN v_balance - p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
