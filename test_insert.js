const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://amfacpwujrkhpspihdrx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZmFjcHd1anJraHBzcGloZHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTg1MTcsImV4cCI6MjA5NTQzNDUxN30.QZ8lMBUbAdb2ciTbyaOnXqpcqxfCSMK2iyx6Fpkwgrk');
const { v4: uuidv4 } = require('uuid');

async function test() {
  const { data, error } = await supabase.from('customers').insert([{
    id: uuidv4(),
    first_name: 'Test',
    last_name: 'User',
    email: 'test@test.com'
  }]);
  console.log('Insert Error:', error);
}
test();
