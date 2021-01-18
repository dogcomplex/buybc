<template>
  <v-dialog v-model="dialog" width="700">
    <v-card>
      <v-card-title class="headline">
        {{ details.registrationType }}
      </v-card-title>
      <v-card-text>
        <v-data-table
          :items-per-page="20"
          :headers="credDetailsHeaders"
          :items="credDetailsData"
          class="elevation-1 mt-4"
        >
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!--TODO: ADD TO REVOKE BUTTON v-if="details.issuer === 'BuyBC'" -->
        <v-btn class="button mb-2 error" @click="revoke()">Revoke</v-btn>
        <v-btn class="button mb-2" @click="dialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
/* eslint-disable */
import { Component, Vue, Prop, Watch, Emit } from "vue-property-decorator";
import axios from "axios";

@Component
export default class CredentialDetailsModal extends Vue {
  private dialog: boolean = false;
  private credDetailsHeaders = [
    {
      text: "Property",
      value: "property",
      sortable: false,
    },
    {
      text: "Value",
      value: "value",
      sortable: false,
    },
  ];
  private credDetailsData: any[] = [];

  @Prop() isVisible!: boolean;
  @Prop() details!: {
    data: {
      credentials: any[];
      create_timestamp: string;
    };
    issuer: string;
    lastUpdated: string;
    effectiveDate: string;
    registrationType: string;
  };

  @Watch("isVisible")
  private onVisibilityChanged() {
    this.dialog = this.isVisible;
  }

  @Watch("dialog")
  private onDialogChange(val: boolean) {
    val || this.close();
  }

  @Watch("details")
  private async loadCredDetails() {
    console.log("NEW DATA RECIEVED!", this.details);
    this.credDetailsData = [
      {
        property: "Organization",
        value: this.details.data.credentials[0].names[0].text,
      },
      {
        property: "Registration ID",
        value: this.details.data.credentials[0].topic.source_id,
      },
      {
        property: "Issuer",
        value: this.details.issuer,
      },
      {
        property: "Active?",
        value: !this.details.data.credentials[0].inactive,
      },
      {
        property: "Revoked?",
        value: this.details.data.credentials[0].revoked,
      },
      {
        property: "Created At",
        value: this.formatDate(this.details.data.create_timestamp),
      },
      {
        property: "Last Updated",
        value: this.details.lastUpdated,
      },
      {
        property: "Effective Date",
        value: this.details.effectiveDate,
      },
    ];
  }

  private formatDate(date: any) {
    var d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  /*
      close
      Closes the modal and resets its state
  */
  private close() {
    this.dialog = false;
    this.emitClose();
  }

  private revoke() {
    this.dialog = false;
    this.emitRevoke();
  }

  @Emit()
  private emitClose() {
    return;
  }

  @Emit()
  private emitSuccess() {
    return;
  }

  @Emit()
  private emitRevoke() {
    return {
      businessName: this.credDetailsData[0].value,
      registrationId: this.credDetailsData[1].value,
      licenseNumber: "",
      licenseType: "",
      status: "Inactive",
    };
  }

  /* Tomorrow:
        TODO: Issue local test BuyBC credential to view fields
        TODO: Fetch license ID from fields
        TODO: Send license ID to revoke credential
        TODO: Figure out a way to see if credential already exists or has existed in the past
        TODO: Figure out a way to find if a credential is active
  */
}
</script>
