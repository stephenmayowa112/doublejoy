/**
 * Upload Speed Test
 * Tests if subsequent uploads are faster after initial compilation
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Create a test image buffer (1x1 pixel PNG)
function createTestImageBuffer() {
  const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(base64PNG, 'base64');
}

async function testUpload(testNumber) {
  const startTime = Date.now();
  
  log(`\n🚀 Upload Test ${testNumber} - Starting...`, colors.cyan);
  
  const formData = new FormData();
  const imageBuffer = createTestImageBuffer();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  
  formData.append('files', blob, `test-image-${testNumber}.png`);

  try {
    const response = await fetch('http://localhost:3002/api/upload', {
      method: 'POST',
      body: formData,
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (response.status === 201) {
      log(`✅ Upload Test ${testNumber} - SUCCESS in ${duration}s`, colors.green);
      return { testNumber, duration: parseFloat(duration), success: true };
    } else {
      log(`❌ Upload Test ${testNumber} - FAILED (${response.status}) in ${duration}s`, colors.yellow);
      return { testNumber, duration: parseFloat(duration), success: false };
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    log(`❌ Upload Test ${testNumber} - ERROR in ${duration}s: ${error.message}`, colors.yellow);
    return { testNumber, duration: parseFloat(duration), success: false, error: error.message };
  }
}

async function runTests() {
  log('\n📊 Testing Upload Speed - Subsequent uploads should be faster\n', colors.cyan);
  log('⏱️  Running 3 upload tests...\n', colors.cyan);
  
  const results = [];
  
  // Run 3 sequential upload tests
  for (let i = 1; i <= 3; i++) {
    const result = await testUpload(i);
    results.push(result);
    
    if (i < 3) {
      // Wait 2 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Display summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('📈 Upload Speed Test Results:', colors.cyan);
  log('='.repeat(60), colors.cyan);
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    log(`Test ${index + 1}: ${status} - ${result.duration}s`, result.success ? colors.green : colors.yellow);
  });
  
  // Calculate improvement
  if (results.length >= 2 && results[0].success && results[1].success) {
    const improvement = ((results[0].duration - results[1].duration) / results[0].duration * 100).toFixed(1);
    log(`\n🚀 Speed Improvement: ${improvement}% faster from test 1 to test 2`, colors.green);
  }
  
  log('='.repeat(60) + '\n', colors.cyan);
}

runTests().catch(console.error);
