import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

export const useStore = create((set, get) => ({
  equipment: [],
  customers: [],
  bookings: [],
  bookingItems: [],
  isLoaded: false,

  fetchData: async () => {
    const [eqRes, cusRes, bookRes, biRes] = await Promise.all([
      supabase.from('equipment').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('bookings').select('*'),
      supabase.from('booking_items').select('*')
    ]);

    set({
      equipment: eqRes.data || [],
      customers: cusRes.data || [],
      bookings: bookRes.data || [],
      bookingItems: biRes.data || [],
      isLoaded: true
    });
  },

  // Equipment Actions
  addEquipment: async (item) => {
    const newItem = { ...item, quantity: 1, id: uuidv4() };
    await supabase.from('equipment').insert([newItem]);
    set((state) => ({ equipment: [...state.equipment, newItem] }));
  },
  deleteEquipment: async (id) => {
    await supabase.from('equipment').delete().eq('id', id);
    set((state) => ({
      equipment: state.equipment.filter(e => e.id !== id),
      bookingItems: state.bookingItems.filter(bi => bi.equipment_id !== id)
    }));
  },
  bulkImportEquipment: async (items) => {
    const newItems = items.map(i => ({ ...i, quantity: 1, id: uuidv4() }));
    await supabase.from('equipment').insert(newItems);
    set((state) => ({ equipment: [...state.equipment, ...newItems] }));
  },

  // Customer Actions
  addCustomer: async (customer) => {
    const newCustomer = { ...customer, id: uuidv4() };
    await supabase.from('customers').insert([newCustomer]);
    set((state) => ({ customers: [...state.customers, newCustomer] }));
  },
  deleteCustomer: async (id) => {
    await supabase.from('customers').delete().eq('id', id);
    set((state) => {
      const bookingsToDelete = state.bookings.filter(b => b.customer_id === id).map(b => b.id);
      return {
        customers: state.customers.filter(c => c.id !== id),
        bookings: state.bookings.filter(b => b.customer_id !== id),
        bookingItems: state.bookingItems.filter(bi => !bookingsToDelete.includes(bi.booking_id))
      };
    });
  },
  bulkImportCustomers: async (customers) => {
    const newCustomers = customers.map(c => ({ ...c, id: uuidv4() }));
    await supabase.from('customers').insert(newCustomers);
    set((state) => ({ customers: [...state.customers, ...newCustomers] }));
  },

  // Booking Actions
  addBooking: async (bookingData) => {
    const bookingId = uuidv4();
    const newBooking = {
      id: bookingId,
      customer_id: bookingData.customerId,
      start_date: bookingData.startDate,
      end_date: bookingData.endDate,
      status: 'active',
      shopify_transfer: false
    };
    const newBookingItem = {
      id: uuidv4(),
      booking_id: bookingId,
      equipment_id: bookingData.equipmentId,
      quantity: 1
    };
    
    await Promise.all([
      supabase.from('bookings').insert([newBooking]),
      supabase.from('booking_items').insert([newBookingItem])
    ]);

    set((state) => ({
      bookings: [...state.bookings, newBooking],
      bookingItems: [...state.bookingItems, newBookingItem]
    }));
  },
  markBookingCompleted: async (id) => {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', id);
    set((state) => ({
      bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'completed' } : b)
    }));
  },
  toggleShopifyTransfer: async (id, value) => {
    await supabase.from('bookings').update({ shopify_transfer: value }).eq('id', id);
    set((state) => ({
      bookings: state.bookings.map(b => b.id === id ? { ...b, shopify_transfer: value } : b)
    }));
  },
  bulkImportBookings: async (bookingsList) => {
    const newBookings = [];
    const newBookingItems = [];
    
    bookingsList.forEach(b => {
      const bookingId = uuidv4();
      newBookings.push({
        id: bookingId,
        customer_id: b.customer_id,
        start_date: b.start_date,
        end_date: b.end_date,
        status: 'active',
        shopify_transfer: false
      });
      newBookingItems.push({
        id: uuidv4(),
        booking_id: bookingId,
        equipment_id: b.equipment_id,
        quantity: 1
      });
    });

    await Promise.all([
      supabase.from('bookings').insert(newBookings),
      supabase.from('booking_items').insert(newBookingItems)
    ]);

    set((state) => ({
      bookings: [...state.bookings, ...newBookings],
      bookingItems: [...state.bookingItems, ...newBookingItems]
    }));
  },

  // Utility Selectors
  getDashboardStats: () => {
    const state = get();
    const activeBookings = state.bookings.filter(b => b.status === 'active').length;
    const totalCustomers = state.customers.length;
    
    const equipmentUsage = {};
    const today = new Date();
    today.setHours(0,0,0,0);
    
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

    return { activeBookings, totalCustomers, availableEquipmentCount };
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
}));
