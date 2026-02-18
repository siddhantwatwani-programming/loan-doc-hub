
-- Add multi-state support to packets table
ALTER TABLE public.packets ADD COLUMN IF NOT EXISTS all_states boolean NOT NULL DEFAULT false;
ALTER TABLE public.packets ADD COLUMN IF NOT EXISTS states text[] DEFAULT ARRAY[]::text[];

-- Migrate existing single state data into the new states array
UPDATE public.packets 
SET states = ARRAY[state]
WHERE state IS NOT NULL AND state != '' AND state != 'TBD' AND (states IS NULL OR array_length(states, 1) IS NULL);
