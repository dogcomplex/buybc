<template>
  <v-app>
    <buybc-header />
    <v-main>
      <buybc-landing />
    </v-main>
    <buybc-footer />
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
    "buybc-landing": Landing,
    "buybc-footer": Footer,
    "buybc-header": Header,
  },

  data: () => ({
    //
  }),
});
</script>