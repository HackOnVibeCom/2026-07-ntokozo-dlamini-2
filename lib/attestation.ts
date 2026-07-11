/**
 * Creates an ECDSA signature of the campaign data to verify local authenticity.
 * Uses Web Crypto API (available in all modern browsers).
 */
export async function signCampaignOutput(
  campaignDataText: string,
  signingPrivateKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(campaignDataText);

  const signatureBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    signingPrivateKey,
    rawBytes
  );

  // Convert to URL-safe Base64
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binaryString = "";
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binaryString += String.fromCharCode(signatureBytes[i]);
  }
  return btoa(binaryString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Verifies that the campaign attestation signature matches the input parameters.
 */
export async function verifyCampaignOutput(
  campaignDataText: string,
  signatureBase64Url: string,
  verificationPublicKey: CryptoKey
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const rawBytes = encoder.encode(campaignDataText);

    // Reconstruct standard Base64 from URL-safe parameter
    let base64 = signatureBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    const binaryString = atob(base64);
    const signatureBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      signatureBuffer[i] = binaryString.charCodeAt(i);
    }

    return await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      verificationPublicKey,
      signatureBuffer.buffer,
      rawBytes
    );
  } catch (error) {
    console.error("Attestation verification check failure:", error);
    return false;
  }
}

/**
 * Generates or retrieves a persistent ECDSA key pair for the user.
 * Keys are stored in IndexedDB for persistence across sessions.
 */
export async function getOrCreateKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
}> {
  // Check IndexedDB for existing keys
  const dbName = "swarmlaunch-keys";
  const storeName = "keys";

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }
    };

    request.onsuccess = async () => {
      const db = request.result;
      const transaction = db.transaction("keys", "readwrite");
      const store = transaction.objectStore("keys");

      const getRequest = store.get("user-keypair");
      getRequest.onsuccess = async () => {
        if (getRequest.result) {
          // Import existing keys
          const { privateKey, publicKey } = getRequest.result;
          resolve({ privateKey, publicKey });
        } else {
          // Generate new key pair
          const keyPair = await crypto.subtle.generateKey(
            {
              name: "ECDSA",
              namedCurve: "P-256",
            },
            true, // extractable
            ["sign", "verify"]
          );

          const exportedPrivate = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
          const exportedPublic = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

          store.put(
            { privateKey: exportedPrivate, publicKey: exportedPublic },
            "user-keypair"
          );

          resolve({ privateKey: keyPair.privateKey, publicKey: keyPair.publicKey });
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Exports public key as JWK for sharing/verification
 */
export async function exportPublicKeyJWK(publicKey: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", publicKey);
}

/**
 * Imports public key from JWK
 */
export async function importPublicKeyJWK(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}