<template>
  <v-app>
    <v-app-bar app color="#234075" dark>
      <div class="d-flex align-center">
        <v-img
          class="mr-4"
          contain
          src="@/assets/gov_bc_logo.svg"
          transition="scale-transition"
          width="120"
        />
        <h3>BuyBC Issue Credential Demo</h3>
      </div>
    </v-app-bar>

    <v-main>
      <Landing />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Landing from "@/views/Landing.vue";

export default Vue.extend({
  name: "App",

  components: {
    Landing,
  },

  data: () => ({
    //
  }),
});
</script>
