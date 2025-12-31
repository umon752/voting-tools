import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import HomeView from '../views/HomeView.vue';
import AdminView from '../views/AdminView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true }
    }
  ]
});

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth();

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    // Redirect to admin but allow the AdminView to show login
    next();
  } else {
    next();
  }
});

export default router;
