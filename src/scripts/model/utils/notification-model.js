// src/models/NotificationModel.js

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class NotificationModel {
  constructor() {
    this._vapidPublicKey = VAPID_PUBLIC_KEY;
  }

  async subscribeUserToPush(token) { // Token di-inject
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Service Worker or Push API not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(this._vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      console.log('Push Subscription:', subscription);
      return await this._sendSubscriptionToBackend(subscription, token);
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
      throw error;
    }
  }

  async _sendSubscriptionToBackend(subscription, token) { // Token di-inject
    if (!token) {
      console.error('No auth token found');
      throw new Error('Authentication token is missing.'); // Lempar error, jangan alihkan halaman
    }

    const subscribeUrl = 'https://story-api.dicoding.dev/v1/notifications/subscribe';

    console.log('Preparing subscription data for backend...');
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    if (!p256dhKey || !authKey) {
      console.error('Subscription keys are missing');
      throw new Error('Subscription keys are missing');
    }
    const body = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
        auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
      },
    };

    console.log('Sending subscription to backend:', body);

    try {
      const response = await fetch(subscribeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Backend subscription error:', data);
        throw new Error(data.message || 'Failed to send subscription to backend');
      }
      console.log('Backend subscription successful:', data);
      return data;
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  async unsubscribeUserFromPush(token) { // Token di-inject
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        const didUnsubscribe = await subscription.unsubscribe();

        if (didUnsubscribe) {
          console.log('User unsubscribed successfully.');
          return await this._sendUnsubscriptionToBackend(endpoint, token);
        } else {
          throw new Error('Failed to unsubscribe the user from browser.');
        }
      } else {
        console.log('No active push subscription found.');
        return null;
      }
    } catch (error) {
      console.error('Failed to unsubscribe the user: ', error);
      throw error;
    }
  }

  async _sendUnsubscriptionToBackend(endpoint, token) { // Token di-inject
    if (!token) {
      console.error('No auth token found');
      throw new Error('Authentication token is missing.');
    }

    const unsubscribeUrl = 'https://story-api.dicoding.dev/v1/notifications/subscribe';

    const body = {
      endpoint: endpoint,
    };

    try {
      const response = await fetch(unsubscribeUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send unsubscription to backend');
      }
      console.log('Unsubscription sent to backend successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending unsubscription to backend:', error);
      throw error;
    }
  }

  async getSubscriptionStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { supported: false, subscribed: false, error: 'Push notification not supported' };
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return { supported: true, subscribed: !!subscription };
    } catch (error) {
      return { supported: true, subscribed: false, error: 'Failed to check subscription status.' };
    }
  }
}

export default NotificationModel;