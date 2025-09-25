#!/usr/bin/env tsx

// Simple migration script to run the person data migration
import { storage } from './server/storage.ts';

async function runMigration() {
  try {
    console.log('Starting person data migration...');
    const result = await storage.migrateDataToPersons();
    console.log('Migration completed successfully:', result);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();