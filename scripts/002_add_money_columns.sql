-- Add money columns to existing guild_banks table
-- This migration adds the gold, silver, and copper columns if they don't exist

-- Add gold column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'guild_banks' AND column_name = 'gold') THEN
        ALTER TABLE public.guild_banks ADD COLUMN gold integer NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add silver column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'guild_banks' AND column_name = 'silver') THEN
        ALTER TABLE public.guild_banks ADD COLUMN silver integer NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add copper column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'guild_banks' AND column_name = 'copper') THEN
        ALTER TABLE public.guild_banks ADD COLUMN copper integer NOT NULL DEFAULT 0;
    END IF;
END $$;
