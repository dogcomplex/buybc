<template>
  <v-container fluid>
    <LoadingComponent :is-loading="isLoading"></LoadingComponent>
    <v-row class="text-center mt-4">
      <v-col>
        <v-img
          src="../assets/buy-bc-logo.png"
          contain
          height="100"
          max-height="100"
        />
        <h1 class="font-weight-light display-0">
          Search for a business below
        </h1>
      </v-col>
    </v-row>
    <v-row class="text-center">
      <v-col>
        After searching you will be able to select a business from the dropdown
        that appears.
      </v-col>
    </v-row>
    <v-row class="text-center" align="center" justify="center">
      <v-col cols="7">
        <v-text-field v-model="name" label="Name"> </v-text-field>
        <v-btn class="primary mt-2" @click="getBusinessResults(name)"
          ><v-icon medium class="mr-2">mdi-magnify</v-icon> Search for
          Business</v-btn
        >
        <v-select
          v-show="hasSearched"
          class="mt-4"
          ref="select"
          v-model="selectedOrg"
          :items="searchResults"
          item-text="names[0].text"
          item-value="id"
          label="Select a business"
          outlined
          persistent-hint
          return-object
          single-line
        ></v-select>
        <h2
          v-if="orgTableLoaded"
          v-show="!isLoading"
          class="font-weight-light display-0 mt-6"
        >
          Registration Details for {{ selectedOrgData.name }}
        </h2>
        <v-data-table
          v-if="orgTableLoaded"
          v-show="!isLoading"
          :items-per-page="20"
          :headers="orgTableHeaders"
          :items="orgTableData"
          class="elevation-1 mt-4"
        >
        </v-data-table>
        <content-placeholders
          class="mt-4"
          v-show="isLoading && hasSelected"
          :rounded="true"
        >
          <content-placeholders-heading />
          <content-placeholders-text :lines="30" />
        </content-placeholders>
        <content-placeholders
          class="mt-4"
          v-show="isLoading && hasSelected"
          :rounded="true"
        >
          <content-placeholders-heading />
          <content-placeholders-text :lines="30" />
        </content-placeholders>
        <h2
          v-if="credTableLoaded"
          v-show="!isLoading"
          class="font-weight-light display-0 mt-8"
        >
          BuyBC Licenses held by {{ selectedOrgData.name }}
        </h2>
        <v-data-table
          v-if="credTableLoaded"
          v-show="!isLoading"
          :items-per-page="20"
          :sort-by="['effectiveDate']"
          :sort-desc="['true']"
          :headers="credTableHeaders"
          :items="credTableData"
          class="elevation-1 mt-4"
        >
          <template v-slot:[`item.details`]="{ item }">
            <v-btn @click="viewDetailModal(item)">View</v-btn>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn
              :disabled="item.licenseStatus === 'Inactive'"
              class="error"
              @click="revokeCredential(item)"
              >Revoke</v-btn
            >
          </template>
        </v-data-table>
        <div v-if="credTableLoaded" v-show="!isLoading" class="mt-2">
          You can view a list of all credentials held by
          {{ selectedOrgData.name }}
          <a @click="openOrgBook()">here.</a>
        </div>
        <v-alert
          class="mt-2"
          v-show="hasIssuedCredential"
          outlined
          text
          type="success"
        >
          <v-row align="center">
            <v-col>{{ successText }}</v-col>
          </v-row>
        </v-alert>
        <v-alert
          class="mt-2"
          v-show="issueCredentialFailed"
          outlined
          text
          type="error"
        >
          <v-row align="center">
            <v-col
              >Hmm, that didn't work... Something might be wrong on our end. Try
              again in a bit.</v-col
            >
          </v-row>
        </v-alert>
        <v-btn
          v-if="orgTableLoaded"
          v-show="!isLoading"
          :disabled="issueButtonDisabled"
          class="warning mt-5"
          @click="viewIssueModal()"
          ><v-icon class="mr-2" medium>mdi-license</v-icon> Issue a credential
          to {{ selectedOrgData.name }}</v-btn
        >
      </v-col>
    </v-row>
    <CredentialDetailsModal
      :is-visible="isDetailsModalVisible"
      :details="selectedCredential"
      @emit-close="toggleCredModal"
    />
    <IssueCredentialModal
      :is-visible="isIssueModalVisible"
      :entity-name="selectedOrgData.name"
      :registration-id="selectedOrgData.registrationId"
      :details="issueCredentialDetails"
      :all-credentials="credentials"
      @emit-close="toggleIssueModal"
      @emit-success="onIssueSuccess"
      @emit-failure="onIssueFail"
    />
  </v-container>
</template>

<script lang="ts">
/* eslint-disable */
import { Component, Vue, Watch } from "vue-property-decorator";
import axios from "axios";
import LoadingComponent from "../components/Loading.vue";
import CredentialDetailsModal from "../components/CredentialDetailsModal.vue";
import IssueCredentialModal from "../components/IssueCredentialModal.vue";
import { BASE_URL } from "../app-config";

@Component({
  components: {
    LoadingComponent: LoadingComponent,
    CredentialDetailsModal: CredentialDetailsModal,
    IssueCredentialModal: IssueCredentialModal,
  },
})
export default class Landing extends Vue {
  private isLoading = false;
  private hasIssuedCredential = false;
  private issueCredentialFailed = false;
  private isDetailsModalVisible = false;
  private isIssueModalVisible = false;
  private credentials: any[] = [];
  private searchResults: any[] = [];
  private name = "";
  private issueCredentialDetails: {} = {};
  private successText: string = "";
  private selectedOrg: {
    attributes: any[];
    names: any[];
    source_id: string;
    id: number;
    credential_set: { id: number };
    inactive: boolean;
    revoked: boolean;
  } = {
    attributes: [],
    names: [],
    source_id: "",
    credential_set: { id: -1 },
    id: -1,
    inactive: true,
    revoked: false,
  };
  private selectedOrgData: {
    id: number;
    attributes: any[];
    name: string;
    credentialId: string;
    registrationId: string;
    active: boolean;
    revoked: boolean;
  } = {
    id: -1,
    attributes: [],
    name: "",
    credentialId: "",
    registrationId: "",
    active: true,
    revoked: false,
  };
  private selectedCredential: {} = {};
  private orgTableHeaders: any[] = [];
  private orgTableData: any[] = [];
  private credTableHeaders: any[] = [];
  private credTableData: any[] = [];

  private issueButtonDisabled: boolean = false;

  private orgTableLoaded = false;
  private credTableLoaded = false;

  private hasSearched = false;
  private hasSelected = false;

  private mounted() {}

  private openOrgBook() {
    window.open(
      "https://dev.orgbook.gov.bc.ca/en/organization/registration.registries.ca/" +
        this.selectedOrgData.registrationId,
      "_blank"
    );
  }

  private getBusinessResults(searchText: string) {
    this.isLoading = true;
    this.orgTableLoaded = false;
    this.credTableLoaded = false;
    this.hasSelected = false;
    this.hasSearched = false;
    this.orgTableData = [];
    this.orgTableHeaders = [];
    this.credTableData = [];
    axios({
      method: "GET",
      url: BASE_URL + "/v4/search/topic/facets?q=" + searchText,
    }).then((res: any) => {
      this.searchResults = res.data.objects.results;
      this.hasSearched = true;
      console.log(this.$refs.select);
      this.$nextTick(() => {
        (this.$refs.select as Vue & {
          focus: () => any;
        }).focus();
      });
      this.isLoading = false;
    });
  }

  @Watch("selectedOrg")
  private orgSelected() {
    this.isLoading = true;
    this.orgTableData = [];
    this.orgTableHeaders = [];
    this.selectedOrgData = {
      id: -1,
      attributes: [],
      name: "",
      credentialId: "",
      registrationId: "",
      active: true,
      revoked: false,
    };
    this.hasSelected = true;
    this.selectedOrg.attributes.forEach((attribute) => {
      this.selectedOrgData.attributes.push({
        text: this.formatAttribute(attribute.type),
        value: attribute.value,
      });
    });
    this.selectedOrgData.id = this.selectedOrg.id;
    this.selectedOrgData.name = this.selectedOrg.names[0].text;
    (this.selectedOrgData.registrationId = this.selectedOrg.source_id),
      (this.selectedOrgData.revoked = this.selectedOrg.revoked);
    this.selectedOrgData.active = !this.selectedOrg.inactive;
    this.loadOrgTable();
  }

  private loadOrgTable() {
    this.orgTableData.push({
      text: "Organization",
      value: this.selectedOrgData.name,
    });
    this.orgTableData.push({
      text: "Registration ID",
      value: this.selectedOrgData.registrationId,
    });
    this.orgTableData.push({
      text: "Active?",
      value: this.selectedOrgData.active,
    });
    this.orgTableData.push({
      text: "Revoked?",
      value: this.selectedOrgData.revoked,
    });
    this.selectedOrgData.attributes.forEach((item) => {
      this.orgTableData.push(item);
    });
    this.orgTableHeaders.push({
      text: "Attribute",
      value: "text",
      sortable: false,
    });
    this.orgTableHeaders.push({
      text: "Value",
      value: "value",
      sortable: false,
    });
    this.orgTableLoaded = true;
    this.getCredentials();
  }

  private async getCredentials() {
    await axios({
      method: "GET",
      url: BASE_URL + "/topic/" + this.selectedOrgData.id + "/credentialset",
    }).then((res) => {
      console.log("/credentialset", res);
      this.credentials = res.data;
    });
    this.loadCredTable();
  }

  private async loadCredTable() {
    this.credTableData = [];
    this.credentials.forEach((credential: any) => {
      credential.credentials.forEach((cred: any) => {});
    });
    this.credTableHeaders = [
      {
        text: "Date Effective",
        value: "effectiveDate",
        sortable: true,
      },
      {
        text: "Issuer",
        value: "issuer",
        sortable: false,
      },
      {
        text: "Registration Type",
        value: "registrationType",
        sortable: false,
      },
      {
        text: "BuyBC License Status",
        value: "licenseStatus",
        sortable: false,
      },
      {
        text: "BuyBC License Status Reason",
        value: "licenseStatusReason",
        sortable: false,
      },
      {
        text: "Last Updated",
        value: "lastUpdated",
        sortable: true,
      },
      {
        text: "Details",
        value: "details",
        sortable: false,
      },
      {
        text: "Actions",
        value: "actions",
        sortable: false,
      },
    ];
    this.credentials.forEach(async (credential: any) => {
      await axios({
        method: "GET",
        url:
          BASE_URL +
          "/v3/credentialtype/" +
          credential.credentials[0].credential_type.id,
      }).then(async (res: any) => {
        var licenseStatus = "";
        var licenseStatusReason = "";

        if (credential.credentials[0].credential_type.id === 15) {
          // BuyBC License, get active attributes
          await axios({
            method: "GET",
            url:
              BASE_URL +
              "/v3/credential/" +
              credential.credentials[0].credential_id +
              "/latest",
          }).then((res: any) => {
            console.log("Got cred details: ", res);
            licenseStatus = res.data.attributes[2].value;
            licenseStatusReason = res.data.attributes[4].value;
          });
          this.credTableData.push({
            issuer: res.data.issuer.name,
            effectiveDate: this.formatDate(credential.first_effective_date),
            lastUpdated: this.formatDate(credential.update_timestamp),
            licenseStatus: licenseStatus,
            licenseStatusReason: licenseStatusReason,
            registrationType: this.formatRegistrationType(
              credential.credentials[0].credential_type.description
            ),
            data: credential,
          });
          if (licenseStatus === "Active") {
            this.issueButtonDisabled = true;
          }
        }
        this.isLoading = false;
      });
    });
    this.credTableLoaded = true;
  }

  private formatRegistrationType(registrationType: string): string {
    if (registrationType === "license.buybc.gov.bc.ca") {
      return "BuyBC Logo License";
    } else {
      return registrationType;
    }
  }

  private viewDetailModal(credential: any) {
    this.selectedCredential = credential;
    this.isDetailsModalVisible = true;
  }

  private viewIssueModal() {
    this.isIssueModalVisible = true;
  }

  private toggleCredModal() {
    this.isDetailsModalVisible = !this.isDetailsModalVisible;
  }

  private toggleIssueModal() {
    this.isIssueModalVisible = !this.isIssueModalVisible;
  }

  private revokeCredential(details: any) {
    this.isLoading = true;
    axios({
      url:
        BASE_URL +
        "/credential/" +
        details.data.latest_credential_id +
        "/formatted",
    }).then((res: any) => {
      console.log("DATA: ", res.data);
      this.issueCredentialDetails = {
        licenseNumber: res.data.attributes[0].value,
        licenseType: res.data.attributes[1].value,
        status: "Inactive",
        attributes: res.data.attributes,
      };
      this.viewIssueModal();
      this.isLoading = false;
    });
  }

  private onIssueSuccess(action: string) {
    if (action === "ISSUE") {
      this.successText = "BuyBC Credential Issued!";
      this.issueButtonDisabled = true;
    } else {
      this.successText = "BuyBC Credential Revoked!";
      this.issueButtonDisabled = false;
    }
    this.toggleIssueModal();
    this.isLoading = true;
    this.hasIssuedCredential = true;
    this.getCredentials();
  }

  private onIssueFail() {
    this.toggleIssueModal();
    this.issueCredentialFailed = true;
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
}
</script>
