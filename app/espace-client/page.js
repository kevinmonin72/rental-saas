'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '../../lib/supabase';

export default function EspaceClientPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [bookings, setBookings] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [bookingItems, setBookingItems] = useState([]);
  const [shopifyOrders, setShopifyOrders] = useState([]);
  const [fetchingShopify, setFetchingShopify] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({ id: null, first_name: '', last_name: '', phone: '', address: '' });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [isInIframe, setIsInIframe] = useState(false);

  // Dynamically inject Tailwind CSS to bypass Shopify App Proxy stripping the <head>
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('tailwind-cdn')) {
      const configScript = document.createElement('script');
      configScript.id = 'tailwind-config';
      configScript.innerHTML = `
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                ridery: {
                  teal: '#14b8a6',
                  orange: '#f97316',
                  dark: '#111827',
                  light: '#f9fafb'
                }
              }
            }
          }
        }
      `;
      document.head.appendChild(configScript);

      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'locations', 'cours', 'wingboost', 'commandes', 'profil'

  useEffect(() => {
    let isIframe = false;
    try {
      isIframe = window.self !== window.top || window.self !== window.parent;
    } catch (e) {
      isIframe = true;
    }
    if (isIframe) {
      setIsInIframe(true);
      document.body.style.backgroundColor = 'transparent';
    }
    checkSession();
    fetchEquipment();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      fetchCustomerData(session.user.email);
      fetchShopifyData(session.user.email);
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
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (customer) {
        setCustomerInfo({
          id: customer.id,
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          phone: customer.phone || '',
          address: customer.address || ''
        });

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

  const fetchShopifyData = async (userEmail) => {
    setFetchingShopify(true);
    try {
      const res = await fetch(`/api/shopify/customer-orders?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setShopifyOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Failed to fetch Shopify orders:', e);
    } finally {
      setFetchingShopify(false);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setInfoMessage('');
    let currentId = customerInfo.id;
    if (!currentId) {
      const newId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          id: newId,
          email: user.email,
          first_name: customerInfo.first_name,
          last_name: customerInfo.last_name,
          phone: customerInfo.phone,
          address: customerInfo.address
        }])
        .select()
        .single();
        
      if (error) {
        setInfoMessage('Erreur lors de la création de votre profil.');
        return;
      }
      currentId = data.id;
      setCustomerInfo(prev => ({ ...prev, id: currentId }));
    } else {
      const { error } = await supabase
        .from('customers')
        .update({
          first_name: customerInfo.first_name,
          last_name: customerInfo.last_name,
          phone: customerInfo.phone,
          address: customerInfo.address
        })
        .eq('id', currentId);
      if (error) {
        setInfoMessage('Erreur lors de la mise à jour.');
        return;
      }
    }

    setInfoMessage('Informations mises à jour avec succès.');
    setIsEditingInfo(false);
    await supabase.auth.updateUser({
      data: {
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name
      }
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    if (isSignUp) {
      if (password.length < 6) {
        setAuthError('Le mot de passe doit faire au moins 6 caractères.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: signUpFirstName,
            last_name: signUpLastName,
          }
        }
      });

      if (error) {
        setAuthError('Erreur lors de la création du compte. Cet email est peut-être déjà utilisé.');
        setLoading(false);
      } else {
        if (data.user) {
          const newId = crypto.randomUUID();
          await supabase.from('customers').insert([{
            id: newId,
            email: email,
            first_name: signUpFirstName,
            last_name: signUpLastName,
            phone: signUpPhone,
            address: signUpAddress
          }]);
          setUser(data.user);
          fetchCustomerData(data.user.email);
          fetchShopifyData(data.user.email);
        } else {
          setAuthError('Compte créé, veuillez vérifier votre email (si requis).');
          setLoading(false);
        }
      }
    } else {
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
        fetchShopifyData(data.user.email);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookings([]);
    setShopifyOrders([]);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
        <p style={{ color: '#6B7280', fontSize: '18px' }}>Chargement...</p>
      </div>
    );
  }

  // LOGIN SCREEN (kept as is with inline styles for stability)
  if (!user) {
    return (
      <>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <div style={{ minHeight: '100vh', backgroundColor: isInIframe ? 'transparent' : '#F9FAFB', display: 'flex', flexDirection: 'column' }}>
        {!isInIframe && (
          <header style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/book">
                  <img src="/logo.png" alt="The Ridery Logo" style={{ height: '48px', objectFit: 'contain', cursor: 'pointer' }} />
                </Link>
              </div>
              <Link href="/book" style={{ fontSize: '14px', fontWeight: 600, color: '#F97316', textDecoration: 'none' }}>
                Nouvelle réservation
              </Link>
            </div>
          </header>
        )}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', width: '100%', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#111827', textAlign: 'center' }}>Mon Espace Client</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px', textAlign: 'center' }}>Connectez-vous pour retrouver vos réservations et achats.</p>
            {authError && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>{authError}</div>
            )}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isSignUp && (
                <>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Prénom</label>
                      <input type="text" value={signUpFirstName} onChange={e => setSignUpFirstName(e.target.value)} placeholder="Jean" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px', width: '100%', boxSizing: 'border-box' }} required={isSignUp} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Nom</label>
                      <input type="text" value={signUpLastName} onChange={e => setSignUpLastName(e.target.value)} placeholder="Dupont" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px', width: '100%', boxSizing: 'border-box' }} required={isSignUp} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Téléphone</label>
                    <input type="tel" value={signUpPhone} onChange={e => setSignUpPhone(e.target.value)} placeholder="06 12 34 56 78" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Adresse Postale</label>
                    <input type="text" value={signUpAddress} onChange={e => setSignUpAddress(e.target.value)} placeholder="123 rue de la mer, 75000 Paris" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Adresse Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@example.com" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px', width: '100%', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Mot de passe</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px', width: '100%', boxSizing: 'border-box' }} required />
              </div>
              <button type="submit" style={{ backgroundColor: '#F97316', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: '8px' }}>
                {isSignUp ? "Créer mon compte" : "Se connecter"}
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} style={{ fontSize: '14px', color: '#F97316', textDecoration: 'none', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {isSignUp ? "Déjà un compte ? Se connecter" : "S'inscrire"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Tailwind classes will be injected
  const activeClass = "bg-gray-900 text-white font-semibold";
  const inactiveClass = "text-gray-600 hover:bg-gray-100";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Scripts are injected via useEffect to bypass Shopify App Proxy stripping */}
      <style>{`
        .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .status-active { background-color: #dcfce7; color: #166534; }
        .status-pending { background-color: #fef08a; color: #854d0e; }
        .status-past { background-color: #e5e7eb; color: #374151; }
      `}</style>

      {!isInIframe && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-extrabold tracking-tighter text-ridery-dark">THE RIDERY</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-500">Bonjour, {customerInfo.first_name || user.email}</span>
                <div className="h-8 w-8 rounded-full bg-ridery-teal flex items-center justify-center text-white font-bold uppercase">
                  {(customerInfo.first_name || user.email)[0]}
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24">
            <nav className="space-y-1">
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'dashboard' ? activeClass : inactiveClass}`}>
                <span className="mr-3">📊</span> Vue d'ensemble
              </button>
              <button onClick={() => setActiveTab('locations')} className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'locations' ? activeClass : inactiveClass}`}>
                <span className="mr-3">🏄‍♂️</span> Mes Locations
              </button>
              <button onClick={() => setActiveTab('cours')} className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'cours' ? activeClass : inactiveClass}`}>
                <span className="mr-3">👨‍🏫</span> Mes Cours
              </button>
              <button onClick={() => setActiveTab('wingboost')} className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'wingboost' ? activeClass : inactiveClass}`}>
                <span className="mr-3 text-ridery-orange">🚀</span> Abo Wingboost
              </button>
              <button onClick={() => setActiveTab('commandes')} className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'commandes' ? activeClass : inactiveClass}`}>
                <span className="mr-3">🛍️</span> Achats Boutique
              </button>
              <hr className="my-4 border-gray-100" />
              <button onClick={() => setActiveTab('profil')} className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'profil' ? activeClass : inactiveClass}`}>
                <span className="mr-3">👤</span> Mes Infos Persos
              </button>
              <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm rounded-xl transition-colors text-red-500 hover:bg-red-50 mt-2">
                <span className="mr-3">🚪</span> Se déconnecter
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
              <div>
                <h2 className="text-3xl font-extrabold text-ridery-dark tracking-tight">Vue d'ensemble</h2>
                <p className="text-gray-500 mt-1">Bienvenue dans votre espace centralisé The Ridery.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                  <div className="p-3 rounded-full bg-teal-50 text-ridery-teal mr-4 text-2xl">🏄‍♂️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Locations en cours</p>
                    <p className="text-2xl font-bold text-ridery-dark">{bookings.filter(b => b.status === 'active').length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                  <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4 text-2xl">🛍️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Achats Boutique</p>
                    <p className="text-lg font-bold text-ridery-dark">{shopifyOrders.length} commandes</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-ridery-orange/30 bg-orange-50/30 flex items-center">
                  <div className="p-3 rounded-full bg-orange-100 text-ridery-orange mr-4 text-2xl">🚀</div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Wingboost</p>
                    <p className="text-xl font-bold text-ridery-dark">Non actif</p>
                  </div>
                </div>
              </div>

              <div className="bg-ridery-dark rounded-2xl p-8 text-white relative overflow-hidden shadow-lg mt-8">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">Prêt pour la prochaine session ?</h3>
                  <p className="text-gray-300 mb-6 max-w-md">Réservez votre matériel dès maintenant et partez sur l'eau.</p>
                  <Link href="/book" className="bg-ridery-teal hover:bg-teal-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors inline-block">
                    Louer du matériel
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* LOCATIONS TAB */}
          {activeTab === 'locations' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-ridery-dark">Mes Locations</h2>
                <Link href="/book" className="bg-ridery-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">Nouvelle location</Link>
              </div>

              {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">Aucune location pour le moment.</div>
              ) : (
                bookings.map(booking => {
                  const bItems = bookingItems.filter(bi => bi.booking_id === booking.id);
                  const isActive = booking.status === 'active';
                  const sDate = new Date(booking.start_date);
                  const eDate = new Date(booking.end_date);
                  
                  return (
                    <div key={booking.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition ${!isActive && 'opacity-75'}`}>
                      <div className={`border-b border-gray-100 px-6 py-4 flex justify-between items-center ${isActive ? 'bg-gray-50/50' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <span className={`status-badge ${isActive ? 'status-active' : 'status-past'}`}>{isActive ? 'En cours' : 'Terminée'}</span>
                          <span className="text-sm font-medium text-gray-500">Réf: #{booking.reference || booking.id.substring(0,8)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Du {sDate.toLocaleDateString('fr-FR')} au {eDate.toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="p-6">
                        {bItems.map(item => {
                          const eq = equipmentList.find(e => e.id === item.equipment_id);
                          if (!eq) return null;
                          return (
                            <div key={item.id} className="flex items-center space-x-6 mb-4 last:mb-0">
                              <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                                {eq.category.includes('Wing') ? '🪁' : eq.category.includes('Kite') ? '🌊' : '🏄‍♂️'}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-ridery-dark">{eq.name}</h3>
                                <p className="text-gray-500 mt-1">Quantité : {item.quantity}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* COMMANDES TAB */}
          {activeTab === 'commandes' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-ridery-dark">Achats Boutique (Shopify)</h2>
                <p className="text-gray-500 mt-1">Suivez vos commandes passées sur The Ridery.</p>
              </div>

              {fetchingShopify ? (
                <div className="text-center p-8 text-gray-500">Chargement de vos commandes Shopify...</div>
              ) : shopifyOrders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                  Aucun achat récent trouvé sur la boutique.
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Commande</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paiement / Statut</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shopifyOrders.map(order => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-ridery-dark">{order.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.total_price} {order.currency}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`status-badge ${order.financial_status === 'paid' ? 'status-active' : 'status-pending'} inline-flex items-center`}>
                                {order.financial_status === 'paid' ? 'Payée' : order.financial_status}
                              </span>
                              {order.order_status_url && (
                                <a href={order.order_status_url} target="_blank" className="text-ridery-teal text-xs ml-2 underline">Suivi</a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROFIL TAB */}
          {activeTab === 'profil' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-ridery-dark">Mes Informations</h2>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {infoMessage && (
                  <div className={`p-4 rounded-lg mb-6 ${infoMessage.includes('Erreur') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {infoMessage}
                  </div>
                )}
                
                <form onSubmit={handleUpdateInfo} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                      <input type="text" value={customerInfo.first_name} onChange={e => setCustomerInfo({...customerInfo, first_name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ridery-teal focus:border-ridery-teal outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input type="text" value={customerInfo.last_name} onChange={e => setCustomerInfo({...customerInfo, last_name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ridery-teal focus:border-ridery-teal outline-none transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Email</label>
                    <input type="email" value={user.email} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input type="tel" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ridery-teal focus:border-ridery-teal outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Postale</label>
                    <input type="text" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ridery-teal focus:border-ridery-teal outline-none transition" />
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button type="submit" className="bg-ridery-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-md hover:shadow-lg">
                      Sauvegarder les modifications
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* COURS & WINGBOOST (Placholders) */}
          {(activeTab === 'cours' || activeTab === 'wingboost') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500 animate-[fadeIn_0.3s_ease-in-out]">
              <div className="text-4xl mb-4">{activeTab === 'cours' ? '👨‍🏫' : '🚀'}</div>
              <h3 className="text-xl font-bold text-ridery-dark mb-2">{activeTab === 'cours' ? 'Mes Cours' : 'Abonnement Wingboost'}</h3>
              <p>Cette fonctionnalité est en cours de développement et sera disponible prochainement.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
