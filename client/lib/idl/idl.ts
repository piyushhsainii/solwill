export type DeadWallet = {
  address: "uJ5ujCBYYNJ7V4Fpurewj9cDSPT3jHnEKLnaxYPYss9";
  metadata: {
    name: "deadWallet";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "addHeirsToWill";
      discriminator: [24, 107, 75, 226, 106, 200, 162, 146];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "heirAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [104, 101, 105, 114];
              },
              {
                kind: "account";
                path: "heirOriginalAddress";
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "signer";
              },
            ];
          };
        },
        {
          name: "heirOriginalAddress";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "bps";
          type: "u32";
        },
      ];
    },
    {
      name: "checkinWill";
      discriminator: [225, 233, 193, 202, 207, 192, 5, 142];
      accounts: [
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "owner";
              },
            ];
          };
        },
      ];
      args: [];
    },
    {
      name: "claimLl";
      discriminator: [254, 62, 102, 27, 225, 134, 67, 190];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "willAccountAddress";
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "willAccountAddress";
              },
            ];
          };
        },
        {
          name: "heirAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [104, 101, 105, 114];
              },
              {
                kind: "account";
                path: "heirAccountAddress";
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "heirAccountAddress";
          writable: true;
        },
        {
          name: "vaultAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
      ];
      args: [];
    },
    {
      name: "depositSol";
      discriminator: [108, 81, 78, 117, 125, 155, 56, 200];
      accounts: [
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "owner";
              },
            ];
          };
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "tokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "amt";
          type: "u64";
        },
      ];
    },
    {
      name: "depositSplTokens";
      discriminator: [80, 107, 42, 240, 194, 145, 217, 8];
      accounts: [
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "owner";
              },
            ];
          };
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "mint";
        },
        {
          name: "ownerAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "owner";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "vaultAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "vault";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
      ];
      args: [
        {
          name: "amt";
          type: "u64";
        },
      ];
    },
    {
      name: "dissolveWill";
      discriminator: [185, 206, 10, 102, 132, 214, 21, 76];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "signer";
              },
            ];
          };
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
        },
      ];
      args: [];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "signer";
              },
            ];
          };
        },
        {
          name: "masterVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "interval";
          type: "i64";
        },
      ];
    },
    {
      name: "removeHeirFromWill";
      discriminator: [189, 45, 85, 139, 46, 129, 111, 88];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "heirOriginalAddress";
          writable: true;
        },
        {
          name: "heirAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [104, 101, 105, 114];
              },
              {
                kind: "account";
                path: "heirOriginalAddress";
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "signer";
              },
            ];
          };
        },
        {
          name: "newHeirAddress";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "bps";
          type: "u32";
        },
      ];
    },
    {
      name: "updateHeirFromWill";
      discriminator: [29, 171, 254, 244, 173, 61, 77, 237];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "heirAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [104, 101, 105, 114];
              },
              {
                kind: "account";
                path: "heirOriginalAddress";
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "signer";
              },
            ];
          };
        },
        {
          name: "heirOriginalAddress";
          writable: true;
        },
        {
          name: "newHeirAddress";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "updatedBps";
          type: "u32";
        },
      ];
    },
    {
      name: "updateWillFun";
      discriminator: [230, 172, 132, 171, 130, 2, 10, 146];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "signer";
              },
            ];
          };
        },
        {
          name: "masterVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "interval";
          type: "i64";
        },
      ];
    },
    {
      name: "withdrawSolToken";
      discriminator: [52, 145, 111, 6, 92, 142, 132, 7];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "signer";
              },
            ];
          };
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "amt";
          type: "u32";
        },
      ];
    },
    {
      name: "withdrawSplToken";
      discriminator: [219, 156, 234, 11, 89, 235, 246, 32];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "willAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [119, 105, 108, 108];
              },
              {
                kind: "account";
                path: "signer";
              },
            ];
          };
        },
        {
          name: "ownerAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "signer";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "vaultMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "willAccount";
              },
            ];
          };
        },
        {
          name: "vaultMint";
        },
        {
          name: "vaultAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "vault";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "vaultMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
        },
      ];
      args: [
        {
          name: "amt";
          type: "u32";
        },
      ];
    },
  ];
  accounts: [
    {
      name: "heir";
      discriminator: [102, 55, 217, 17, 95, 202, 14, 93];
    },
    {
      name: "vault";
      discriminator: [211, 8, 232, 43, 2, 152, 117, 119];
    },
    {
      name: "willAccount";
      discriminator: [53, 79, 176, 71, 204, 63, 102, 188];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "lowBalance";
      msg: "Insuffiecient Balance";
    },
    {
      code: 6001;
      name: "unauthorisedDepositor";
      msg: "Owner is unauthorized";
    },
    {
      code: 6002;
      name: "accountsNotProvided";
      msg: "Required Accounts are not provided";
    },
    {
      code: 6003;
      name: "bpsNotInvalid";
      msg: "BPS cannot exceeded 10,000";
    },
    {
      code: 6004;
      name: "bpsOverflow";
      msg: "BPS Overflowing";
    },
    {
      code: 6005;
      name: "ownerNotValid";
      msg: "Owner Will is Different";
    },
    {
      code: 6006;
      name: "heirNotValid";
      msg: "Heirs Account does not match";
    },
    {
      code: 6007;
      name: "willAlreadyClaimed";
      msg: "Will already Claimed";
    },
    {
      code: 6008;
      name: "willActive";
      msg: "Will is still Active";
    },
    {
      code: 6009;
      name: "mathError";
      msg: "Could not Calculate BPS Share while claiming";
    },
    {
      code: 6010;
      name: "tooManyAssets";
      msg: "Cannot add more than 5 assets";
    },
    {
      code: 6011;
      name: "claimFundsAccountsNotValid";
      msg: "Required Accounts to claim funds are not valid";
    },
    {
      code: 6012;
      name: "dissolveFundsAccountsNotValid";
      msg: "Required Accounts to dissolved accounts are not valid";
    },
    {
      code: 6013;
      name: "vaultAtaInvalid";
      msg: "Vault ATA does not exist";
    },
    {
      code: 6014;
      name: "mintAccountNotValid";
      msg: "Provided Mint Account does not exist in Will";
    },
    {
      code: 6015;
      name: "ownerAtaNotCorrect";
      msg: "Owner ATA ";
    },
    {
      code: 6016;
      name: "heirMaxLimitReached";
      msg: "Max Limit Reached to add heirs";
    },
    {
      code: 6017;
      name: "willDeadlinePassed";
      msg: "deadlineAlreadyPassed";
    },
  ];
  types: [
    {
      name: "heir";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bps";
            type: "u32";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "status";
            type: {
              defined: {
                name: "heirStatus";
              };
            };
          },
          {
            name: "walletAddress";
            type: "pubkey";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "heirStatus";
      type: {
        kind: "enum";
        variants: [
          {
            name: "active";
          },
          {
            name: "claimed";
          },
        ];
      };
    },
    {
      name: "spltokens";
      type: {
        kind: "struct";
        fields: [
          {
            name: "mint";
            type: "pubkey";
          },
          {
            name: "balance";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "vault";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "solBalance";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "willAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "interval";
            type: "i64";
          },
          {
            name: "lastCheckIn";
            type: "i64";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "claimed";
            type: "bool";
          },
          {
            name: "totalBps";
            type: "u32";
          },
          {
            name: "totalBal";
            type: "u32";
          },
          {
            name: "hasSol";
            type: "bool";
          },
          {
            name: "heirCount";
            type: "u32";
          },
          {
            name: "assets";
            type: {
              vec: {
                defined: {
                  name: "spltokens";
                };
              };
            };
          },
        ];
      };
    },
  ];
};
