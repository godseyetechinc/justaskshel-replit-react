import { db } from './db';
import { users, contacts, roles } from '../shared/schema';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Generate random password hash
const generatePasswordHash = async (password: string = 'password123') => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Generate phone number within varchar(20) limit
const generatePhoneNumber = () => {
  return faker.phone.number('###-###-####'); // Format: XXX-XXX-XXXX (12 chars)
};

// Generate zip code within varchar(10) limit
const generateZipCode = () => {
  return faker.location.zipCode('#####'); // Format: XXXXX (5 chars)
};

// Generate state abbreviation within varchar(50) limit
const generateState = () => {
  return faker.location.state({ abbreviated: true }); // 2 chars
};

export async function seedUsers() {
  try {
    console.log('Starting user seeding...');

    // Clear existing data
    await db.delete(contacts);
    await db.delete(users);
    
    console.log('Cleared existing users and contacts');

    const passwordHash = await generatePasswordHash();

    // Create admins (5)
    const adminUsers = [];
    for (let i = 0; i < 5; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = `admin${i + 1}@justaskshel.com`;
      
      const [admin] = await db.insert(users).values({
        email,
        firstName,
        lastName,
        password: passwordHash,
        role: 'Admin' as const,
        privilegeLevel: 1,
        isActive: true,
        phone: generatePhoneNumber(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
        dateOfBirth: faker.date.birthdate({ min: 25, max: 65, mode: 'age' }),
        profileImageUrl: faker.image.avatar()
      }).returning();
      
      adminUsers.push(admin);
      
      // Create contact for admin
      await db.insert(contacts).values({
        type: 'Agent', // Using existing enum values
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone || generatePhoneNumber(),
        address: admin.address || faker.location.streetAddress(),
        city: admin.city || faker.location.city(),
        state: admin.state || faker.location.state({ abbreviated: true }),
        zipCode: admin.zipCode || faker.location.zipCode(),
        notes: `Admin user contact record for ${admin.firstName} ${admin.lastName}`,
        status: 'Active',
        assignedAgent: admin.id
      });
    }

    console.log('Created 5 admin users with contacts');

    // Create agents (10)
    const agentUsers = [];
    for (let i = 0; i < 10; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = `agent${i + 1}@justaskshel.com`;
      
      const [agent] = await db.insert(users).values({
        email,
        firstName,
        lastName,
        password: passwordHash,
        role: 'Agent' as const,
        privilegeLevel: 2,
        isActive: true,
        phone: generatePhoneNumber(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
        dateOfBirth: faker.date.birthdate({ min: 25, max: 55, mode: 'age' }),
        profileImageUrl: faker.image.avatar()
      }).returning();
      
      agentUsers.push(agent);
      
      // Create contact for agent
      await db.insert(contacts).values({
        type: 'Agent',
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        phone: agent.phone || generatePhoneNumber(),
        address: agent.address || faker.location.streetAddress(),
        city: agent.city || faker.location.city(),
        state: agent.state || faker.location.state({ abbreviated: true }),
        zipCode: agent.zipCode || faker.location.zipCode(),
        notes: `Insurance agent contact record for ${agent.firstName} ${agent.lastName}`,
        status: 'Active',
        assignedAgent: agent.id
      });
    }

    console.log('Created 10 agent users with contacts');

    // Create members (200) - each associated with an agent
    const memberUsers = [];
    for (let i = 0; i < 200; i++) {
      // Assign to random agent
      const assignedAgent = faker.helpers.arrayElement(agentUsers);
      
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email().toLowerCase();
      
      const [member] = await db.insert(users).values({
        email,
        firstName,
        lastName,
        password: passwordHash,
        role: 'Member' as const,
        privilegeLevel: 3,
        isActive: faker.datatype.boolean(0.9), // 90% active
        phone: generatePhoneNumber(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        profileImageUrl: faker.image.avatar()
      }).returning();
      
      memberUsers.push(member);
      
      // Create contact for member
      await db.insert(contacts).values({
        type: 'Customer',
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone || generatePhoneNumber(),
        address: member.address || faker.location.streetAddress(),
        city: member.city || faker.location.city(),
        state: member.state || faker.location.state({ abbreviated: true }),
        zipCode: member.zipCode || faker.location.zipCode(),
        notes: `Member contact record for ${member.firstName} ${member.lastName}. Assigned to agent: ${assignedAgent.firstName} ${assignedAgent.lastName}`,
        status: member.isActive ? 'Active' : 'Inactive',
        assignedAgent: assignedAgent.id
      });

      if ((i + 1) % 50 === 0) {
        console.log(`Created ${i + 1} member users with contacts`);
      }
    }

    console.log('Created 200 member users with contacts');

    // Create additional contacts (1000 total - we already have 215, so create 785 more)
    const allUsers = [...adminUsers, ...agentUsers, ...memberUsers];
    
    for (let i = 0; i < 785; i++) {
      // Randomly assign to existing users for relationship tracking
      const relatedUser = faker.helpers.arrayElement(allUsers);
      const assignedAgent = relatedUser.role === 'Agent' ? relatedUser : faker.helpers.arrayElement(agentUsers);
      
      await db.insert(contacts).values({
        type: faker.helpers.arrayElement(['Lead', 'Customer', 'Provider']),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: generatePhoneNumber(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
        notes: faker.lorem.sentences(2),
        status: faker.datatype.boolean(0.85) ? 'Active' : 'Inactive',
        assignedAgent: assignedAgent.id
      });

      if ((i + 1) % 100 === 0) {
        console.log(`Created ${i + 1} additional contacts`);
      }
    }

    console.log('Created 785 additional contacts');

    // Summary
    console.log('\n=== SEEDING COMPLETE ===');
    console.log('✓ 5 Admin users created with contacts');
    console.log('✓ 10 Agent users created with contacts');
    console.log('✓ 200 Member users created with contacts (all assigned to agents)');
    console.log('✓ 785 Additional contacts created');
    console.log('✓ Total: 215 users + 1000 contacts');
    console.log('✓ All members are associated with agents');
    console.log('✓ All users have corresponding contact records');

  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

// Run seeding if called directly
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
  seedUsers()
    .then(() => {
      console.log('Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}