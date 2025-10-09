-- Add bag configuration support to guild banks
-- This adds a JSON column to store the 6 bag slot configurations

-- Add bag_configs column to guild_banks table
ALTER TABLE public.guild_banks 
ADD COLUMN bag_configs JSONB DEFAULT '[
  {"slotIndex": 0, "bagTypeId": "none"},
  {"slotIndex": 1, "bagTypeId": "none"},
  {"slotIndex": 2, "bagTypeId": "none"},
  {"slotIndex": 3, "bagTypeId": "none"},
  {"slotIndex": 4, "bagTypeId": "none"},
  {"slotIndex": 5, "bagTypeId": "none"}
]'::jsonb;

-- Add a comment to explain the structure
COMMENT ON COLUMN public.guild_banks.bag_configs IS 'JSON array of 6 bag slot configurations. Each object has slotIndex (0-5) and bagTypeId (string).';

-- Create an index for better performance when querying bag configurations
CREATE INDEX IF NOT EXISTS idx_guild_banks_bag_configs ON public.guild_banks USING GIN (bag_configs);

-- Update the updated_at trigger to include bag_configs changes
-- (This assumes there's already a trigger for updated_at, if not, we'll create one)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_guild_banks_updated_at ON public.guild_banks;
CREATE TRIGGER update_guild_banks_updated_at
    BEFORE UPDATE ON public.guild_banks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
