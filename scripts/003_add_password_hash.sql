-- Add password_hash column to existing guild_banks table
-- This migration adds the password_hash column if it doesn't exist

-- Add password_hash column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'guild_banks' AND column_name = 'password_hash') THEN
        ALTER TABLE public.guild_banks ADD COLUMN password_hash text NOT NULL DEFAULT '';
    END IF;
END $$;
