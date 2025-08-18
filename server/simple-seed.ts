import { db } from './db';
import { users, contacts } from '../shared/schema';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function simpleSeed() {
  try {
    console.log('Starting simplified user seeding...');
    
    const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);

    // Clear existing data
    await db.delete(contacts);
    await db.delete(users);
    console.log('Cleared existing users and contacts');

    // Create 5 admins
    const adminUsers = [];
    for (let i = 0; i < 5; i++) {
      const [admin] = await db.insert(users).values({
        email: `admin${i + 1}@justaskshel.com`,
        firstName: `Admin`,
        lastName: `User${i + 1}`,
        password: passwordHash,
        role: 'Admin' as const,
        privilegeLevel: 1,
        isActive: true,
        phone: `555-000-${String(i + 1).padStart(4, '0')}`,
        address: `${100 + i} Admin Street`,
        city: 'AdminCity',
        state: 'CA',
        zipCode: `9000${i}`
      }).returning();
      
      adminUsers.push(admin);
      
      // Create contact for admin
      await db.insert(contacts).values({
        type: 'Agent',
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        address: admin.address,
        city: admin.city,
        state: admin.state,
        zipCode: admin.zipCode,
        notes: `Admin contact for ${admin.firstName} ${admin.lastName}`,
        status: 'Active',
        assignedAgent: admin.id
      });
    }
    console.log('Created 5 admin users with contacts');

    // Create 10 agents
    const agentUsers = [];
    for (let i = 0; i < 10; i++) {
      const [agent] = await db.insert(users).values({
        email: `agent${i + 1}@justaskshel.com`,
        firstName: `Agent`,
        lastName: `User${i + 1}`,
        password: passwordHash,
        role: 'Agent' as const,
        privilegeLevel: 2,
        isActive: true,
        phone: `555-001-${String(i + 1).padStart(4, '0')}`,
        address: `${200 + i} Agent Street`,
        city: 'AgentCity',
        state: 'NY',
        zipCode: `1000${i}`
      }).returning();
      
      agentUsers.push(agent);
      
      // Create contact for agent
      await db.insert(contacts).values({
        type: 'Agent',
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        phone: agent.phone,
        address: agent.address,
        city: agent.city,
        state: agent.state,
        zipCode: agent.zipCode,
        notes: `Agent contact for ${agent.firstName} ${agent.lastName}`,
        status: 'Active',
        assignedAgent: agent.id
      });
    }
    console.log('Created 10 agent users with contacts');

    // Create 200 members (20 per agent)
    for (let i = 0; i < 200; i++) {
      const agentIndex = Math.floor(i / 20); // 20 members per agent
      const assignedAgent = agentUsers[agentIndex];
      
      const [member] = await db.insert(users).values({
        email: `member${i + 1}@example.com`,
        firstName: `Member`,
        lastName: `User${i + 1}`,
        password: passwordHash,
        role: 'Member' as const,
        privilegeLevel: 3,
        isActive: true,
        phone: `555-002-${String(i + 1).padStart(4, '0')}`,
        address: `${300 + i} Member Street`,
        city: 'MemberCity',
        state: 'TX',
        zipCode: `7${String(i).padStart(4, '0')}`
      }).returning();
      
      // Create contact for member
      await db.insert(contacts).values({
        type: 'Customer',
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        address: member.address,
        city: member.city,
        state: member.state,
        zipCode: member.zipCode,
        notes: `Member contact for ${member.firstName} ${member.lastName}. Agent: ${assignedAgent.firstName} ${assignedAgent.lastName}`,
        status: 'Active',
        assignedAgent: assignedAgent.id
      });

      if ((i + 1) % 50 === 0) {
        console.log(`Created ${i + 1} member users with contacts`);
      }
    }

    // Create 785 additional contacts
    for (let i = 0; i < 785; i++) {
      const agentIndex = i % 10; // Distribute across agents
      const assignedAgent = agentUsers[agentIndex];
      const contactTypes = ['Lead', 'Customer', 'Provider'];
      
      await db.insert(contacts).values({
        type: contactTypes[i % 3] as any,
        firstName: `Contact`,
        lastName: `Person${i + 1}`,
        email: `contact${i + 1}@example.com`,
        phone: `555-003-${String(i + 1).padStart(4, '0')}`,
        address: `${400 + i} Contact Street`,
        city: 'ContactCity',
        state: 'FL',
        zipCode: `3${String(i).padStart(4, '0')}`,
        notes: `General contact record #${i + 1}`,
        status: i % 5 === 0 ? 'Inactive' : 'Active', // 20% inactive
        assignedAgent: assignedAgent.id
      });

      if ((i + 1) % 100 === 0) {
        console.log(`Created ${i + 1} additional contacts`);
      }
    }

    console.log('\n=== SEEDING COMPLETE ===');
    console.log('✓ 5 Admin users created with contacts');
    console.log('✓ 10 Agent users created with contacts');
    console.log('✓ 200 Member users created with contacts (20 per agent)');
    console.log('✓ 785 Additional contacts created');
    console.log('✓ Total: 215 users + 1000 contacts');
    console.log('✓ All members are evenly distributed among agents');
    console.log('✓ All users have corresponding contact records');

  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}