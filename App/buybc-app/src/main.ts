import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import Vuetify from "vuetify"
import vuetify from '@/plugins/vuetify'
import "vuetify/dist/vuetify.min.css"
import axios from 'axios'

Vue.prototype.$http = axios

Vue.use(Vuetify)

Vue.config.productionTip = false;

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount("#app");
