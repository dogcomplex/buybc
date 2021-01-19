<template>
  <v-dialog v-model="dialog" width="700">
    <LoadingComponent :is-loading="isLoading"></LoadingComponent>
    <v-card>
      <v-card-title class="headline">
        {{ details.registrationType }}
      </v-card-title>
      <v-card-text>
        <v-data-table
          v-show="!isLoading"
          :items-per-page="20"
          :headers="credDetailsHeaders"
          :items="credDetailsData"
          class="elevation-1 mt-4"
        >
        </v-data-table>
        <content-placeholders class="mt-4" v-show="isLoading" :rounded="true">
          <content-placeholders-heading />
          <content-placeholders-text :lines="5" />
        </content-placeholders>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="details.registrationType === 'license.buybc.gov.bc.ca'"
          class="button mb-2 error"
          @click="revoke()"
          >Revoke</v-btn
        >
        <v-btn class="button mb-2" @click="dialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
/* eslint-disable */
import { Component, Vue, Prop, Watch, Emit } from "vue-property-decorator";
import axios from "axios";
import { BASE_URL } from "../app-config";
import LoadingComponent from "./Loading.vue";

@Component({
  components: { LoadingComponent },
})
export default class CredentialDetailsModal extends Vue {
  private dialog: boolean = false;
  private isLoading: boolean = false;
  private credAttributes: any[] = [];
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
      latest_credential_id: number;
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
    ];
    if (this.details.registrationType === "license.buybc.gov.bc.ca") {
      this.isLoading = true;
      axios({
        url:
          BASE_URL +
          "/credential/" +
          this.details.data.latest_credential_id +
          "/formatted",
      }).then((res) => {
        res.data.attributes.forEach((attribute: any) => {
          if (attribute.type !== "corp_num")
            this.credDetailsData.push({
              property: this.formatAttribute(attribute.type),
              value: attribute.value,
            });
        });
        this.credAttributes = res.data;
        this.isLoading = false;
      });
    } else {
      this.credDetailsData.push(
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
        }
      );
    }
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

  private formatAttribute(str: string) {
    let frags = str.split("_");
    for (let i = 0; i < frags.length; i++) {
      frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(" ");
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
      licenseNumber: this.credDetailsData[3].value, // TODO: BROKEN
      licenseType: this.credDetailsData[4].value,
      status: "Inactive",
      attributes: this.credAttributes,
    };
  }
}
</script>
