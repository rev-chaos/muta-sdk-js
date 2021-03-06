import { DEFAULT_PRIVATE_KEY } from '@mutadev/defaults';
import { Bytes, SignedTransaction, Transaction } from '@mutadev/types';
import {
  createTransactionSignature,
  keccak,
  publicKeyCreate,
  separateOutRawTransaction,
  toBuffer,
  toHex,
} from '@mutadev/utils';

/**
 * If you are familiar with Ethereum, you will find that Muta's account system is similar to Ethereum.
 * Simply put, Muta's account is also secured by ECDSA cryptography.
 * A private key corresponds to a Muta account.
 * We can use the private key to create an account like this `new Account('0x...')`.
 * Generally used for [[signTransaction]]
 *
 * Here is an example:
 * ```js
 * import { Account } from '@mutadev/account';
 * import { Client } from '@mutadev/client';
 *
 * async function example() {
 *   const client = new Client();
 *   const account = new Account('0x...'); // private key
 *
 *   // create an UDT
 *   const rawTransaction = await client.composeTransaction({
 *     serviceName: 'asset',
 *     method: 'create_asset',
 *     payload: {
 *       name: 'MyToken',
 *       symbol: 'MT',
 *       supply: 100_000_000,
 *     }
 *   });
 *
 *   const signedTransaction = account.signTransaction(rawTransaction);
 *   client.sendTransaction(signedTransaction);
 * }
 * ```
 */
export class Account {
  private readonly _privateKey: Buffer;

  constructor(privateKey: Buffer | Bytes = DEFAULT_PRIVATE_KEY) {
    this._privateKey = toBuffer(privateKey);
  }

  get publicKey(): string {
    return toHex(this._publicKey);
  }

  get address(): string {
    return toHex(this._address);
  }

  private get _publicKey(): Buffer {
    return publicKeyCreate(this._privateKey);
  }

  private get _address(): Buffer {
    return Account.addressFromPublicKey(this._publicKey);
  }

  /**
   *
   * @param privateKey, hex string starts with 0x, the private is 32 bytes
   * @return [[Account]]
   */
  public static fromPrivateKey(privateKey: string): Account {
    return new Account(toBuffer(privateKey));
  }

  /**
   * get the account address from a public key
   * @param publicKey, string | Buffer,
   * @return Buffer,
   */
  public static addressFromPublicKey(publicKey: Buffer | string): Buffer {
    const hashed = keccak(toBuffer(publicKey));
    return hashed.slice(0, 20);
  }

  /**
   * sign a Muta transaction with this Account's internal private key
   *
   * @param tx, [[Transaction]]
   * @return [[SignedTransaction]]
   */
  public signTransaction(
    tx: Transaction | SignedTransaction,
  ): SignedTransaction {
    const { txHash, signature, pubkey } = createTransactionSignature(
      tx,
      this._privateKey,
    );

    return {
      ...separateOutRawTransaction(tx),
      pubkey,
      signature,
      txHash,
    };
  }
}
