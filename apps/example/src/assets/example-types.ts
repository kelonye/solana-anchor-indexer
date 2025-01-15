/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/example.json`.
 */
export type Example = {
  "address": "6mSByxsNqCRHXHuPmJdsgArE9uESE98YR6fREFomvJrv",
  "metadata": {
    "name": "example",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "resetStore",
      "discriminator": [
        117,
        225,
        39,
        35,
        89,
        31,
        171,
        146
      ],
      "accounts": [
        {
          "name": "store",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "setStore",
      "discriminator": [
        68,
        104,
        180,
        56,
        103,
        244,
        173,
        236
      ],
      "accounts": [
        {
          "name": "store",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "exampleStore",
      "discriminator": [
        47,
        165,
        99,
        162,
        180,
        239,
        153,
        133
      ]
    }
  ],
  "events": [
    {
      "name": "timestampSet",
      "discriminator": [
        72,
        47,
        45,
        158,
        93,
        234,
        23,
        231
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidTimestamp"
    }
  ],
  "types": [
    {
      "name": "exampleStore",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "timestampSet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
