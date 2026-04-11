/**
 * js/supabase.js
 * 
 * IMPORTANT: Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY 
 * with the actual credentials from your Supabase Project Settings -> API.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://sdxctgzpltxzwdvwsrrw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeGN0Z3pwbHR4endkdndzcnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDUwMzIsImV4cCI6MjA4ODMyMTAzMn0.D7U8Dv_7iFJbZzLL91e6ZebNrQoc1R1z9uP3GIrE3FU';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Optional: attach to window if you need to access it from non-module scripts
window.supabase = supabase;
