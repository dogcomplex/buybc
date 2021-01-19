import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import Vuetify from "vuetify";
import vuetify from "@/plugins/vuetify";
import "vuetify/dist/vuetify.min.css";
import axios from "axios";
import VueContentPlaceholders from "vue-content-placeholders";

Vue.prototype.$http = axios;

Vue.use(Vuetify);
Vue.use(VueContentPlaceholders);

Vue.config.productionTip = false;

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount("#app");
