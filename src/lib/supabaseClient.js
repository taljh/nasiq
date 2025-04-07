import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hctkgoxttjxhfuzfjypx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjdGtnb3h0dGp4aGZ1emZqeXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUyMjUsImV4cCI6MjA1OTYxMTIyNX0.S4zO3mBtGerZzPFghAxnnIT2D_v_EKf9B930GPGQUeQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
