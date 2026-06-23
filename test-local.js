import { readFileSync } from 'fs';
const content = readFileSync('app/bookings/page.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('setBookings')) {
    console.log(`${i+1}: ${line}`);
  }
});
