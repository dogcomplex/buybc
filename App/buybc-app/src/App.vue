<template>
  <v-app>
    <v-main>
      <buybc-header/>
      <buybc-landing/>
      <buybc-footer/>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Header from "./views/Header.vue";
import Footer from "./views/Footer.vue";
import Landing from "./views/Landing.vue";

export default Vue.extend({
  name: "App",

  components: {
    'buybc-landing':Landing,
    'buybc-footer':Footer,
    'buybc-header':Header,
  },

  data: () => ({
    //
  })
});
</script>
