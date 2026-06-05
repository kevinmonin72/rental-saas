'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function EspaceClientPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [bookings, setBookings] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [bookingItems, setBookingItems] = useState([]);

  useEffect(() => {
    checkSession();
    fetchEquipment();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      fetchCustomerData(session.user.email);
    } else {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    const { data } = await supabase.from('equipment').select('*');
    if (data) setEquipmentList(data);
  };

  const fetchCustomerData = async (userEmail) => {
    try {
      // Find customer ID
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (customer) {
        // Fetch bookings
        const { data: bks } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        if (bks) {
          setBookings(bks);
          const bkIds = bks.map(b => b.id);
          if (bkIds.length > 0) {
            const { data: items } = await supabase
              .from('booking_items')
              .select('*')
              .in('booking_id', bkIds);
            if (items) setBookingItems(items);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      setUser(data.user);
      fetchCustomerData(data.user.email);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookings([]);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
        <p style={{ color: '#6B7280', fontSize: '18px' }}>Chargement...</p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href="/">
                <img src="/logo.png" alt="The Ridery Logo" style={{ height: '48px', objectFit: 'contain', cursor: 'pointer' }} />
              </Link>
            </div>
            <Link href="/book" style={{ fontSize: '14px', fontWeight: 600, color: '#F97316', textDecoration: 'none' }}>
              Nouvelle réservation
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', width: '100%', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#111827', textAlign: 'center' }}>Mon Espace Client</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px', textAlign: 'center' }}>Connectez-vous pour retrouver vos réservations.</p>
            
            {authError && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Adresse Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jean@example.com"
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Mot de passe</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px' }}
                  required
                />
              </div>
              <button type="submit" style={{ backgroundColor: '#F97316', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: '8px' }}>
                Se connecter
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // DASHBOARD SCREEN
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/book">
              <img src="/logo.png" alt="The Ridery Logo" style={{ height: '48px', objectFit: 'contain', cursor: 'pointer' }} />
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563' }}>Bonjour, {user.user_metadata?.first_name || user.email}</span>
            <button onClick={handleLogout} style={{ fontSize: '14px', fontWeight: 600, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Déconnexion</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px 80px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>Vos Réservations</h1>
          <Link href="/book" style={{ backgroundColor: '#111827', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Nouvelle location
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Aucune réservation</h3>
            <p style={{ color: '#6B7280', fontSize: '15px' }}>Vous n'avez pas encore réservé de matériel chez nous.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {bookings.map(booking => {
              const bItems = bookingItems.filter(bi => bi.booking_id === booking.id);
              const isActive = booking.status === 'active';
              
              const sDate = new Date(booking.start_date);
              const eDate = new Date(booking.end_date);
              
              return (
                <div key={booking.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        Du {sDate.toLocaleDateString('fr-FR')} au {eDate.toLocaleDateString('fr-FR')}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                        {bItems.length} article(s) loué(s)
                      </div>
                    </div>
                    <div>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: 600,
                        backgroundColor: isActive ? '#D1FAE5' : '#F3F4F6',
                        color: isActive ? '#065F46' : '#4B5563'
                      }}>
                        {isActive ? 'En cours' : 'Terminée'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '24px' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {bItems.map(item => {
                        const eq = equipmentList.find(e => e.id === item.equipment_id);
                        if (!eq) return null;
                        return (
                          <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#F3F4F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                              {eq.category.includes('Wing') ? '️' : eq.category.includes('Kite') ? '' : ''}
                            </div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{eq.name}</div>
                              <div style={{ fontSize: '13px', color: '#6B7280' }}>Quantité : {item.quantity}</div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
