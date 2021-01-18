<template>
  <v-footer padless absolute background-image="../assets/footer-home-01.png">
    <v-card flat tile class="lighten-1 darkgrey--text text-center">
      <v-card-text class="darkgrey--text pt-0">
        This demonstrate how BuyBC would issue verifiable credentials for BuyBC
        licencees. Issuing the licenses as a VC publishes the licenses to
        https://dev.orgbook.gov.bc.ca
      </v-card-text>
      <v-divider></v-divider>
      <v-card-text>
        <a href="https://www.quartech.com" target="_blank"
          ><img src="../assets/Quartech.png" height="30"
        /></a>
      </v-card-text>
      <v-card-text class="darkgrey--text">
        &copy; {{ new Date().getFullYear() }} - Quartech Systems Limited
      </v-card-text>
    </v-card>
  </v-footer>
</template>
<script lang="ts">
export default {};
</script>
