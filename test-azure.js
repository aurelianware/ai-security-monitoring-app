// Test Azure Blob Storage Connection
const accountName = "aurelianwarestorage";
const containerName = "security-events";
const sasToken = "sp=racwdl&st=2025-10-11T06:08:53Z&se=2026-01-02T14:23:53Z&spr=https&sv=2024-11-04&sr=c&sig=BCl1ObQ4J24d7zppHXnYCDr044Egra50fYHknnHB1io%3D";

const baseUrl = `https://${accountName}.blob.core.windows.net/${containerName}`;
const testFileName = "test/connection_test.json";
const url = `${baseUrl}/${testFileName}?${sasToken}`;

console.log("=== Connection Test ===");
console.log("Account:", accountName);
console.log("Container:", containerName);
console.log("Base URL:", baseUrl);
console.log("Test URL:", url);
console.log("");

// Test 1: Try to list container contents
console.log("🔍 Test 1: List container contents");
const listUrl = `${baseUrl}?comp=list&restype=container&${sasToken}`;
console.log("List URL:", listUrl);

fetch(listUrl)
  .then(response => {
    console.log("List response status:", response.status);
    console.log("List response headers:", Object.fromEntries(response.headers.entries()));
    return response.text();
  })
  .then(text => {
    console.log("List response body:", text.substring(0, 500) + "...");
  })
  .catch(error => {
    console.error("List test failed:", error);
  });

// Test 2: Try to upload a small file
console.log("");
console.log("📤 Test 2: Upload test file");
const testData = JSON.stringify({ test: true, timestamp: new Date() });
const blob = new Blob([testData], { type: 'application/json' });

fetch(url, {
  method: 'PUT',
  body: blob,
  headers: {
    'x-ms-blob-type': 'BlockBlob',
    'Content-Type': 'application/json',
  },
})
.then(response => {
  console.log("Upload response status:", response.status);
  console.log("Upload response headers:", Object.fromEntries(response.headers.entries()));
  return response.text();
})
.then(text => {
  console.log("Upload response body:", text);
})
.catch(error => {
  console.error("Upload test failed:", error);
});