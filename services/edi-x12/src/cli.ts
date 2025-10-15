#!/usr/bin/env node

/**
 * CLI tool to generate 837D files from JSON claim data
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { build837D } from './builder837D.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function main() {
  try {
    // Read sample claim data
    const claimPath = join(__dirname, '../sample/claim.json');
    const claimData = JSON.parse(readFileSync(claimPath, 'utf-8'));
    
    // Build 837D transaction
    console.log('🏗️  Building 837D transaction...');
    const edi837d = build837D(claimData);
    
    // Ensure outbox directory exists
    const outboxDir = join(__dirname, '../outbox');
    mkdirSync(outboxDir, { recursive: true });
    
    // Write to file
    const outputPath = join(outboxDir, `${claimData.claimId}.837d`);
    writeFileSync(outputPath, edi837d, 'utf-8');
    
    console.log('✅ 837D file generated successfully!');
    console.log(`📄 Output: ${outputPath}`);
    console.log(`📊 Size: ${edi837d.length} bytes`);
    
    // Display first few lines
    const lines = edi837d.split('\n');
    console.log('\n📋 Preview (first 5 segments):');
    lines.slice(0, 5).forEach((line, i) => {
      console.log(`  ${i + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error generating 837D file:', error);
    process.exit(1);
  }
}

main();
