<template>
  <v-footer fluid padless height="auto" color="white" class="my-bg">
      <v-img src="../assets/footer-home-01.png" max-height="300" />
      <v-row dense no-gutters>
        <v-col cols="6">
          <v-card flat tile color="#7B9C3D" >
            <v-card-text>
              <v-img
                contain
                src="@/assets/BCGov_Funding.png"
                max-height="45" />
              </v-card-text></v-card>
        </v-col>
        <v-col cols="6">
          <v-card padless tile flat color="#7B9C3D" width="100%">
            <v-card-text>
              <a href="https://www.quartech.com" target="_blank"
                ><v-img
                  contain
                  src="@/assets/Quartech.png"
                  max-height="45" /></a></v-card-text
          ></v-card> </v-col>
          <v-col cols="12">
          <v-card padless tile flat color="#AEBB38" width="100%">
          <v-card-text class="white--text text-center">
            &copy; BC Investment Agriculture Foundation. All rights reserved.
          </v-card-text></v-card></v-col>
          </v-row>


  </v-footer>
</template>
<script lang="ts">
export default {};
</script>
