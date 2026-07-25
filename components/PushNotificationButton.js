'use client';
import { useState, useEffect } from 'react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from([...atob(base64)].map(c => c.charCodeAt(0)));
}

export default function PushNotificationButton() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setStatus(sub ? 'subscribed' : 'unsubscribed');
      });
    }).catch(() => setStatus('unsupported'));
  }, []);

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus('subscribed');
    } catch (err) {
      if (Notification.permission === 'denied') setStatus('denied');
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus('unsubscribed');
    } catch {}
  };

  if (status === 'loading' || status === 'unsupported') return null;

  const isSubscribed = status === 'subscribed';
  const isDenied = status === 'denied';

  return (
    <button
      onClick={isSubscribed ? unsubscribe : isDenied ? undefined : subscribe}
      disabled={isDenied}
      title={isSubscribed ? 'Désactiver les notifications' : isDenied ? 'Notifications bloquées' : 'Activer les notifications push'}
      className={`sidebar-link${isSubscribed ? ' active' : ''}`}
      style={{ background: 'none', border: 'none', cursor: isDenied ? 'not-allowed' : 'pointer', width: '100%', textAlign: 'left', opacity: isDenied ? 0.5 : 1 }}
    >
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
      {isSubscribed ? 'Notifs activées' : isDenied ? 'Notifs bloquées' : 'Activer les notifs'}
    </button>
  );
}
