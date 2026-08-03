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
import PopupEditCanvas from './views/popups/PopupEditCanvas.vue'
import PageList from './views/pages/PageList.vue'
import PageEdit from './views/pages/PageEdit.vue'
import AreaList from './views/area/AreaList.vue'
import AreaEdit from './views/area/AreaEdit.vue'
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
        { path: 'admin/popups/new-canvas', name: 'popup-new-canvas', component: PopupEditCanvas },
        { path: 'admin/popups/:id/canvas', name: 'popup-edit-canvas', component: PopupEditCanvas, props: true },
        { path: 'admin/pages/list', name: 'pages-list', component: PageList },
        { path: 'admin/pages/new', name: 'page-new', component: PageEdit },
        { path: 'admin/pages/:id/edit', name: 'page-edit', component: PageEdit, props: true },
        { path: 'admin/area/list', name: 'area-list', component: AreaList },
        { path: 'admin/area/new', name: 'area-new', component: AreaEdit },
        { path: 'admin/area/:id/edit', name: 'area-edit', component: AreaEdit, props: true },
        { path: 'admin/:section+', name: 'placeholder', component: Placeholder },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// Pojistka proti známému Reka/Radix bugu: když se modální vrstva (DropdownMenu,
// Dialog, Select…) odmountuje kvůli navigaci dřív, než doběhne její cleanup,
// může na <body> zůstat `pointer-events: none` (a scroll-lock) → celá
// administrace je neklikatelná a působí „zamrzle". Po každé dokončené navigaci
// proto tyto zámky preventivně uvolníme (až po přepatchování DOM).
router.afterEach(() => {
  requestAnimationFrame(() => {
    const { body } = document
    if (body.style.pointerEvents === 'none') body.style.pointerEvents = ''
    body.style.removeProperty('overflow')
    body.removeAttribute('data-scroll-locked')
    document.documentElement.removeAttribute('data-scroll-locked')
  })
})

createApp(App).use(router).mount('#app')
