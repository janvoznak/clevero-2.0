import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import AdminLayout from './layouts/AdminLayout.vue'
import NewsList from './views/news/NewsList.vue'
import NewsEdit from './views/news/NewsEdit.vue'
import EventsList from './views/events/EventsList.vue'
import EventDetail from './views/events/EventDetail.vue'
import PopupList from './views/popups/PopupList.vue'
import PopupEdit from './views/popups/PopupEdit.vue'
import Placeholder from './views/Placeholder.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/admin/news/list' },
        { path: 'admin/news/list', name: 'news-list', component: NewsList },
        { path: 'admin/news/new', name: 'news-new', component: NewsEdit },
        { path: 'admin/news/:id/edit', name: 'news-edit', component: NewsEdit, props: true },
        { path: 'admin/events', name: 'events-list', component: EventsList },
        { path: 'admin/events/new', name: 'event-new', component: EventDetail },
        { path: 'admin/events/:id', name: 'event-detail', component: EventDetail, props: true },
        { path: 'admin/popups/list', name: 'popups-list', component: PopupList },
        { path: 'admin/popups/new', name: 'popup-new', component: PopupEdit },
        { path: 'admin/popups/:id/edit', name: 'popup-edit', component: PopupEdit, props: true },
        { path: 'admin/:section+', name: 'placeholder', component: Placeholder },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

createApp(App).use(router).mount('#app')
