#!/usr/bin/env node

/**
 * ERPNext Connection Test Script
 * 
 * Tests the connection to ERPNext and validates API credentials
 * Run this before using the UI to ensure everything is configured correctly
 */

import { testERPNextConnection } from './src/services/erpnextService.js';

console.log('🔍 Testing ERPNext Connection...\n');

// Check if environment variables are set
const apiKey = process.env.VITE_ERPNEXT_API_KEY;
const apiSecret = process.env.VITE_ERPNEXT_API_SECRET;
const baseUrl = process.env.VITE_ERPNEXT_URL || 'http://localhost:8080';

console.log('Configuration:');
console.log(`  Base URL: ${baseUrl}`);
console.log(`  API Key: ${apiKey ? '✓ Set' : '✗ Not set'}`);
console.log(`  API Secret: ${apiSecret ? '✓ Set' : '✗ Not set'}`);
console.log('');

if (!apiKey || !apiSecret) {
  console.error('❌ ERROR: ERPNext API credentials not configured!');
  console.error('');
  console.error('Please follow these steps:');
  console.error('1. Copy .env.example to .env');
  console.error('2. Add your ERPNext API credentials to .env');
  console.error('3. Restart this script');
  console.error('');
  console.error('See ERPNEXT_INTEGRATION.md for detailed instructions');
  process.exit(1);
}

// Test connection
try {
  const result = await testERPNextConnection();
  
  if (result.success) {
    console.log('✅ SUCCESS: Connected to ERPNext!');
    console.log(`   ${result.message}`);
    console.log('');
    console.log('You can now:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to http://localhost:3000');
    console.log('3. Submit Purchase Orders to ERPNext');
    process.exit(0);
  } else {
    console.error('❌ ERROR: Connection failed');
    console.error(`   ${result.message}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('- Verify ERPNext is running at', baseUrl);
    console.error('- Check API credentials in .env file');
    console.error('- See ERPNEXT_INTEGRATION.md for help');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ ERROR: Connection test failed');
  console.error(`   ${error.message}`);
  console.error('');
  console.error('Troubleshooting:');
  console.error('- Verify ERPNext is running at', baseUrl);
  console.error('- Check network connectivity');
  console.error('- Check CORS configuration in ERPNext');
  console.error('- See ERPNEXT_INTEGRATION.md for help');
  process.exit(1);
}
