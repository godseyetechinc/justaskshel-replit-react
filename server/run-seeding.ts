import { seedUsers } from './seed-users';
import { seedClaims } from './seed-claims';

async function runSeeding() {
  console.log('Starting comprehensive seeding process...');
  
  try {
    // First seed users and policies
    await seedUsers();
    console.log('✅ User seeding completed successfully!');
    
    // Then seed claims with complete data
    console.log('Starting claims seeding...');
    await seedClaims();
    console.log('✅ Claims seeding completed successfully!');
    
    console.log('\n🎉 ALL SEEDING COMPLETED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeding();