<template>
  <v-dialog v-model="dialog" width="700">
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
              :value="name"
              outlined
              readonly
            ></v-text-field>
          </v-col>
          <v-col
            ><v-text-field
              label="Registration ID"
              :value="id"
              outlined
              readonly
            ></v-text-field
          ></v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              label="License Number"
              :value="licenseNumber"
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
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!-- TODO: CHANGE SENDPAYLOAD TO ISSUECREDENTIAL -->
        <v-btn
          v-if="selectedStatus === 'Active'"
          class="button mb-2 primary"
          @click="sendPayload()"
          >Issue</v-btn
        >
        <v-btn v-else class="button mb-2 error" @click="issueCredential()"
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
import { ISSUE_URL } from "../app-config";

@Component
export default class IssueCredentialModal extends Vue {
  @Prop() isVisible!: boolean;
  @Prop() entityName!: string;
  @Prop() registrationId!: string;

  private menu: boolean = false;

  private dialog: boolean = false;
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
  }

  @Watch("entityName")
  private onNamePropChanged() {
    this.name = this.entityName;
  }

  @Watch("isVisible")
  private onIdPropChanged() {
    this.id = this.registrationId;
  }

  @Watch("dialog")
  private onDialogChange(val: boolean) {
    val || this.close();
  }

  private issueCredential() {
    /* Business Logic:
      - Check if VC does not already exist or has existed in the past for the current holder with the SAME LICENSE NUMBER before creating VC
      - A holder can only have one valid BuyBC VC at a time, may have more than one revoked or expired VCs
      - If a credential has been expired or revoked it can NOT be reactivated. IAF will need to create a new license and new license number under a new BuyBC agreement
    */
    if (this.selectedStatus === "Active") {
      // Issue credential
      /* Search for VC TODO: Figure this out */
      if (true /* License exists */) {
        this.hasErrors = true;
        this.errorMessage =
          "Cannot issue BuyBC license. An active BuyBC license already exists for " +
          this.name +
          ". If you would like to issue a new BuyBC license, revoke the current license first.";
      } else if (
        false /* License with license number has existed in the past */
      ) {
        this.hasErrors = true;
        this.errorMessage =
          "Cannot issue BuyBC license. A BuyBC license with license number " +
          this.licenseNumber +
          "has already been created. Please enter a new license number to create a new BuyBC license.";
      } else {
        /* license does not exist and license number has not been created in the past*/
        this.sendPayload();
      }
    } else {
      // Revoke credential
      /* Search for VC TODO: Figure this out. */
      if (false /* License does not exist */) {
        this.hasErrors = true;
        this.errorMessage =
          "Cannot revoke BuyBC license. No license with license number " +
          this.licenseNumber +
          " exists for " +
          this.name +
          ".";
      } else {
        /* license exists */
        this.sendPayload();
      }
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
            license_number: "1",
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
      console.log(res);
    });
  }

  private close() {
    this.dialog = false;
    this.emitClose();
  }

  private revoke() {
    console.log("REVOKING!");
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
</script>
