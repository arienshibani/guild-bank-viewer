-- Add game_mode column to existing guild_banks table
-- This migration adds the game_mode column if it doesn't exist

-- Add game_mode column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'guild_banks' AND column_name = 'game_mode') THEN
        ALTER TABLE public.guild_banks ADD COLUMN game_mode text NOT NULL DEFAULT 'retail';
    END IF;
END $$;
