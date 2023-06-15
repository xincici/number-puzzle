import { createApp } from 'vue';

import i18n from './plugins/i18n';

import App from './App.vue';

import 'virtual:uno.css';

createApp(App)
  .use(i18n)
  .mount('#app');

if (process.env.NODE_ENV === 'production') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        console.log('Service Worker Registered');
      });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}
