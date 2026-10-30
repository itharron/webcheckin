import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './assets/styles/theme.css';
import './assets/styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');

// 生产环境注册 Service Worker，支持离线访问
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* 注册失败可忽略 */
    });
  });
}