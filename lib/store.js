import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabaseProxy as supabase } from './supabase-proxy';

const handleError = (error, context) => {
  if (error) {
    console.error(`Erreur Supabase [${context}]:`, error);
    alert(`Erreur système (${context}): ${error.message || 'Problème de connexion à la base de données. Vérifiez vos clés sur Vercel.'}`);
    throw error;
  }
};

const DB_NAME = 'rental-saas-db';
const STORE_NAME = 'cache';

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('ssr');
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const loadCache = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('rental-saas-cache');
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch (e) { return null; }
};

const saveCache = async (data) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, 'rental-saas-cache');
  } catch (e) { console.error('saveCache error', e); }
};

const fetchAll = async (table, location = null) => {
  // First get the count
  let countQuery = supabase.from(table).select('id', { count: 'exact' }).limit(1);
  if (location && table === 'bookings') {
    countQuery = countQuery.eq('location', location);
  }
  const { count, error: countError } = await countQuery;
  if (countError) return { data: null, error: countError };
  if (!count) return { data: [], error: null };

  const limit = 1000;
  const promises = [];
  for (let from = 0; from < count; from += limit) {
    let query = supabase.from(table).select('*').order('id').range(from, from + limit - 1);
    if (location && table === 'bookings') {
      query = query.eq('location', location);
    }
    promises.push(query);
  }

  const results = await Promise.all(promises);
  const allData = [];
  for (const res of results) {
    if (res.error) return { data: null, error: res.error };
    if (res.data) allData.push(...res.data);
  }
  return { data: allData, error: null };
};

export const useStore = create((set, get) => ({
  location: (typeof window !== 'undefined' ? localStorage.getItem('admin_location') : null) || 'marseille',
  setLocation: (loc) => {
    if (typeof window !== 'undefined') localStorage.setItem('admin_location', loc);
    set({ location: loc, isLoaded: false });
    get().fetchData();
  },
  equipment: [],
  customers: [],
  bookings: [],
  bookingItems: [],
  isLoaded: false,
  authFailed: false,

  fetchData: async () => {
    const currentLoc = get().location;
    // Stale-while-revalidate : affiche le cache instantanément puis rafraîchit
    const cached = await loadCache();
    if (cached && !get().isLoaded) {
      set({
        equipment: cached.equipment || [],
        customers: cached.customers || [],
        bookings: cached.bookings || [],
        bookingItems: cached.bookingItems || [],
        isLoaded: true
      });
    }

    try {
      const [eqRes, cusRes, bookRes, biRes] = await Promise.all([
        fetchAll('equipment', currentLoc),
        fetchAll('customers', currentLoc),
        fetchAll('bookings', currentLoc),
        fetchAll('booking_items') // booking_items is filtered automatically because it joins on bookings, but wait, fetching all booking_items might be slow. That's fine for now.
      ]);

      // Detect auth failure (proxy returns Unauthorized)
      const results = [eqRes, cusRes, bookRes, biRes];
      const authError = results.some(r => r.error && (
        String(r.error.message).toLowerCase().includes('unauthorized') ||
        String(r.error.details).toLowerCase().includes('unauthorized')
      ));
      if (authError) {
        if (typeof window !== 'undefined') sessionStorage.removeItem('admin_token');
        set({ authFailed: true });
        return;
      }

      if (eqRes.error) handleError(eqRes.error, 'fetch equipment');
      if (cusRes.error) handleError(cusRes.error, 'fetch customers');
      if (bookRes.error) handleError(bookRes.error, 'fetch bookings');
      if (biRes.error) handleError(biRes.error, 'fetch booking items');

      let equipmentData = eqRes.data || [];
      const biData = biRes.data || [];
      const bookData = bookRes.data || [];

      // Fetch equipment that is linked to current bookings but physically in another location
      const bookingIds = new Set(bookData.map(b => b.id));
      const neededEquipmentIds = new Set();
      biData.forEach(bi => {
        if (bookingIds.has(bi.booking_id) && bi.equipment_id) {
          neededEquipmentIds.add(bi.equipment_id);
        }
      });
      equipmentData.forEach(eq => neededEquipmentIds.delete(eq.id));

      if (neededEquipmentIds.size > 0) {
        const missingIds = Array.from(neededEquipmentIds);
        try {
          // Fetch the missing equipment in chunks or simply all together since missingIds is usually small
          const { data: missingData, error } = await supabase
            .from('equipment')
            .select('*')
            .in('id', missingIds);
            
          if (!error && missingData) {
            equipmentData = [...equipmentData, ...missingData];
          }
        } catch (e) {
          console.error("Failed to fetch cross-location equipment:", e);
        }
      }

      set({
        equipment: equipmentData,
        customers: cusRes.data || [],
        bookings: bookData,
        bookingItems: biData,
        isLoaded: true,
        authFailed: false
      });
    } catch (err) {
      console.error('[store] fetchData error:', err);
      if (!get().isLoaded) set({ isLoaded: true });
    }
  },

  // Equipment Actions
  addEquipment: async (eq) => {
    const currentLoc = get().location;
    const { data, error } = await supabase.from('equipment').insert([{ ...eq, id: uuidv4(), location: currentLoc }]).select();
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
    const currentLoc = get().location;
    const newItems = items.map(i => ({ ...i, quantity: parseInt(i.quantity, 10) || 1, id: uuidv4(), location: currentLoc }));
    const { error } = await supabase.from('equipment').insert(newItems);
    handleError(error, 'bulkImportEquipment');
    set((state) => ({ equipment: [...state.equipment, ...newItems] }));
  },
  resolveEquipmentConflicts: async (actions) => {
    // actions is an array of { action: 'add_stock' | 'create_new' | 'skip', importedItem, existingItem }
    const toCreate = [];
    const toUpdateStock = [];

    const currentLoc = get().location;
    for (const a of actions) {
      if (a.action === 'skip') continue;
      if (a.action === 'create_new') {
        toCreate.push({ ...a.importedItem, quantity: parseInt(a.importedItem.quantity, 10) || 1, id: uuidv4(), location: currentLoc });
      } else if (a.action === 'add_stock') {
        const addQty = parseInt(a.importedItem.quantity, 10) || 1;
        toUpdateStock.push({ id: a.existingItem.id, addQty });
      }
    }

    // Insert new items
    if (toCreate.length > 0) {
      const { error } = await supabase.from('equipment').insert(toCreate);
      handleError(error, 'resolveConflicts:create');
    }

    // Update stock for existing items one by one
    for (const item of toUpdateStock) {
      const existing = get().equipment.find(e => e.id === item.id);
      if (existing) {
        const newQty = (parseInt(existing.quantity, 10) || 1) + item.addQty;
        const { error } = await supabase.from('equipment').update({ quantity: newQty }).eq('id', item.id);
        handleError(error, 'resolveConflicts:updateStock');
      }
    }

    // Update local state
    set((state) => {
      let updatedEquipment = [...state.equipment, ...toCreate];
      for (const item of toUpdateStock) {
        updatedEquipment = updatedEquipment.map(e => {
          if (e.id === item.id) {
            return { ...e, quantity: (parseInt(e.quantity, 10) || 1) + item.addQty };
          }
          return e;
        });
      }
      return { equipment: updatedEquipment };
    });
  },

  // Customer Actions
  addCustomer: async (customer) => {
    const newCustomer = { ...customer, id: uuidv4() };
    const { error } = await supabase.from('customers').insert([newCustomer]);
    handleError(error, 'addCustomer');
    set((state) => ({ customers: [...state.customers, newCustomer] }));
    return newCustomer;
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
  updateCustomer: async (id, updates) => {
    const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select();
    handleError(error, 'updateCustomer');
    if (data && data.length > 0) {
      set((state) => ({
        customers: state.customers.map(c => c.id === id ? data[0] : c)
      }));
    }
  },
  resolveCustomerConflicts: async (actions) => {
    const toCreate = [];
    const toUpdate = [];

    for (const a of actions) {
      if (a.action === 'skip') continue;
      if (a.action === 'create_new') {
        toCreate.push({ ...a.importedItem, id: uuidv4() });
      } else if (a.action === 'update_existing') {
        toUpdate.push({ id: a.existingItem.id, updates: a.importedItem });
      }
    }

    if (toCreate.length > 0) {
      const { error } = await supabase.from('customers').insert(toCreate);
      handleError(error, 'resolveCustomerConflicts:create');
    }

    for (const item of toUpdate) {
      const { error } = await supabase.from('customers').update(item.updates).eq('id', item.id);
      handleError(error, 'resolveCustomerConflicts:update');
    }

    set((state) => {
      let updatedCustomers = [...state.customers, ...toCreate];
      for (const item of toUpdate) {
        updatedCustomers = updatedCustomers.map(c => c.id === item.id ? { ...c, ...item.updates } : c);
      }
      return { customers: updatedCustomers };
    });
  },

  // Booking Actions
  addBooking: async (bookingData) => {
    const bookingId = uuidv4();
    const rentalType = bookingData.rentalType || 'ponctuel';
    
    // Generate incremental reference
    const prefixes = {
      'ponctuel': 'RP',
      'wingboost': 'RW',
      'demi_matin': 'RM',
      'demi_aprem': 'RA'
    };
    const prefix = prefixes[rentalType] || 'RX';
    const sameTypeBookings = get().bookings.filter(b => (b.rental_type || 'ponctuel') === rentalType);
    let maxNum = 0;
    sameTypeBookings.forEach(b => {
      if (b.reference && b.reference.startsWith(prefix)) {
        const num = parseInt(b.reference.replace(prefix, ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    const ref = `${prefix}${String(nextNum).padStart(4, '0')}`;

    const currentLoc = get().location;
    const newBooking = {
      id: bookingId,
      customer_id: bookingData.customerId,
      start_date: bookingData.startDate,
      end_date: bookingData.endDate,
      status: 'active',
      shopify_transfer: false,
      rental_type: rentalType,
      reference: ref,
      location: currentLoc,
      notes: bookingData.notes || null
    };
    
    const newBookingItems = (bookingData.equipments || bookingData.equipmentIds || []).map(eq => {
      // Handle both old array of IDs and new array of objects
      const isObj = typeof eq === 'object';
      const eqId = isObj ? eq.id : eq;
      return {
        id: uuidv4(),
        booking_id: bookingId,
        equipment_id: eqId,
        quantity: 1,
        start_date: isObj ? (eq.customStart || null) : null,
        end_date: isObj ? (eq.customEnd || null) : null,
        is_returned: isObj ? (eq.is_returned || false) : false
      };
    });
    
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
      pause_end: bookingData.pauseEnd || null,
      notes: bookingData.notes || null
    };

    // Update booking in DB
    const { error: updateErr } = await supabase.from('bookings').update(updatedBooking).eq('id', bookingId);
    handleError(updateErr, 'updateBooking');

    // Delete old booking items
    const { error: delErr } = await supabase.from('booking_items').delete().eq('booking_id', bookingId);
    handleError(delErr, 'deleteOldBookingItems');

    // Insert new booking items
    const newBookingItems = (bookingData.equipments || bookingData.equipmentIds || []).map(eq => {
      const isObj = typeof eq === 'object';
      const eqId = isObj ? eq.id : eq;
      return {
        id: uuidv4(),
        booking_id: bookingId,
        equipment_id: eqId,
        quantity: 1,
        start_date: isObj ? (eq.customStart || null) : null,
        end_date: isObj ? (eq.customEnd || null) : null,
        is_returned: isObj ? (eq.is_returned || false) : false
      };
    });
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
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    handleError(error, 'deleteBooking');
    set((state) => ({
      bookings: state.bookings.filter(b => b.id !== id),
      bookingItems: state.bookingItems.filter(bi => bi.booking_id !== id)
    }));
  },
  deleteBookingItem: async (bookingItemId) => {
    const { error } = await supabase.from('booking_items').delete().eq('id', bookingItemId);
    handleError(error, 'deleteBookingItem');
    if (!error) {
      set((state) => ({
        bookingItems: state.bookingItems.filter(bi => bi.id !== bookingItemId)
      }));
    }
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
  updateBookingStatus: async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    handleError(error, 'updateBookingStatus');
    set((state) => ({
      bookings: state.bookings.map(b => b.id === id ? { ...b, status } : b)
    }));
  },
  updateBookingNotes: async (id, notes) => {
    const { error } = await supabase.from('bookings').update({ notes }).eq('id', id);
    handleError(error, 'updateBookingNotes');
    set((state) => ({
      bookings: state.bookings.map(b => b.id === id ? { ...b, notes } : b)
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
    
    const currentLoc = get().location;
    bookingsList.forEach(b => {
      const bookingId = uuidv4();
      newBookings.push({
        id: bookingId,
        customer_id: b.customer_id,
        start_date: b.start_date,
        end_date: b.end_date,
        status: 'active',
        shopify_transfer: false,
        rental_type: b.rental_type || 'ponctuel',
        location: currentLoc
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
    const active = state.bookings.filter(b => b.status === 'active');
    const totalCustomers = state.customers.length;
    
    const equipmentUsage = {};
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Index booking_items par booking_id (O(n) au lieu de O(n²))
    const itemsByBooking = new Map();
    state.bookingItems.forEach(bi => {
      if (!itemsByBooking.has(bi.booking_id)) itemsByBooking.set(bi.booking_id, []);
      itemsByBooking.get(bi.booking_id).push(bi);
    });
    
    active.forEach(b => {
      const s = new Date(b.start_date);
      s.setHours(0,0,0,0);
      const e = new Date(b.end_date);
      e.setHours(23,59,59,999);
      if (today >= s && today <= e) {
        (itemsByBooking.get(b.id) || []).forEach(bi => {
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

    return { activeBookings: active.length, totalCustomers, availableEquipmentCount };
  },

  getDetailedActiveBookings: () => {
    const state = get();
    const customerMap = new Map(state.customers.map(c => [c.id, c]));
    const equipmentMap = new Map(state.equipment.map(e => [e.id, e]));
    const itemsByBooking = new Map();
    state.bookingItems.forEach(bi => {
      if (!itemsByBooking.has(bi.booking_id)) itemsByBooking.set(bi.booking_id, []);
      itemsByBooking.get(bi.booking_id).push(bi);
    });

    return state.bookings
      .filter(b => b.status === 'active' || b.status === 'attente_paiement')
      .map(b => {
        const customer = customerMap.get(b.customer_id) || {};
        const items = itemsByBooking.get(b.id) || [];
        const equipments = items.map(item => {
          const eq = equipmentMap.get(item.equipment_id) || {};
          return { name: eq.name, reference: eq.reference, id: eq.id, quantity: eq.quantity, customStart: item.start_date, customEnd: item.end_date, is_returned: item.is_returned };
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
    const customerMap = new Map(state.customers.map(c => [c.id, c]));
    const equipmentMap = new Map(state.equipment.map(e => [e.id, e]));
    const itemsByBooking = new Map();
    state.bookingItems.forEach(bi => {
      if (!itemsByBooking.has(bi.booking_id)) itemsByBooking.set(bi.booking_id, []);
      itemsByBooking.get(bi.booking_id).push(bi);
    });

    return state.bookings
      .filter(b => b.status === 'completed')
      .map(b => {
        const customer = customerMap.get(b.customer_id) || {};
        const items = itemsByBooking.get(b.id) || [];
        const equipments = items.map(item => {
          const eq = equipmentMap.get(item.equipment_id) || {};
          return { name: eq.name, reference: eq.reference, id: eq.id, quantity: eq.quantity, customStart: item.start_date, customEnd: item.end_date, is_returned: item.is_returned };
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

// Persistance automatique du cache à chaque changement d'état
useStore.subscribe((state) => {
  if (state.isLoaded) {
    saveCache({
      equipment: state.equipment,
      customers: state.customers,
      bookings: state.bookings,
      bookingItems: state.bookingItems,
    });
  }
});
