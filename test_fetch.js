const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://amfacpwujrkhpspihdrx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZmFjcHd1anJraHBzcGloZHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTg1MTcsImV4cCI6MjA5NTQzNDUxN30.QZ8lMBUbAdb2ciTbyaOnXqpcqxfCSMK2iyx6Fpkwgrk');

async function test() {
  const [eqRes, cusRes, bookRes, biRes] = await Promise.all([
    supabase.from('equipment').select('*'),
    supabase.from('customers').select('*'),
    supabase.from('bookings').select('*'),
    supabase.from('booking_items').select('*')
  ]);
  
  console.log('Customers:', cusRes.data?.length);
  console.log('Equipment:', eqRes.data?.length);
  console.log('Bookings:', bookRes.data?.length);
}
test();
