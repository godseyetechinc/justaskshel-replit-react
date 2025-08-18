import { seedUsers } from './seed-users';

async function runSeeding() {
  console.log('Starting user seeding process...');
  
  try {
    await seedUsers();
    console.log('✅ User seeding completed successfully!');
  } catch (error) {
    console.error('❌ User seeding failed:', error);
    process.exit(1);
  }
}

runSeeding();