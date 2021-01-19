<template>
  <v-dialog v-model="dialog" width="700">
    <LoadingComponent :is-loading="isLoading"></LoadingComponent>
    <v-card>
      <v-card-title>
        <v-img
          src="../assets/buyBC_Logo_Horiz_RGB-300x119.png"
          contain
          height="100"
          max-height="100"
        />
      </v-card-title>
      <v-card-title v-if="selectedStatus === 'Active'" class="headline">
        Issue BuyBC Credential
      </v-card-title>
      <v-card-title v-else class="headline">
        Revoke BuyBC Credential
      </v-card-title>
      <v-card-text>
        <v-row class="mt-2">
          <v-col>
            <v-text-field
              label="Business Name"
              v-model="name"
              outlined
              readonly
            ></v-text-field>
          </v-col>
          <v-col
            ><v-text-field
              label="Registration ID"
              v-model="id"
              outlined
              readonly
            ></v-text-field
          ></v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              label="License Number"
              v-model="licenseNumber"
              outlined
            ></v-text-field>
          </v-col>
          <v-col>
            <v-select
              outlined
              :items="licenseType"
              v-model="selectedLicenseType"
              label="License Type"
            >
            </v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-select
              outlined
              :items="status"
              v-model="selectedStatus"
              label="License Status"
            >
            </v-select>
          </v-col>
          <v-col>
            <v-select
              outlined
              :items="
                selectedStatus === 'Active'
                  ? activeStatusReason
                  : inactiveStatusReason
              "
              v-model="selectedStatusReason"
              :disabled="selectedStatus === ''"
              label="Status Reason"
            >
            </v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-menu
              ref="menu"
              v-model="menu"
              :close-on-content-click="false"
              :return-value.sync="licenseEffectiveDate"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="licenseEffectiveDate"
                  label="License Effective Date"
                  outlined
                  readonly
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker v-model="licenseEffectiveDate" no-title scrollable>
                <v-spacer></v-spacer>
                <v-btn text color="primary" @click="menu = false">
                  Cancel
                </v-btn>
                <v-btn
                  text
                  color="primary"
                  @click="$refs.menu.save(licenseEffectiveDate)"
                >
                  OK
                </v-btn>
              </v-date-picker>
            </v-menu>
            <v-alert v-show="hasErrors" prominent type="error">
              <v-row align="center">
                <v-col class="grow">
                  {{ errorMessage }}
                </v-col>
              </v-row>
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="selectedStatus === 'Active'"
          class="button mb-2 primary"
          @click="getOtherCredentialDetails(true)"
          >Issue</v-btn
        >
        <v-btn
          v-else
          class="button mb-2 error"
          @click="getOtherCredentialDetails(false)"
          >Revoke</v-btn
        >
        <v-btn class="button mb-2" @click="dialog = false">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
/* eslint-disable */
import { Component, Vue, Prop, Watch, Emit } from "vue-property-decorator";
import axios from "axios";
import { BASE_URL, ISSUE_URL } from "../app-config";
import LoadingComponent from "./Loading.vue";

@Component({
  components: {
    LoadingComponent,
  },
})
export default class IssueCredentialModal extends Vue {
  @Prop() isVisible!: boolean;
  @Prop() entityName!: string;
  @Prop() registrationId!: string;
  @Prop() details!: {
    licenseNumber: string;
    status: string;
    licenseType: string;
    attributes: any[];
  };
  @Prop() allCredentials!: any[];

  private menu: boolean = false;
  private dialog: boolean = false;

  private isLoading: boolean = false;
  private attributes: any[] = [];
  private credentials: any[] = [];
  private name: string = "";
  private id: string = "";
  private licenseNumber: string = "";
  private licenseType: string[] = ["Certification", "Marketing"];
  private selectedLicenseType: string = "";

  private selectedStatus: string = "Active";
  private status: string[] = ["Active", "Inactive"];

  private selectedStatusReason: string = "";
  private activeStatusReason: string[] = ["License Approved"];
  private inactiveStatusReason: string[] = [
    "License Expired",
    "License Revoked",
  ];

  private licenseEffectiveDate: string = new Date().toISOString().substr(0, 10);

  private hasErrors = false;
  private errorMessage: string = "";

  @Watch("isVisible")
  private onVisibilityChanged() {
    this.dialog = this.isVisible;
    this.credentials = this.allCredentials;
  }

  @Watch("entityName")
  private onNamePropChanged() {
    this.name = this.entityName;
  }

  @Watch("isVisible")
  private onIdPropChanged() {
    this.id = this.registrationId;
  }

  @Watch("details")
  private onDetailsChanged() {
    this.licenseNumber = this.details.licenseNumber;
    this.selectedLicenseType = this.details.licenseType;
    this.selectedStatus = this.details.status;
    this.attributes = this.details.attributes;
    this.credentials = this.allCredentials;
  }

  @Watch("dialog")
  private onDialogChange(val: boolean) {
    val || this.close();
  }

  private async getOtherCredentialDetails(issue: boolean) {
    this.isLoading = true;
    var hasActiveCredential = false;
    var duplicateLicenseNumber = false;
    var licenseNumberExists = false;

    for (let i = 0; i < this.credentials.length; i++) {
      for (let k = 0; k < this.credentials[i].credentials.length; k++) {
        // Search credentials belonging to this holder
        if (this.credentials[i].credentials[k].credential_type.id === 15) {
          // Credential comes from BuyBC
          await axios({
            method: "GET",
            url:
              BASE_URL +
              "/v3/credential/" +
              this.credentials[i].credentials[k].credential_id +
              "/latest",
          }).then((res: any) => {
            // Get attributes of BuyBC credential to check if it's active
            if (res.data.attributes[2].value === "Active") {
              // Found an active BuyBC credential for this holder
              console.log("Holder has an active credential");
              hasActiveCredential = true;
            }
            if (res.data.attributes[0].value === this.licenseNumber) {
              console.log("Found a duplicate license number ");
              duplicateLicenseNumber = true;
              if (res.data.attributes[2].value === "Active") {
                licenseNumberExists = true;
                console.log("Found an active license ready to be revoked");
              }
            }
          });
        }
      }
    }
    // Once we have analyzed other credentials, call issue credential
    if (issue) {
      this.issueCredential(hasActiveCredential, duplicateLicenseNumber);
    } else {
      this.revokeCredential(licenseNumberExists);
    }
  }

  private issueCredential(
    hasActiveCredential: boolean,
    duplicateLicenseNumber: boolean
  ) {
    /* Business Logic:
      - Check if VC does not already exist or has existed in the past for the current holder with the SAME LICENSE NUMBER before creating VC
      - A holder can only have one valid BuyBC VC at a time, may have more than one revoked or expired VCs
      - If a credential has been expired or revoked it can NOT be reactivated. IAF will need to create a new license and new license number under a new BuyBC agreement
    */

    // Business Logic
    if (hasActiveCredential) {
      this.isLoading = false;
      this.hasErrors = true;
      this.errorMessage =
        "Cannot issue BuyBC license. An active BuyBC license already exists for " +
        this.name +
        ". If you would like to issue a new BuyBC license, revoke the current license first.";
    } else if (duplicateLicenseNumber) {
      this.isLoading = false;
      this.hasErrors = true;
      this.errorMessage =
        "Cannot issue BuyBC license. A BuyBC license with license number " +
        this.licenseNumber +
        " has already been created. Please enter a new license number to create a new BuyBC license.";
    } else {
      /* license does not exist and license number has not been created in the past*/
      this.sendPayload();
    }
  }

  private async revokeCredential(licenseNumberExists: boolean) {
    if (!licenseNumberExists) {
      // License with license number does not exist
      this.isLoading = false;
      this.hasErrors = true;
      this.errorMessage =
        "Cannot revoke BuyBC license. No active BuyBC license with license number " +
        this.licenseNumber +
        " exists for " +
        this.name +
        ".";
    } else {
      this.sendPayload();
    }
  }

  private sendPayload() {
    axios({
      // TODO: TEST THIS
      method: "POST",
      url: ISSUE_URL,
      data: [
        {
          attributes: {
            entity_name: this.name,
            corp_num: this.registrationId,
            license_number: this.licenseNumber,
            license_type: this.selectedLicenseType,
            status: this.selectedStatus,
            status_reason: this.selectedStatusReason,
            license_effective_date: new Date(
              this.licenseEffectiveDate
            ).toISOString(),
            issue_date: new Date().toISOString(),
            effective_date: new Date().toISOString(),
            expiry_date: "",
          },
          schema: "license.buybc.gov.bc.ca",
          version: "0.1.0",
        },
      ],
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => {
      console.log("/issue-credential ", res);
      this.isLoading = false;
      this.close();
      this.emitSuccess();
    });
  }

  private close() {
    this.dialog = false;
    this.hasErrors = false;
    this.errorMessage = "";
    this.licenseNumber = "";
    this.selectedStatus = "Active";
    this.selectedStatusReason = "";
    this.licenseEffectiveDate = new Date().toISOString().substr(0, 10);
    this.selectedLicenseType = "";
    this.emitClose();
  }

  @Emit()
  private emitClose() {
    return;
  }

  @Emit()
  private emitSuccess() {
    return;
  }
}

/*
  TODO: EVERYTHING GOING WRONG RIGHT NOW
  TODO: Modals not closing after function completes
  TODO: Footer not filling width of page
  TODO: CORS not working
  TODO: Validation on issue credential fields
*/
</script>
