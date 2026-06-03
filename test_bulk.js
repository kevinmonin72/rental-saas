const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient('https://amfacpwujrkhpspihdrx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZmFjcHd1anJraHBzcGloZHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTg1MTcsImV4cCI6MjA5NTQzNDUxN30.QZ8lMBUbAdb2ciTbyaOnXqpcqxfCSMK2iyx6Fpkwgrk');

async function test() {
  const newCustomers = [
    { id: uuidv4(), first_name: 'Bulk1', last_name: 'User1', email: 'bulk1@test.com' },
    { id: uuidv4(), first_name: 'Bulk2', last_name: 'User2', email: 'bulk2@test.com' }
  ];
  
  const { data, error } = await supabase.from('customers').insert(newCustomers);
  console.log('Bulk Insert Error:', error);
}
test();
