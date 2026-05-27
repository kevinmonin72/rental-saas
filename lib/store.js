import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

const handleError = (error, context) => {
  if (error) {
    console.error(`Erreur Supabase [${context}]:`, error);
    alert(`Erreur système (${context}): ${error.message || 'Problème de connexion à la base de données. Vérifiez vos clés sur Vercel.'}`);
    throw error;
  }
};

const fetchAll = async (table) => {
  let allData = [];
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + limit - 1);
    if (error) return { data: null, error };
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      from += limit;
      if (data.length < limit) hasMore = false;
    } else {
      hasMore = false;
    }
  }
  return { data: allData, error: null };
};

export const useStore = create((set, get) => ({
  equipment: [],
  customers: [],
  bookings: [],
  bookingItems: [],
  isLoaded: false,

  fetchData: async () => {
    const [eqRes, cusRes, bookRes, biRes] = await Promise.all([
      fetchAll('equipment'),
      fetchAll('customers'),
      fetchAll('bookings'),
      fetchAll('booking_items')
    ]);

    if (eqRes.error) handleError(eqRes.error, 'fetch equipment');
    if (cusRes.error) handleError(cusRes.error, 'fetch customers');
    if (bookRes.error) handleError(bookRes.error, 'fetch bookings');
    if (biRes.error) handleError(biRes.error, 'fetch booking items');

    set({
      equipment: eqRes.data || [],
      customers: cusRes.data || [],
      bookings: bookRes.data || [],
      bookingItems: biRes.data || [],
      isLoaded: true
    });
  },

  // Equipment Actions
  addEquipment: async (eq) => {
    const { data, error } = await supabase.from('equipment').insert([{ ...eq, id: uuidv4() }]).select();
    handleError(error, 'addEquipment');
    if (data) {
      set((state) => ({ equipment: [...state.equipment, ...data] }));
    }
  },

  updateEquipment: async (id, updates) => {
    const { data, error } = await supabase.from('equipment').update(updates).eq('id', id).select();
    handleError(error, 'updateEquipment');
    if (data && data.length > 0) {
      set((state) => ({
        equipment: state.equipment.map(e => e.id === id ? data[0] : e)
      }));
    }
  },

  deleteEquipment: async (id) => {
    const { error } = await supabase.from('equipment').delete().eq('id', id);
    handleError(error, 'deleteEquipment');
    set((state) => ({
      equipment: state.equipment.filter(e => e.id !== id),
      bookingItems: state.bookingItems.filter(bi => bi.equipment_id !== id)
    }));
  },
  bulkDeleteEquipment: async (ids) => {
    const { error } = await supabase.from('equipment').delete().in('id', ids);
    handleError(error, 'bulkDeleteEquipment');
    set((state) => ({
      equipment: state.equipment.filter(e => !ids.includes(e.id)),
      bookingItems: state.bookingItems.filter(bi => !ids.includes(bi.equipment_id))
    }));
  },
  bulkImportEquipment: async (items) => {
    const newItems = items.map(i => ({ ...i, quantity: 1, id: uuidv4() }));
    const { error } = await supabase.from('equipment').insert(newItems);
    handleError(error, 'bulkImportEquipment');
    set((state) => ({ equipment: [...state.equipment, ...newItems] }));
  },

  // Customer Actions
  addCustomer: async (customer) => {
    const newCustomer = { ...customer, id: uuidv4() };
    const { error } = await supabase.from('customers').insert([newCustomer]);
    handleError(error, 'addCustomer');
    set((state) => ({ customers: [...state.customers, newCustomer] }));
  },
  deleteCustomer: async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    handleError(error, 'deleteCustomer');
    set((state) => {
      const bookingsToDelete = state.bookings.filter(b => b.customer_id === id).map(b => b.id);
      return {
        customers: state.customers.filter(c => c.id !== id),
        bookings: state.bookings.filter(b => b.customer_id !== id),
        bookingItems: state.bookingItems.filter(bi => !bookingsToDelete.includes(bi.booking_id))
      };
    });
  },
  bulkDeleteCustomers: async (ids) => {
    const { error } = await supabase.from('customers').delete().in('id', ids);
    handleError(error, 'bulkDeleteCustomers');
    set((state) => {
      const bookingsToDelete = state.bookings.filter(b => ids.includes(b.customer_id)).map(b => b.id);
      return {
        customers: state.customers.filter(c => !ids.includes(c.id)),
        bookings: state.bookings.filter(b => !ids.includes(b.customer_id)),
        bookingItems: state.bookingItems.filter(bi => !bookingsToDelete.includes(bi.booking_id))
      };
    });
  },
  bulkImportCustomers: async (customers) => {
    const newCustomers = customers.map(c => ({ ...c, id: uuidv4() }));
    const { error } = await supabase.from('customers').insert(newCustomers);
    handleError(error, 'bulkImportCustomers');
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
      shopify_transfer: false,
      rental_type: bookingData.rentalType || 'ponctuel'
    };
    
    const newBookingItems = bookingData.equipmentIds.map(eqId => ({
      id: uuidv4(),
      booking_id: bookingId,
      equipment_id: eqId,
      quantity: 1
    }));
    
    const bRes = await supabase.from('bookings').insert([newBooking]);
    handleError(bRes.error, 'addBooking');

    const biRes = await supabase.from('booking_items').insert(newBookingItems);
    handleError(biRes.error, 'addBookingItem');

    set((state) => ({
      bookings: [...state.bookings, newBooking],
      bookingItems: [...state.bookingItems, ...newBookingItems]
    }));
  },
  updateBooking: async (bookingId, bookingData) => {
    const updatedBooking = {
      customer_id: bookingData.customerId,
      start_date: bookingData.startDate,
      end_date: bookingData.endDate,
      rental_type: bookingData.rentalType || 'ponctuel',
      pause_start: bookingData.pauseStart || null,
      pause_end: bookingData.pauseEnd || null
    };

    // Update booking in DB
    const { error: updateErr } = await supabase.from('bookings').update(updatedBooking).eq('id', bookingId);
    handleError(updateErr, 'updateBooking');

    // Delete old booking items
    const { error: delErr } = await supabase.from('booking_items').delete().eq('booking_id', bookingId);
    handleError(delErr, 'deleteOldBookingItems');

    // Insert new booking items
    const newBookingItems = bookingData.equipmentIds.map(eqId => ({
      id: uuidv4(),
      booking_id: bookingId,
      equipment_id: eqId,
      quantity: 1
    }));
    const { error: insertErr } = await supabase.from('booking_items').insert(newBookingItems);
    handleError(insertErr, 'insertNewBookingItems');

    set((state) => ({
      bookings: state.bookings.map(b => b.id === bookingId ? { ...b, ...updatedBooking } : b),
      bookingItems: [
        ...state.bookingItems.filter(bi => bi.booking_id !== bookingId),
        ...newBookingItems
      ]
    }));
  },
  deleteBooking: async (id) => {
    // Delete booking_items first to respect foreign keys, or rely on CASCADE if configured.
    // We'll delete booking_items then booking explicitly to be safe.
    await supabase.from('booking_items').delete().eq('booking_id', id);
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    handleError(error, 'deleteBooking');
    set((state) => ({
      bookings: state.bookings.filter(b => b.id !== id),
      bookingItems: state.bookingItems.filter(bi => bi.booking_id !== id)
    }));
  },
  bulkDeleteBookings: async (ids) => {
    await supabase.from('booking_items').delete().in('booking_id', ids);
    const { error } = await supabase.from('bookings').delete().in('id', ids);
    handleError(error, 'bulkDeleteBookings');
    set((state) => ({
      bookings: state.bookings.filter(b => !ids.includes(b.id)),
      bookingItems: state.bookingItems.filter(bi => !ids.includes(bi.booking_id))
    }));
  },
  markBookingCompleted: async (id) => {
    const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', id);
    handleError(error, 'markBookingCompleted');
    set((state) => ({
      bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'completed' } : b)
    }));
  },
  toggleShopifyTransfer: async (id, value) => {
    const { error } = await supabase.from('bookings').update({ shopify_transfer: value }).eq('id', id);
    handleError(error, 'toggleShopifyTransfer');
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
        shopify_transfer: false,
        rental_type: b.rental_type || 'ponctuel'
      });
      newBookingItems.push({
        id: uuidv4(),
        booking_id: bookingId,
        equipment_id: b.equipment_id,
        quantity: 1
      });
    });

    const bRes = await supabase.from('bookings').insert(newBookings);
    handleError(bRes.error, 'bulkImportBookings');

    const biRes = await supabase.from('booking_items').insert(newBookingItems);
    handleError(biRes.error, 'bulkImportBookingItems');

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
        const items = state.bookingItems.filter(bi => bi.booking_id === b.id);
        const equipments = items.map(item => {
          const eq = state.equipment.find(e => e.id === item.equipment_id) || {};
          return { name: eq.name, reference: eq.reference, id: eq.id, quantity: eq.quantity };
        });
        
        return {
          ...b,
          first_name: customer.first_name,
          last_name: customer.last_name,
          equipments: equipments
        };
      });
  },

  getDetailedPastBookings: () => {
    const state = get();
    return state.bookings
      .filter(b => b.status === 'completed')
      .map(b => {
        const customer = state.customers.find(c => c.id === b.customer_id) || {};
        const items = state.bookingItems.filter(bi => bi.booking_id === b.id);
        const equipments = items.map(item => {
          const eq = state.equipment.find(e => e.id === item.equipment_id) || {};
          return { name: eq.name, reference: eq.reference, id: eq.id, quantity: eq.quantity };
        });
        
        return {
          ...b,
          first_name: customer.first_name,
          last_name: customer.last_name,
          equipments: equipments
        };
      })
      .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
  }
}));
