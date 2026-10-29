import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/roster',
    name: 'roster',
    component: () => import('@/views/RosterView.vue'),
    meta: { title: '人员名单' },
  },
  {
    path: '/rollcall',
    name: 'rollcall',
    component: () => import('@/views/RollCallView.vue'),
    meta: { title: '签到' },
  },
  {
    path: '/records',
    name: 'records',
    component: () => import('@/views/RecordsView.vue'),
    meta: { title: '签到记录' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  // 使用 hash 模式，纯静态部署无需服务端路由配置
  history: createWebHashHistory(),
  routes,
});

router.afterEach((to) => {
  const title = to.meta?.title as string | undefined;
  document.title = title ? `${title} · 点名签到系统` : '点名签到系统';
});

export default router;