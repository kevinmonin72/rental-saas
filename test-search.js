const bookings = [
  { id: '1', reference: 'RW0001' },
  { id: '2', reference: 'RW0002' }
];

const equipmentSearch = "#RW";

const foundBookingRef = equipmentSearch.trim().replace(/^#/, '').toUpperCase();
let matchingBookingForEquipments = null;
if (foundBookingRef.length >= 2) {
  matchingBookingForEquipments = bookings.find(b => (b.reference || '').toUpperCase() === foundBookingRef);
  if (!matchingBookingForEquipments) {
    matchingBookingForEquipments = bookings.find(b => (b.reference || '').toUpperCase().includes(foundBookingRef));
  }
}

console.log(matchingBookingForEquipments);
