import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export const useStore = create(
  persist(
    (set, get) => ({
      equipment: [],
      customers: [],
      bookings: [],
      bookingItems: [],

      // Equipment Actions
      addEquipment: (item) => set((state) => ({
        equipment: [...state.equipment, { ...item, quantity: 1, id: uuidv4() }]
      })),
      deleteEquipment: (id) => set((state) => ({
        equipment: state.equipment.filter(e => e.id !== id),
        bookingItems: state.bookingItems.filter(bi => bi.equipment_id !== id) // Cascade delete
      })),
      bulkImportEquipment: (items) => set((state) => {
        const newItems = items.map(i => ({ ...i, quantity: 1, id: uuidv4() }));
        return { equipment: [...state.equipment, ...newItems] };
      }),

      // Customer Actions
      addCustomer: (customer) => set((state) => ({
        customers: [...state.customers, { ...customer, id: uuidv4() }]
      })),
      deleteCustomer: (id) => set((state) => {
        // Cascade delete bookings for this customer
        const bookingsToDelete = state.bookings.filter(b => b.customer_id === id).map(b => b.id);
        return {
          customers: state.customers.filter(c => c.id !== id),
          bookings: state.bookings.filter(b => b.customer_id !== id),
          bookingItems: state.bookingItems.filter(bi => !bookingsToDelete.includes(bi.booking_id))
        };
      }),
      bulkImportCustomers: (customers) => set((state) => {
        const newCustomers = customers.map(c => ({ ...c, id: uuidv4() }));
        return { customers: [...state.customers, ...newCustomers] };
      }),

      // Booking Actions
      addBooking: (bookingData) => set((state) => {
        const bookingId = uuidv4();
        const newBooking = {
          id: bookingId,
          customer_id: bookingData.customerId,
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          status: 'active'
        };
        const newBookingItem = {
          id: uuidv4(),
          booking_id: bookingId,
          equipment_id: bookingData.equipmentId,
          quantity: 1
        };
        return {
          bookings: [...state.bookings, newBooking],
          bookingItems: [...state.bookingItems, newBookingItem]
        };
      }),
      markBookingCompleted: (id) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'completed' } : b)
      })),
      toggleShopifyTransfer: (id, value) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, shopify_transfer: value } : b)
      })),
      bulkImportBookings: (bookingsList) => set((state) => {
        const newBookings = [];
        const newBookingItems = [];
        
        bookingsList.forEach(b => {
          const bookingId = uuidv4();
          newBookings.push({
            id: bookingId,
            customer_id: b.customer_id,
            start_date: b.start_date,
            end_date: b.end_date,
            status: 'active'
          });
          newBookingItems.push({
            id: uuidv4(),
            booking_id: bookingId,
            equipment_id: b.equipment_id,
            quantity: 1
          });
        });

        return {
          bookings: [...state.bookings, ...newBookings],
          bookingItems: [...state.bookingItems, ...newBookingItems]
        };
      }),

      // Utility Selectors
      getDashboardStats: () => {
        const state = get();
        const activeBookings = state.bookings.filter(b => b.status === 'active').length;
        const totalCustomers = state.customers.length;
        
        // Calculate inventory usage
        const equipmentUsage = {};
        const today = new Date();
        today.setHours(0,0,0,0);
        
        // Equipment is considered used ONLY if currently in an active booking that spans today
        state.bookings.filter(b => b.status === 'active').forEach(b => {
          const s = new Date(b.start_date);
          s.setHours(0,0,0,0);
          const e = new Date(b.end_date);
          e.setHours(23,59,59,999);
          if (today >= s && today <= e) {
            state.bookingItems.filter(bi => bi.booking_id === b.id).forEach(bi => {
              equipmentUsage[bi.equipment_id] = 1;
            });
          }
        });

        let availableEquipmentCount = 0;
        state.equipment.forEach(e => {
          if (!equipmentUsage[e.id]) {
            availableEquipmentCount++;
          }
        });

        return {
          activeBookings,
          totalCustomers,
          availableEquipmentCount
        };
      },

      getDetailedActiveBookings: () => {
        const state = get();
        return state.bookings
          .filter(b => b.status === 'active')
          .map(b => {
            const customer = state.customers.find(c => c.id === b.customer_id) || {};
            const item = state.bookingItems.find(bi => bi.booking_id === b.id) || {};
            const equipment = state.equipment.find(e => e.id === item.equipment_id) || {};
            
            return {
              ...b,
              first_name: customer.first_name,
              last_name: customer.last_name,
              equipment_name: equipment.name,
              equipment_reference: equipment.reference,
              quantity: item.quantity
            };
          });
      }

    }),
    {
      name: 'rental-saas-storage', // unique name for localStorage key
    }
  )
);
