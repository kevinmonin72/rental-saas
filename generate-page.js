const fs = require('fs');

const originalCode = fs.readFileSync('app/espace-client/page.js', 'utf8');

// The original code up to `// Tailwind classes will be injected`
const splitMarker = "  // Tailwind classes will be injected";
const topPart = originalCode.split(splitMarker)[0];

const newLogic = `  const navItemBase = "w-full flex items-center px-4 py-3 text-sm rounded-xl transition-colors";
  const navItemActive = "bg-gray-900 text-white font-semibold";
  const navItemInactive = "text-gray-600 hover:bg-gray-100";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <style>{\`
        .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .status-active { background-color: #dcfce7; color: #166534; }
        .status-pending { background-color: #fef08a; color: #854d0e; }
        .status-past { background-color: #e5e7eb; color: #374151; }
      \`}</style>

      {/* Top Navbar */}
      {!isInIframe && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-extrabold tracking-tighter text-gray-900">THE RIDERY</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-500">Bonjour, {customerInfo.first_name || user.email}</span>
                        <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold uppercase">
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
                    <button onClick={() => setActiveTab('dashboard')} className={\`\${navItemBase} \${activeTab === 'dashboard' ? navItemActive : navItemInactive}\`}>
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        Vue d'ensemble
                    </button>
                    <button onClick={() => setActiveTab('locations')} className={\`\${navItemBase} \${activeTab === 'locations' ? navItemActive : navItemInactive}\`}>
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Mes Locations
                    </button>
                    <button onClick={() => setActiveTab('cours')} className={\`\${navItemBase} \${activeTab === 'cours' ? navItemActive : navItemInactive}\`}>
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        Mes Cours
                    </button>
                    <button onClick={() => setActiveTab('wingboost')} className={\`\${navItemBase} \${activeTab === 'wingboost' ? navItemActive : navItemInactive}\`}>
                        <svg className={\`w-5 h-5 mr-3 \${activeTab === 'wingboost' ? 'text-white' : 'text-orange-500'}\`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Abo Wingboost
                    </button>
                    <button onClick={() => setActiveTab('commandes')} className={\`\${navItemBase} \${activeTab === 'commandes' ? navItemActive : navItemInactive}\`}>
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        Mes Commandes
                    </button>
                    <hr className="my-4 border-gray-100" />
                    <button onClick={() => setActiveTab('profil')} className={\`\${navItemBase} \${activeTab === 'profil' ? navItemActive : navItemInactive}\`}>
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Mes Infos Persos
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm rounded-xl transition-colors text-red-500 hover:bg-red-50 mt-2">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Se déconnecter
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
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vue d'ensemble</h2>
                    <p className="text-gray-500 mt-1">Bienvenue dans votre espace centralisé The Ridery.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stat 1 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 rounded-full bg-teal-50 text-teal-500 mr-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Locations en cours</p>
                            <p className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'active').length}</p>
                        </div>
                    </div>
                    {/* Stat 2 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Achats Boutique</p>
                            <p className="text-lg font-bold text-gray-900">{shopifyOrders.length} commandes</p>
                        </div>
                    </div>
                    {/* Stat 3 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-500/30 bg-orange-50 flex items-center">
                        <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Wingboost</p>
                            <p className="text-xl font-bold text-gray-900">Non actif</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg mt-8">
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Prêt pour la prochaine session ?</h3>
                        <p className="text-gray-300 mb-6 max-w-md">Réservez votre matériel dès maintenant et partez sur l'eau.</p>
                        <Link href="/book" className="bg-teal-500 hover:bg-teal-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors inline-block">
                            Louer du matériel
                        </Link>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
                        <svg className="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M4 14h7v7l9-11h-7V3L4 14z"></path></svg>
                    </div>
                </div>
            </div>
          )}

          {/* LOCATIONS TAB */}
          {activeTab === 'locations' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Mes Locations</h2>
                    <Link href="/book" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">Nouvelle location</Link>
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
                      <div key={booking.id} className={\`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition \${!isActive ? 'opacity-75' : ''}\`}>
                          <div className={\`border-b border-gray-100 px-6 py-4 flex justify-between items-center \${isActive ? 'bg-gray-50/50' : ''}\`}>
                              <div className="flex items-center space-x-3">
                                  <span className={\`status-badge \${isActive ? 'status-active' : 'status-past'}\`}>{isActive ? 'En cours' : 'Terminée'}</span>
                                  <span className="text-sm font-medium text-gray-500">Réf: LOC-{booking.reference || booking.id.substring(0,8)}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">Du {sDate.toLocaleDateString('fr-FR')} au {eDate.toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="p-6 flex flex-col gap-4">
                              {bItems.map(item => {
                                const eq = equipmentList.find(e => e.id === item.equipment_id);
                                if (!eq) return null;
                                return (
                                  <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                      <div className="flex items-center space-x-6">
                                          <div className="h-20 w-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
                                              {eq.category.includes('Wing') ? '🪁' : eq.category.includes('Kite') ? '🌊' : '🏄‍♂️'}
                                          </div>
                                          <div>
                                              <h3 className="text-lg font-bold text-gray-900">{eq.name}</h3>
                                              <p className="text-gray-500 mt-1">Quantité : {item.quantity}</p>
                                          </div>
                                      </div>
                                  </div>
                                )
                              })}
                          </div>
                      </div>
                    )
                  })
                )}
            </div>
          )}

          {/* COMMANDES TAB (SHOPIFY) */}
          {activeTab === 'commandes' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
                <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Achats Boutique (Shopify)</h2>
                    <p className="text-gray-500 mt-1">Suivez l'expédition de vos commandes The Ridery.</p>
                </div>
                
                {fetchingShopify ? (
                  <div className="text-center p-8 text-gray-500">Chargement de vos commandes Shopify...</div>
                ) : shopifyOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">Aucun achat récent trouvé sur la boutique.</div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                  <tr>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Commande</th>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut / Tracking</th>
                                  </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                  {shopifyOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{order.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.total_price} {order.currency}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={\`status-badge \${order.financial_status === 'paid' ? 'status-active' : 'status-pending'} inline-flex items-center\`}>
                                                {order.financial_status === 'paid' ? 'Payée' : order.financial_status}
                                            </span>
                                            {order.order_status_url && (
                                              <a href={order.order_status_url} target="_blank" className="text-teal-600 text-xs ml-2 underline">Suivi</a>
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
                    <h2 className="text-2xl font-bold text-gray-900">Mes Informations</h2>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {infoMessage && (
                      <div className={\`p-4 rounded-lg mb-6 \${infoMessage.includes('Erreur') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}\`}>
                        {infoMessage}
                      </div>
                    )}
                    <form onSubmit={handleUpdateInfo} className="space-y-6 max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                                <input type="text" value={customerInfo.first_name} onChange={e => setCustomerInfo({...customerInfo, first_name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                <input type="text" value={customerInfo.last_name} onChange={e => setCustomerInfo({...customerInfo, last_name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 outline-none transition" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Email</label>
                            <input type="email" value={user.email} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none" disabled />
                            <p className="text-xs text-gray-500 mt-1">L'email est lié à votre compte Shopify et ne peut être modifié ici.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                            <input type="tel" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 outline-none transition" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Postale</label>
                            <input type="text" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 outline-none transition" />
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-md hover:shadow-lg">
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">{activeTab === 'cours' ? 'Mes Cours' : 'Abonnement Wingboost'}</h3>
              <p>Cette fonctionnalité est en cours de développement et sera disponible prochainement.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('app/espace-client/page.js', topPart + newLogic);
console.log("Updated page.js");
