// test-deterministic-time.js
// Run with: node test-deterministic-time.js

const BASE_URL = "http://localhost:3000";

async function test() {
  console.log("🧪 Testing deterministic time feature...\n");

  // Define test times FIRST
  const NOW = 1704067200000; // Jan 1, 2024 00:00:00
  const BEFORE_EXPIRY = NOW + 30000; // 30 seconds later
  const AFTER_EXPIRY = NOW + 61000; // 61 seconds later

  // Step 1: Create a paste with 60 second TTL at time NOW
  console.log("📝 Creating paste with 60s TTL at test time NOW...");
  const createResponse = await fetch(`${BASE_URL}/api/pastes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-now-ms": NOW.toString(), // Set creation time
    },
    body: JSON.stringify({
      content: "Test paste for time testing",
      ttl_seconds: 60,
    }),
  });

  const createData = await createResponse.json();
  const pasteId = createData.id;
  console.log(`✅ Created paste: ${pasteId}`);
  console.log(`   Created at: ${new Date(NOW).toISOString()}\n`);

  // Test 1: Fetch before expiry
  console.log("🔍 Test 1: Fetching BEFORE expiry (30s later)...");
  console.log(`   Time: ${new Date(BEFORE_EXPIRY).toISOString()}`);
  const test1Response = await fetch(`${BASE_URL}/api/pastes/${pasteId}`, {
    headers: { "x-test-now-ms": BEFORE_EXPIRY.toString() },
  });

  console.log(`   Status: ${test1Response.status}`);
  if (test1Response.ok) {
    const data = await test1Response.json();
    console.log(
      `   ✅ PASS - Got content: "${data.content.substring(0, 30)}..."`
    );
    console.log(`   Expires at: ${data.expires_at}`);
    console.log(`   Remaining views: ${data.remaining_views}`);
  } else {
    console.log(`   ❌ FAIL - Expected 200, got ${test1Response.status}`);
  }
  console.log();

  // Test 2: Fetch after expiry
  console.log("🔍 Test 2: Fetching AFTER expiry (61s later)...");
  console.log(`   Time: ${new Date(AFTER_EXPIRY).toISOString()}`);
  const test2Response = await fetch(`${BASE_URL}/api/pastes/${pasteId}`, {
    headers: { "x-test-now-ms": AFTER_EXPIRY.toString() },
  });

  console.log(`   Status: ${test2Response.status}`);
  if (test2Response.status === 404) {
    const data = await test2Response.json();
    console.log(`   ✅ PASS - Paste expired as expected`);
    console.log(`   Error: ${data.error}`);
  } else {
    const data = await test2Response.json();
    console.log(`   ❌ FAIL - Expected 404, got ${test2Response.status}`);
    console.log(`   Response:`, data);
  }
  console.log();

  // Test 3: Create paste with view limit
  console.log("📝 Creating paste with max_views=2...");
  const createResponse2 = await fetch(`${BASE_URL}/api/pastes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "View limit test",
      max_views: 2,
    }),
  });

  const createData2 = await createResponse2.json();
  const pasteId2 = createData2.id;
  console.log(`✅ Created paste: ${pasteId2}\n`);

  // Test 4: View limit - First view
  console.log("🔍 Test 3: First view...");
  const test3Response = await fetch(`${BASE_URL}/api/pastes/${pasteId2}`);
  if (test3Response.ok) {
    const data = await test3Response.json();
    console.log(`   ✅ PASS - Remaining views: ${data.remaining_views}`);
  }
  console.log();

  // Test 5: View limit - Second view
  console.log("🔍 Test 4: Second view...");
  const test4Response = await fetch(`${BASE_URL}/api/pastes/${pasteId2}`);
  if (test4Response.ok) {
    const data = await test4Response.json();
    console.log(`   ✅ PASS - Remaining views: ${data.remaining_views}`);
  }
  console.log();

  // Test 6: View limit - Third view (should fail)
  console.log("🔍 Test 5: Third view (should fail)...");
  const test5Response = await fetch(`${BASE_URL}/api/pastes/${pasteId2}`);
  console.log(`   Status: ${test5Response.status}`);
  if (test5Response.status === 404) {
    const data = await test5Response.json();
    console.log(`   ✅ PASS - View limit exceeded`);
    console.log(`   Error: ${data.error}`);
  } else {
    console.log(`   ❌ FAIL - Expected 404, got ${test5Response.status}`);
  }
  console.log();

  // Test 7: Combined constraints - TTL wins
  console.log("📝 Creating paste with both TTL (30s) and max_views (10)...");
  const createResponse3 = await fetch(`${BASE_URL}/api/pastes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-now-ms": NOW.toString(),
    },
    body: JSON.stringify({
      content: "Combined constraints test",
      ttl_seconds: 30,
      max_views: 10,
    }),
  });

  const createData3 = await createResponse3.json();
  const pasteId3 = createData3.id;
  console.log(`✅ Created paste: ${pasteId3}\n`);

  console.log("🔍 Test 6: Fetch after TTL expires (but views remain)...");
  const test6Response = await fetch(`${BASE_URL}/api/pastes/${pasteId3}`, {
    headers: { "x-test-now-ms": (NOW + 31000).toString() }, // 31 seconds later
  });

  console.log(`   Status: ${test6Response.status}`);
  if (test6Response.status === 404) {
    const data = await test6Response.json();
    console.log(`   ✅ PASS - TTL constraint triggered first`);
    console.log(`   Error: ${data.error}`);
  } else {
    console.log(`   ❌ FAIL - Expected 404, got ${test6Response.status}`);
  }
  console.log();

  console.log("✨ All tests completed!");
}

test().catch(console.error);
