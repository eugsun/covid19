import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import("@/views/Home"),
    props: (route) => ({
      chartType: route.query.chartType ?? "cases",
      activeStates: route.query.activeStates ?? "USA"
    })
  }
]

const router = new VueRouter({
  routes
})

export default router
