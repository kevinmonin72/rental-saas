import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amfacpwujrkhpspihdrx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZmFjcHd1anJraHBzcGloZHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTg1MTcsImV4cCI6MjA5NTQzNDUxN30.QZ8lMBUbAdb2ciTbyaOnXqpcqxfCSMK2iyx6Fpkwgrk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
