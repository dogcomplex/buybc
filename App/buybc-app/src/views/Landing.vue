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
        Upon searching you will be able to select a business from the dropdown.
      </v-col>
    </v-row>
    <v-row class="text-center" align="center" justify="center">
      <v-col cols="7">
        <v-text-field v-model="name" label="Name"> </v-text-field>
        <v-btn class="primary mt-2" @click="getBusinessResults(name)"
          >Search OrgBook for Business</v-btn
        >
        <v-select
          v-show="hasSearched"
          class="mt-4"
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
        <h2 v-if="orgTableLoaded" class="font-weight-light display-0 mt-6">
          Registration Details for {{ selectedOrgData.name }}
        </h2>
        <v-data-table
          v-show="orgTableLoaded"
          :items-per-page="20"
          :headers="orgTableHeaders"
          :items="orgTableData"
          class="elevation-1 mt-4"
        >
        </v-data-table>
        <h2 v-if="credTableLoaded" class="font-weight-light display-0 mt-8">
          Credentials held by {{ selectedOrgData.name }}
        </h2>
        <v-data-table
          v-show="credTableLoaded"
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
        </v-data-table>

        <v-btn
          v-show="orgTableLoaded"
          class="warning mt-5"
          @click="viewIssueModal()"
          ><v-icon medium>mdi-license</v-icon> Issue credential to {{ selectedOrgData.name }}</v-btn
        >
      </v-col>
    </v-row>
    <CredentialDetailsModal
      :is-visible="isDetailsModalVisible"
      :details="selectedCredential"
      @emit-close="toggleCredModal"
      @emit-revoke="openRevokeModal"
    />
    <IssueCredentialModal
      :is-visible="isIssueModalVisible"
      :entity-name="selectedOrgData.name"
      :registration-id="selectedOrgData.registrationId"
      @emit-close="toggleIssueModal"
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
  private isDetailsModalVisible = false;
  private isIssueModalVisible = false;
  private credentials: any[] = [];
  private searchResults: any[] = [];
  private name = "";
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

  private orgTableLoaded = false;
  private credTableLoaded = false;

  private hasSearched = false;
  private hasSelected = false;

  private mounted() {}

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
      url:
        BASE_URL +
        "/v4/search/topic/facets?q=" +
        searchText +
        "&issuer_id=&category:entity_type=&inactive=false",
    }).then((res: any) => {
      console.log("SEARCH RESULTS: ", res);
      this.searchResults = res.data.objects.results;
      this.hasSearched = true;
      this.isLoading = false;
    });
  }

  @Watch("selectedOrg")
  private orgSelected() {
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
    //TODO: IMPLEMENT CREDENTIAL LIST
    this.isLoading = true;
    await axios({
      method: "GET",
      url: BASE_URL + "/topic/" + this.selectedOrgData.id + "/credentialset",
    }).then((res) => {
      this.credentials = res.data;
      this.isLoading = false;
      console.log("Credential set: ", this.credentials);
    });
    this.loadCredTable();
  }

  private async loadCredTable() {
    this.credTableData = [];
    this.credentials.forEach((credential: any) => {
      credential.credentials.forEach((cred: any) => {
        console.log(cred);
      });
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
        text: "Last Updated",
        value: "lastUpdated",
        sortable: true,
      },
      {
        text: "Details",
        value: "details",
        sortable: false,
      },
    ];
    this.credentials.forEach(async (credential: any) => {
      console.log(credential);
      await axios({
        method: "GET",
        url:
          BASE_URL +
          "/v3/credentialtype/" +
          credential.credentials[0].credential_type.id,
      }).then((res: any) => {
        console.log(res);
        this.credTableData.push({
          issuer: res.data.issuer.name,
          effectiveDate: this.formatDate(credential.first_effective_date),
          lastUpdated: this.formatDate(credential.update_timestamp),
          registrationType:
            credential.credentials[0].credential_type.description,
          data: credential,
        });
      });
    });
    this.credTableLoaded = true;
  }

  private viewDetailModal(credential: any) {
    console.log(credential);
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

  private openRevokeModal(details: any) {
    this.toggleCredModal();
    this.viewIssueModal();
    console.log(details);
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
