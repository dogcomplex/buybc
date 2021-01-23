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
        <v-text-field
          v-model="searchText"
          label="Business Name or Registration Number (BC0123456)"
        >
        </v-text-field>
        <v-btn class="primary mt-2" @click="getBusinessResults(searchText)"
          ><v-icon medium class="mr-2">mdi-magnify</v-icon> Search for
          Business</v-btn
        >
        <v-data-table
          class="mt-4 search-table"
          @click:row="handleClick"
          v-show="hasSearched"
          :items="searchResults"
          :headers="searchResultTableHeaders"
          :page.sync="page"
          hide-default-footer
        >
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title
                >Results (Showing {{ firstIndex }} to {{ lastIndex }} of
                {{ numBusinessesFound }})</v-toolbar-title
              >
            </v-toolbar>
          </template>
        </v-data-table>
        <v-row
          v-show="hasSearched"
          align="center"
          justify="center"
          :items="searchResults"
          :headers="searchResultTableHeaders"
        >
          <div class="text-center pt-2 pb-4">
            <v-pagination
              v-model="page"
              :length="Math.ceil(numBusinessesFound / 10)"
              :total-visible="10"
            ></v-pagination>
          </div>
        </v-row>
        <v-divider class="my-2 divider" v-if="orgTableLoaded"></v-divider>
        <h2
          v-if="orgTableLoaded"
          v-show="!isLoading"
          class="font-weight-light display-0 mt-6"
        >
          Registration Details for {{ selectedOrgData.name }}
        </h2>
        <v-data-table
          :loading="isLoading"
          loading-text="Loading details..."
          v-show="orgTableLoaded"
          :items-per-page="20"
          mobile-breakpoint="800"
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
          :loading="isLoading"
          loading-text="Loading licenses..."
          v-show="credTableLoaded"
          mobile-breakpoint="1700"
          :items-per-page="20"
          :sort-by="['issueDate']"
          :sort-desc="['true']"
          :headers="credTableHeaders"
          :items="credTableData"
          class="elevation-1 mt-4"
        >
          <template v-slot:no-data>
            No BuyBC licenses held by {{ selectedOrgData.name }}. Issue a
            credential below to see it in this table.
          </template>
          <template v-slot:[`item.licenseStatus`]="{ item }">
            <v-chip :color="getColor(item.licenseStatus)" dark>
              {{ item.licenseStatus }}
            </v-chip>
          </template>
          <template v-slot:[`item.credentialRevoked`]="{ item }">
            <v-chip :color="getColor(item.credentialRevoked)" dark>
              {{ item.credentialRevoked }}
            </v-chip>
          </template>
          <template v-slot:[`item.credentialLatest`]="{ item }">
            <v-chip :color="getColor(item.credentialLatest)" dark>
              {{ item.credentialLatest }}
            </v-chip>
          </template>
          <template v-slot:[`item.details`]="{ item }">
            <v-btn @click="viewDetailModal(item)">View</v-btn>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-tooltip
              right
              :disabled="
                item.licenseStatus === 'Active' &&
                  item.credentialRevoked === false
              "
            >
              <template v-slot:activator="{ on, attrs }">
                <div v-on="on" v-bind="attrs">
                  <v-btn
                    :disabled="
                      item.licenseStatus === 'Inactive' ||
                        item.credentialRevoked === true
                    "
                    class="error"
                    @click="revokeCredential(item)"
                    >Revoke</v-btn
                  >
                </div>
              </template>
              <span
                >Licenses can only be revoked <br />
                if they are active and have not <br />
                previously been revoked.</span
              >
            </v-tooltip>
          </template>
        </v-data-table>
        <div v-if="credTableLoaded" v-show="!isLoading" class="mt-2">
          You can view a list of all credentials held by
          {{ selectedOrgData.name }} on
          <a @click="openOrgBook()">OrgBook BC</a>
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
  private searchText = "";
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
  private searchResultTableHeaders: any[] = [
    {
      text: "Business Name",
      value: "names[0].text",
      sortable: false,
    },
    {
      text: "Business Number",
      value: "source_id",
      sortable: false,
    },
  ];
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

  private numBusinessesFound = 0;
  private page = 1;
  private firstIndex = 1;
  private lastIndex = 20;
  private nextPage = "";
  private prevPage = "";

  private mounted() {}

  private openOrgBook() {
    window.open(
      "https://dev.orgbook.gov.bc.ca/en/organization/registration.registries.ca/" +
        this.selectedOrgData.registrationId,
      "_blank"
    );
  }

  private getColor(status: string) {
    if (status === "Active") {
      return "#4CAF50";
    } else if (status === "Inactive") {
      return "#F44336";
    } else if (status.toString() === "true") {
      return "#2196F3";
    } else if (status.toString() === "false") {
      return "#9E9E9E";
    }
  }

  private handleClick(row: any) {
    console.log(row);
    this.selectedOrg = row;
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
      url:
        BASE_URL +
        "/v4/search/topic/facets?q=" +
        searchText +
        "&page_size=10&page=1",
    }).then((res: any) => {
      console.log(res);
      this.numBusinessesFound = res.data.objects.total;
      this.page = res.data.objects.page;
      this.searchResults = res.data.objects.results;
      this.firstIndex = res.data.objects.first_index;
      this.lastIndex = res.data.objects.last_index;
      this.hasSearched = true;
      this.isLoading = false;
      this.hasIssuedCredential = false;
      this.issueCredentialFailed = false;
    });
  }

  @Watch("page")
  private onPageChanged(page: any) {
    this.isLoading = true;
    axios({
      method: "GET",
      url:
        BASE_URL +
        "/v4/search/topic/facets?q=" +
        this.searchText +
        "&page_size=10&page=" +
        this.page,
    }).then((res: any) => {
      console.log(res);
      this.page = res.data.objects.page;
      this.searchResults = res.data.objects.results;
      this.firstIndex = res.data.objects.first_index;
      this.lastIndex = res.data.objects.last_index;
      this.hasSearched = true;
      this.isLoading = false;
    });
  }

  @Watch("selectedOrg")
  private orgSelected() {
    this.isLoading = true;
    this.orgTableData = [];
    this.orgTableHeaders = [];
    this.searchText = "";
    this.hasIssuedCredential = false;
    this.issueCredentialFailed = false;
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
    this.credTableHeaders = [
      {
        text: "Date Created",
        value: "issueDate",
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
        text: "BuyBC License Number",
        value: "licenseNumber",
        sortable: true,
      },
      {
        text: "Date Effective",
        value: "effectiveDate",
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
        var licenseNumber = "";
        var issueDate = "";

        if (credential.credentials[0].credential_type.id === 15) {
          // BuyBC License, get active attributes
          for (let k = 0; k < credential.credentials.length; k++) {
            if (credential.credentials[k].revoked === true) {
              // Credential has been revoked
              await axios({
                method: "GET",
                url:
                  BASE_URL + "/v3/credential/" + credential.credentials[k].id,
              }).then(async (res: any) => {
                console.log("Got revoked cred details: ", res);
                licenseStatus = res.data.attributes[2].value;
                licenseStatusReason = res.data.attributes[4].value;
                licenseNumber = res.data.attributes[0].value;
                issueDate = res.data.attributes[6].value;
              });
              this.credTableData.push({
                issuer: res.data.issuer.name,
                effectiveDate: this.formatDate(credential.first_effective_date),
                licenseStatus: licenseStatus,
                credentialRevoked: true,
                issueDate: this.formatDate(issueDate), // TODO: FIX THIS
                licenseNumber: licenseNumber,
                licenseStatusReason: licenseStatusReason,
                registrationType: this.formatRegistrationType(
                  credential.credentials[0].credential_type.description
                ),
                data: credential,
              });
            } else {
              // Credential is active (latest)
              await axios({
                method: "GET",
                url:
                  BASE_URL + "/v3/credential/" + credential.credentials[k].id,
              }).then((res: any) => {
                console.log("Got active cred details: ", res);
                licenseStatus = res.data.attributes[2].value;
                licenseStatusReason = res.data.attributes[4].value;
                licenseNumber = res.data.attributes[0].value;
                issueDate = res.data.attributes[6].value;
              });
              this.credTableData.push({
                issuer: res.data.issuer.name,
                effectiveDate: this.formatDate(credential.first_effective_date),
                licenseStatus: licenseStatus,
                credentialRevoked: false,
                issueDate: this.formatDate(issueDate), // TODO: FIX THIS
                licenseNumber: licenseNumber,
                licenseStatusReason: licenseStatusReason,
                registrationType: this.formatRegistrationType(
                  credential.credentials[0].credential_type.description
                ),
                data: credential,
              });
            }
          }
        }
      });
    });
    this.isLoading = false;
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
        statusReason: "",
        attributes: res.data.attributes,
      };
      this.viewIssueModal();
      this.isLoading = false;
    });
  }

  private onIssueSuccess(action: string) {
    if (action === "ISSUE") {
      this.successText = "BuyBC Credential Issued!";
    } else {
      this.successText = "BuyBC Credential Revoked!";
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
      year = d.getFullYear(),
      hour = d.getHours().toString(),
      minute = d.getMinutes().toString(),
      seconds = d.getSeconds().toString();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    if (hour.length < 2) hour = "0" + hour;
    if (minute.length < 2) minute = "0" + minute;
    if (seconds.length < 2) seconds = "0" + seconds;

    return (
      [year, month, day].join("-") + " " + [hour, minute, seconds].join(":")
    );
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
<style scoped>
.search-table
  /deep/
  tbody
  /deep/
  tr:hover:not(.v-data-table__expanded__content) {
  transition: 0.2s linear;
  background: #bbdefb !important;
  cursor: pointer;
}

.divider {
  border-width: 2px 0 0 !important;
}
</style>
