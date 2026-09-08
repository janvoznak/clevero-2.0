import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import AdminLayout from './layouts/AdminLayout.vue'
import NewsList from './views/news/NewsList.vue'
import NewsEdit from './views/news/NewsEdit.vue'
import EventsList from './views/events/EventsList.vue'
import EventDetail from './views/events/EventDetail.vue'
import EventWizard from './views/events/EventWizard.vue'
import InfoBarEdit from './views/infobar/InfoBarEdit.vue'
import ContactsManager from './views/contacts/ContactsManager.vue'
import NavigationManager from './views/navigation/NavigationManager.vue'
import FooterManager from './views/footer/FooterManager.vue'
import GrantsList from './views/grants/GrantsList.vue'
import GrantEdit from './views/grants/GrantEdit.vue'
import GrantProviders from './views/grants/GrantProviders.vue'
import PositionsList from './views/careers/PositionsList.vue'
import PositionEdit from './views/careers/PositionEdit.vue'
import ApplicantsList from './views/careers/ApplicantsList.vue'
import ApplicantDetail from './views/careers/ApplicantDetail.vue'
import UsersList from './views/users/UsersList.vue'
import UserEdit from './views/users/UserEdit.vue'
import PopupList from './views/popups/PopupList.vue'
import PopupEditCanvas from './views/popups/PopupEditCanvas.vue'
import PageList from './views/pages/PageList.vue'
import PageEdit from './views/pages/PageEdit.vue'
import AreaList from './views/area/AreaList.vue'
import AreaEdit from './views/area/AreaEdit.vue'
import ToursList from './views/tours/ToursList.vue'
import CategoryDetail from './views/tours/CategoryDetail.vue'
import TourEdit from './views/tours/TourEdit.vue'
import TicketsList from './views/tours/TicketsList.vue'
import ToursStats from './views/tours/ToursStats.vue'
import GalleriesList from './views/galleries/GalleriesList.vue'
import GallerySectionDetail from './views/galleries/GallerySectionDetail.vue'
import GalleryEdit from './views/galleries/GalleryEdit.vue'
import FaqList from './views/faq/FaqList.vue'
import FaqEdit from './views/faq/FaqEdit.vue'
import Dashboard from './views/dashboard/Dashboard.vue'
import ProgramsList from './views/programs/ProgramsList.vue'
import ProgramEdit from './views/programs/ProgramEdit.vue'
import ProductsList from './views/products/ProductsList.vue'
import ProductEdit from './views/products/ProductEdit.vue'
import ProductCategoriesList from './views/products/ProductCategoriesList.vue'
import ProductCategoryDetail from './views/products/ProductCategoryDetail.vue'
import TaxonomyManager from './views/settings/TaxonomyManager.vue'
import Placeholder from './views/Placeholder.vue'
import TicketPicker from './views/public/TicketPicker.vue'
import CartPage from './views/public/CartPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Veřejný web (prototyp nákupní stránky vstupenek) — mimo AdminLayout.
    { path: '/vstupenky', redirect: '/vstupenky/svet-techniky-a-maly-svet-u6' },
    {
      path: '/vstupenky/:id',
      name: 'public-ticket-picker',
      component: TicketPicker,
    },
    { path: '/kosik', name: 'public-cart', component: CartPage },
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'admin/dashboard', name: 'dashboard', component: Dashboard },
        { path: 'admin/news/list', name: 'news-list', component: NewsList },
        { path: 'admin/news/new', name: 'news-new', component: NewsEdit },
        { path: 'admin/news/:id/edit', name: 'news-edit', component: NewsEdit, props: true },
        { path: 'admin/events', name: 'events-list', component: EventsList },
        { path: 'admin/events/new', name: 'event-new', component: EventWizard },
        { path: 'admin/events/:id', name: 'event-detail', component: EventDetail, props: true },
        { path: 'admin/infobar', name: 'infobar', component: InfoBarEdit },
        { path: 'admin/contacts', name: 'contacts', component: ContactsManager },
        { path: 'admin/navigation', name: 'navigation', component: NavigationManager },
        { path: 'admin/footer', name: 'footer', component: FooterManager },
        { path: 'admin/grants', name: 'grants-list', component: GrantsList },
        { path: 'admin/grants/providers', name: 'grant-providers', component: GrantProviders },
        { path: 'admin/grants/new', name: 'grant-new', component: GrantEdit },
        { path: 'admin/grants/:id/edit', name: 'grant-edit', component: GrantEdit, props: true },
        { path: 'admin/careers/positions', name: 'positions-list', component: PositionsList },
        { path: 'admin/careers/positions/new', name: 'position-new', component: PositionEdit },
        { path: 'admin/careers/positions/:id/edit', name: 'position-edit', component: PositionEdit, props: true },
        { path: 'admin/careers/applicants', name: 'applicants-list', component: ApplicantsList },
        { path: 'admin/careers/applicants/:id', name: 'applicant-detail', component: ApplicantDetail, props: true },
        { path: 'admin/users', name: 'users-list', component: UsersList },
        { path: 'admin/users/new', name: 'user-new', component: UserEdit },
        { path: 'admin/users/:id/edit', name: 'user-edit', component: UserEdit, props: true },
        { path: 'admin/popups/list', name: 'popups-list', component: PopupList },
        { path: 'admin/popups/new', name: 'popup-new', component: PopupEditCanvas },
        { path: 'admin/popups/:id/edit', name: 'popup-edit', component: PopupEditCanvas, props: true },
        { path: 'admin/pages/list', name: 'pages-list', component: PageList },
        { path: 'admin/pages/new', name: 'page-new', component: PageEdit },
        { path: 'admin/pages/:id/edit', name: 'page-edit', component: PageEdit, props: true },
        { path: 'admin/area/list', name: 'area-list', component: AreaList },
        { path: 'admin/area/new', name: 'area-new', component: AreaEdit },
        { path: 'admin/area/:id/edit', name: 'area-edit', component: AreaEdit, props: true },
        { path: 'admin/tours', name: 'tours-list', component: ToursList },
        { path: 'admin/tickets', name: 'tours-tickets', component: TicketsList },
        { path: 'admin/tours/stats', name: 'tours-stats', component: ToursStats },
        { path: 'admin/tours/new', name: 'tour-new', component: TourEdit },
        { path: 'admin/tours/category/new', name: 'category-new', component: CategoryDetail },
        { path: 'admin/tours/category/:id', name: 'category-edit', component: CategoryDetail, props: true },
        { path: 'admin/tours/:id/edit', name: 'tour-edit', component: TourEdit, props: true },
        { path: 'admin/galleries', name: 'galleries-list', component: GalleriesList },
        { path: 'admin/galleries/new', name: 'gallery-new', component: GalleryEdit },
        { path: 'admin/galleries/section/new', name: 'gallery-section-new', component: GallerySectionDetail },
        { path: 'admin/galleries/section/:id', name: 'gallery-section-edit', component: GallerySectionDetail, props: true },
        { path: 'admin/galleries/:id/edit', name: 'gallery-edit', component: GalleryEdit, props: true },
        { path: 'admin/faq', name: 'faq-list', component: FaqList },
        { path: 'admin/faq/new', name: 'faq-new', component: FaqEdit },
        { path: 'admin/faq/:id/edit', name: 'faq-edit', component: FaqEdit, props: true },
        { path: 'admin/education', name: 'programs-list', component: ProgramsList },
        { path: 'admin/education/new', name: 'program-new', component: ProgramEdit },
        { path: 'admin/education/:id/edit', name: 'program-edit', component: ProgramEdit, props: true },
        { path: 'admin/products', name: 'products-list', component: ProductsList },
        { path: 'admin/vouchers', name: 'vouchers-list', component: ProductsList, props: { kind: 'vouchers' } },
        { path: 'admin/products/:id/edit', name: 'product-edit', component: ProductEdit, props: true },
        { path: 'admin/product-categories', name: 'product-categories-list', component: ProductCategoriesList },
        { path: 'admin/product-categories/new', name: 'product-category-new', component: ProductCategoryDetail },
        { path: 'admin/product-categories/:id', name: 'product-category-edit', component: ProductCategoryDetail, props: true },
        { path: 'admin/taxonomy', name: 'taxonomy', component: TaxonomyManager },
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
