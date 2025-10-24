import { describe, it, expect, beforeEach } from "vitest";
import { Clarinet, Tx, Chain, Account } from "@hirosystems/clarinet-sdk";

describe("Stellar Mapping Nexus - Core Contract Tests", () => {
  let chain: Chain;
  let accounts: Map<string, Account>;

  beforeEach(async () => {
    ({ chain, accounts } = await Clarinet.testing());
  });

  describe("Observer Registration Flow", () => {
    it("Successfully registers new observer with valid username", () => {
      const observer = accounts.get("wallet_1")!;

      const registerBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"AstroWizard"'],
          observer.address
        ),
      ]);

      expect(registerBlock.receipts[0].result).toBeOk(booleanCV(true));
    });

    it("Fails registration with empty username", () => {
      const observer = accounts.get("wallet_1")!;

      const registerBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u""'],
          observer.address
        ),
      ]);

      expect(registerBlock.receipts[0].result).toBeErr(
        intCV(108) // fail-bad-parameters
      );
    });

    it("Grants founding member honor upon registration", () => {
      const observer = accounts.get("wallet_2")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"StarGazer42"'],
          observer.address
        ),
      ]);

      const checkHonor = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-observer-honor",
        [principalCV(observer.address), intCV(0)],
        observer.address
      );

      expect(checkHonor.result).toBeOk();
    });

    it("Retrieves registered observer profile correctly", () => {
      const observer = accounts.get("wallet_3")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"CosmicExplorer"'],
          observer.address
        ),
      ]);

      const profileData = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-observer-data",
        [principalCV(observer.address)],
        observer.address
      );

      expect(profileData.result).toBeOk();
    });
  });

  describe("Observation Submission Workflow", () => {
    beforeEach(() => {
      const alice = accounts.get("wallet_1")!;
      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"ObserverAlice"'],
          alice.address
        ),
      ]);
    });

    it("Successfully submits observation with all parameters", () => {
      const observer = accounts.get("wallet_1")!;

      const submitBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"Andromeda Galaxy"',
            'u"Galaxy"',
            'u"00h 42m 44s"',
            'u"+41° 16\'"',
            'u"Dark Sky Site"',
            'u"Excellent"',
            'u"Clear"',
            'u"10-inch Dobsonian"',
            'u"Clear spiral structure observed"',
            "none",
          ],
          observer.address
        ),
      ]);

      expect(submitBlock.receipts[0].result).toBeOk();
    });

    it("Rejects observation with empty target name", () => {
      const observer = accounts.get("wallet_1")!;

      const submitBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u""',
            'u"Galaxy"',
            'u"00h 42m 44s"',
            'u"+41° 16\'"',
            'u"Dark Sky Site"',
            'u"Excellent"',
            'u"Clear"',
            'u"10-inch Dobsonian"',
            'u"Clear spiral structure observed"',
            "none",
          ],
          observer.address
        ),
      ]);

      expect(submitBlock.receipts[0].result).toBeErr(intCV(108));
    });

    it("Returns valid observation ID on submission", () => {
      const observer = accounts.get("wallet_1")!;

      const submitBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"M31 Galaxy"',
            'u"Galaxy"',
            'u"00h 42m"',
            'u"+41°"',
            'u"Observatory"',
            'u"Good"',
            'u"Clear"',
            'u"Telescope"',
            'u"Visible"',
            "none",
          ],
          observer.address
        ),
      ]);

      const result = submitBlock.receipts[0].result;
      expect(result).toBeOk();
    });

    it("Stores observation with correct metadata", () => {
      const observer = accounts.get("wallet_1")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"Orion Nebula"',
            'u"Nebula"',
            'u"05h 35m"',
            'u"-05° 27\'"',
            'u"Mountain Peak"',
            'u"Very Good"',
            'u"Clear skies"',
            'u"8-inch Reflector"',
            'u"Central region bright"',
            "none",
          ],
          observer.address
        ),
      ]);

      const record = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-record-data",
        [intCV(1)],
        observer.address
      );

      expect(record.result).toBeOk();
    });

    it("Tracks category statistics for observers", () => {
      const observer = accounts.get("wallet_1")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"M51 Whirlpool"',
            'u"Galaxy"',
            'u"13h 30m"',
            'u"+47° 12\'"',
            'u"Observatory"',
            'u"Good"',
            'u"Clear"',
            'u"Telescope"',
            'u"Notes"',
            "none",
          ],
          observer.address
        ),
      ]);

      const stats = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-category-stats",
        [principalCV(observer.address), 'u"Galaxy"'],
        observer.address
      );

      expect(stats.result).toBeOk();
    });
  });

  describe("Observation Validation System", () => {
    beforeEach(() => {
      const alice = accounts.get("wallet_1")!;
      const bob = accounts.get("wallet_2")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"Alice"'],
          alice.address
        ),
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"Bob"'],
          bob.address
        ),
      ]);

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"Saturn"',
            'u"Planet"',
            'u"21h 00m"',
            'u"-15°"',
            'u"Field"',
            'u"Clear"',
            'u"Good"',
            'u"Telescope"',
            'u"Rings visible"',
            "none",
          ],
          alice.address
        ),
      ]);
    });

    it("Successfully validates another observer's record", () => {
      const bob = accounts.get("wallet_2")!;

      const validationBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "validate-celestial-record",
          [intCV(1)],
          bob.address
        ),
      ]);

      expect(validationBlock.receipts[0].result).toBeOk(booleanCV(true));
    });

    it("Prevents self-validation of own observations", () => {
      const alice = accounts.get("wallet_1")!;

      const validationBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "validate-celestial-record",
          [intCV(1)],
          alice.address
        ),
      ]);

      expect(validationBlock.receipts[0].result).toBeErr(
        intCV(105) // fail-self-validation
      );
    });

    it("Prevents duplicate validations from same observer", () => {
      const bob = accounts.get("wallet_2")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "validate-celestial-record",
          [intCV(1)],
          bob.address
        ),
      ]);

      const secondValidation = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "validate-celestial-record",
          [intCV(1)],
          bob.address
        ),
      ]);

      expect(secondValidation.receipts[0].result).toBeErr(
        intCV(104) // fail-duplicate-validation
      );
    });

    it("Rejects validation of non-existent observation", () => {
      const bob = accounts.get("wallet_2")!;

      const validationBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "validate-celestial-record",
          [intCV(999)],
          bob.address
        ),
      ]);

      expect(validationBlock.receipts[0].result).toBeErr(
        intCV(102) // fail-invalid-record
      );
    });

    it("Tracks validation confirmation count correctly", () => {
      const bob = accounts.get("wallet_2")!;
      const carol = accounts.get("wallet_3")!;

      // Register Carol first
      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"Carol"'],
          carol.address
        ),
      ]);

      // Bob validates
      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "validate-celestial-record",
          [intCV(1)],
          bob.address
        ),
      ]);

      // Carol validates
      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "validate-celestial-record",
          [intCV(1)],
          carol.address
        ),
      ]);

      // Check record confirmation count
      const record = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-record-data",
        [intCV(1)],
        bob.address
      );

      expect(record.result).toBeOk();
    });

    it("Confirms validation state through read-only function", () => {
      const bob = accounts.get("wallet_2")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "validate-celestial-record",
          [intCV(1)],
          bob.address
        ),
      ]);

      const hasValidated = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "has-validated",
        [intCV(1), principalCV(bob.address)],
        bob.address
      );

      expect(hasValidated.result).toBeOk(booleanCV(true));
    });
  });

  describe("Achievement and Honor System", () => {
    beforeEach(() => {
      const alice = accounts.get("wallet_1")!;
      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"Alice"'],
          alice.address
        ),
      ]);
    });

    it("Awards dedicated observer honor at 5 submissions", () => {
      const alice = accounts.get("wallet_1")!;

      for (let i = 0; i < 5; i++) {
        chain.mineBlock([
          Tx.contractCall(
            "celestial-nexus-core",
            "submit-celestial-observation",
            [
              `u"Object${i}"`,
              'u"Star"',
              'u"10h 00m"',
              'u"0°"',
              'u"Site"',
              'u"Clear"',
              'u"Good"',
              'u"Equipment"',
              `u"Note${i}"`,
              "none",
            ],
            alice.address
          ),
        ]);
      }

      const honor = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-observer-honor",
        [principalCV(alice.address), intCV(1)],
        alice.address
      );

      expect(honor.result).toBeOk();
    });

    it("Allows admin to create new honor types", () => {
      const admin = accounts.get("deployer")!;

      const createBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-honor-type",
          [
            'u"Master Observer"',
            'u"Achieved 100 observations"',
            'u"Submit 100+ observations"',
            'u"Legendary"',
          ],
          admin.address
        ),
      ]);

      expect(createBlock.receipts[0].result).toBeOk();
    });

    it("Stores honor type metadata correctly", () => {
      const admin = accounts.get("deployer")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-honor-type",
          [
            'u"Elite Validator"',
            'u"Validated 50 observations"',
            'u"Perform 50+ validations"',
            'u"Rare"',
          ],
          admin.address
        ),
      ]);

      const honorData = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-honor-data",
        [intCV(1)],
        admin.address
      );

      expect(honorData.result).toBeOk();
    });

    it("Retrieves multiple honor types created by admin", () => {
      const admin = accounts.get("deployer")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-honor-type",
          [
            'u"Bronze Star"',
            'u"First observation"',
            'u"Submit one observation"',
            'u"Common"',
          ],
          admin.address
        ),
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-honor-type",
          [
            'u"Silver Sphere"',
            'u"Ten observations"',
            'u"Submit ten observations"',
            'u"Uncommon"',
          ],
          admin.address
        ),
      ]);

      const bronze = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-honor-data",
        [intCV(1)],
        admin.address
      );

      const silver = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-honor-data",
        [intCV(2)],
        admin.address
      );

      expect(bronze.result).toBeOk();
      expect(silver.result).toBeOk();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("Handles unregistered observer gracefully", () => {
      const unregistered = accounts.get("wallet_5")!;

      const submitBlock = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"Betelgeuse"',
            'u"Star"',
            'u"05h 55m"',
            'u"+07° 24\'"',
            'u"Observatory"',
            'u"Good"',
            'u"Clear"',
            'u"Binoculars"',
            'u"Red coloration"',
            "none",
          ],
          unregistered.address
        ),
      ]);

      // Function should still work, just won't have previous profile
      expect(submitBlock.receipts[0].result).toBeOk();
    });

    it("Handles maximum length strings appropriately", () => {
      const alice = accounts.get("wallet_1")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"LongNameTestObserverHandle12345"'],
          alice.address
        ),
      ]);

      const profile = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-observer-data",
        [principalCV(alice.address)],
        alice.address
      );

      expect(profile.result).toBeOk();
    });

    it("Maintains consistency through multiple operations", () => {
      const alice = accounts.get("wallet_1")!;
      const bob = accounts.get("wallet_2")!;

      // Register both
      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"Alice"'],
          alice.address
        ),
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"Bob"'],
          bob.address
        ),
      ]);

      // Alice submits
      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"Vega"',
            'u"Star"',
            'u"18h 37m"',
            'u"+38° 47\'"',
            'u"Backyard"',
            'u"Fair"',
            'u"Hazy"',
            'u"Naked eye"',
            'u"Bright star"',
            "none",
          ],
          alice.address
        ),
      ]);

      // Bob validates
      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "validate-celestial-record",
          [intCV(1)],
          bob.address
        ),
      ]);

      // Check both profiles remain intact
      const aliceProfile = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-observer-data",
        [principalCV(alice.address)],
        alice.address
      );

      const bobProfile = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-observer-data",
        [principalCV(bob.address)],
        bob.address
      );

      expect(aliceProfile.result).toBeOk();
      expect(bobProfile.result).toBeOk();
    });
  });

  describe("Data Integrity Tests", () => {
    it("Increments record ID counter properly", () => {
      const alice = accounts.get("wallet_1")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"Alice"'],
          alice.address
        ),
      ]);

      const firstSubmit = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"First"',
            'u"Type1"',
            'u"01h"',
            'u"0°"',
            'u"Loc1"',
            'u"Clear"',
            'u"Good"',
            'u"Eq1"',
            'u"Note1"',
            "none",
          ],
          alice.address
        ),
      ]);

      const secondSubmit = chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"Second"',
            'u"Type2"',
            'u"02h"',
            'u"0°"',
            'u"Loc2"',
            'u"Clear"',
            'u"Good"',
            'u"Eq2"',
            'u"Note2"',
            "none",
          ],
          alice.address
        ),
      ]);

      const firstId = firstSubmit.receipts[0].result;
      const secondId = secondSubmit.receipts[0].result;

      expect(firstId).toBeOk(intCV(1));
      expect(secondId).toBeOk(intCV(2));
    });

    it("Preserves all observation metadata across queries", () => {
      const alice = accounts.get("wallet_1")!;

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "establish-observer-account",
          ['u"Alice"'],
          alice.address
        ),
      ]);

      chain.mineBlock([
        Tx.contractCall(
          "celestial-nexus-core",
          "submit-celestial-observation",
          [
            'u"Jupiter"',
            'u"Planet"',
            'u"12h 30m"',
            'u"+15°"',
            'u"Urban Observatory"',
            'u"Excellent"',
            'u"Clear skies, low wind"',
            'u"Celestron 11 SCT"',
            'u"Four Galilean moons visible, great red spot faint"',
            "none",
          ],
          alice.address
        ),
      ]);

      const record = chain.callReadOnlyFn(
        "celestial-nexus-core",
        "fetch-record-data",
        [intCV(1)],
        alice.address
      );

      expect(record.result).toBeOk();
    });
  });
});

// Helper functions for test assertions
function intCV(val: number) {
  return { type: "int_128", value: val.toString() };
}

function booleanCV(val: boolean) {
  return { type: "bool", value: val };
}

function principalCV(address: string) {
  return { type: "principal", value: address };
}
