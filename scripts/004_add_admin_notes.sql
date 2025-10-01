-- Add admin_notes column to existing guild_banks table
-- This migration adds the admin_notes column if it doesn't exist

-- Add admin_notes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'guild_banks' AND column_name = 'admin_notes') THEN
        ALTER TABLE public.guild_banks ADD COLUMN admin_notes text DEFAULT '';
    END IF;
END $$;
