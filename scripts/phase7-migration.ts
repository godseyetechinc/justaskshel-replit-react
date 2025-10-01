/**
 * Phase 7: Data Migration & Backfill Script
 * 
 * This script backfills agent assignments for existing policies that were created
 * before the agent-policy relationship enhancement (Phases 1-6).
 * 
 * Strategy:
 * 1. Find all policies without agent assignments
 * 2. Determine policy owner's organization
 * 3. Assign an available agent from that organization (round-robin)
 * 4. Create commission records for backfilled policies
 */

import { db } from "../server/db";
import { policies, users, agentCommissions } from "../shared/schema";
import { eq, isNull, and, sql } from "drizzle-orm";

interface AgentAssignment {
  policyId: number;
  policyOwnerId: string;
  ownerOrganizationId: number | null;
  sellingAgentId: string;
  servicingAgentId: string;
  organizationId: number;
}

async function getAgentsByOrganization(organizationId: number | null): Promise<any[]> {
  const orgId = organizationId || 1; // Default to organization 1 if no org
  
  const agents = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.role, 'Agent'),
        eq(users.organizationId, orgId)
      )
    )
    .orderBy(users.id);
  
  return agents;
}

async function getOwnerOrganization(userId: string): Promise<number | null> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user[0]?.organizationId || null;
}

async function backfillPolicyAgents() {
  console.log("Starting Phase 7: Policy Agent Assignment Backfill...\n");

  // Get all policies without agent assignments
  const unassignedPolicies = await db
    .select()
    .from(policies)
    .where(isNull(policies.sellingAgentId))
    .orderBy(policies.id);

  console.log(`Found ${unassignedPolicies.length} policies without agent assignments\n`);

  if (unassignedPolicies.length === 0) {
    console.log("✅ All policies already have agent assignments!");
    return;
  }

  const assignments: AgentAssignment[] = [];
  const agentCache: { [orgId: number]: any[] } = {};
  let agentIndexByOrg: { [orgId: number]: number } = {};

  // Process each policy
  for (const policy of unassignedPolicies) {
    const ownerOrgId = await getOwnerOrganization(policy.userId);
    const orgId = ownerOrgId || 1;

    // Get agents for this organization (with caching)
    if (!agentCache[orgId]) {
      agentCache[orgId] = await getAgentsByOrganization(orgId);
      agentIndexByOrg[orgId] = 0;
    }

    const orgAgents = agentCache[orgId];
    
    if (orgAgents.length === 0) {
      console.warn(`⚠️  No agents found for organization ${orgId}, skipping policy ${policy.id}`);
      continue;
    }

    // Round-robin assignment
    const agentIndex = agentIndexByOrg[orgId] % orgAgents.length;
    const selectedAgent = orgAgents[agentIndex];
    agentIndexByOrg[orgId]++;

    assignments.push({
      policyId: policy.id,
      policyOwnerId: policy.userId,
      ownerOrganizationId: ownerOrgId,
      sellingAgentId: selectedAgent.id,
      servicingAgentId: selectedAgent.id, // Initially same as selling agent
      organizationId: orgId,
    });
  }

  console.log(`Prepared ${assignments.length} policy agent assignments\n`);

  // Execute assignments in batches
  const BATCH_SIZE = 50;
  let updated = 0;

  for (let i = 0; i < assignments.length; i += BATCH_SIZE) {
    const batch = assignments.slice(i, i + BATCH_SIZE);
    
    for (const assignment of batch) {
      await db
        .update(policies)
        .set({
          sellingAgentId: assignment.sellingAgentId,
          servicingAgentId: assignment.servicingAgentId,
          organizationId: assignment.organizationId,
          agentAssignedAt: new Date(),
          policySource: 'backfill_migration',
          referralSource: 'Phase 7 Data Migration',
        })
        .where(eq(policies.id, assignment.policyId));
      
      updated++;
    }

    console.log(`✅ Updated ${updated}/${assignments.length} policies...`);
  }

  console.log(`\n✅ Successfully backfilled ${updated} policy agent assignments!`);
  
  return assignments;
}

async function backfillCommissions(assignments: AgentAssignment[]) {
  console.log("\nStarting commission backfill for migrated policies...\n");

  const DEFAULT_COMMISSION_RATE = 10.0; // 10% default rate
  const DEFAULT_BASE_AMOUNT = 1000.0; // Default annual premium estimate

  let created = 0;

  for (const assignment of assignments) {
    const policy = await db
      .select()
      .from(policies)
      .where(eq(policies.id, assignment.policyId))
      .limit(1);

    if (!policy[0]) continue;

    // Check if commission already exists
    const existing = await db
      .select()
      .from(agentCommissions)
      .where(
        and(
          eq(agentCommissions.policyId, assignment.policyId),
          eq(agentCommissions.agentId, assignment.sellingAgentId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Commission already exists for policy ${assignment.policyId}, skipping...`);
      continue;
    }

    const commissionAmount = (DEFAULT_BASE_AMOUNT * DEFAULT_COMMISSION_RATE) / 100;

    await db.insert(agentCommissions).values({
      agentId: assignment.sellingAgentId,
      policyId: assignment.policyId,
      organizationId: assignment.organizationId,
      commissionType: 'initial_sale',
      commissionRate: DEFAULT_COMMISSION_RATE,
      baseAmount: DEFAULT_BASE_AMOUNT,
      commissionAmount: commissionAmount,
      paymentStatus: 'pending',
      notes: 'Backfilled during Phase 7 migration',
    });

    created++;
  }

  console.log(`\n✅ Successfully created ${created} commission records!`);
}

async function generateMigrationReport() {
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 7 MIGRATION REPORT");
  console.log("=".repeat(60) + "\n");

  // Policy statistics
  const totalPolicies = await db
    .select({ count: sql<number>`count(*)` })
    .from(policies);

  const policiesWithAgents = await db
    .select({ count: sql<number>`count(*)` })
    .from(policies)
    .where(isNull(policies.sellingAgentId).not());

  const policiesByOrg = await db
    .select({
      organizationId: policies.organizationId,
      count: sql<number>`count(*)`
    })
    .from(policies)
    .where(isNull(policies.organizationId).not())
    .groupBy(policies.organizationId);

  console.log("📊 POLICY STATISTICS:");
  console.log(`  Total Policies: ${totalPolicies[0].count}`);
  console.log(`  Policies with Agent Assignments: ${policiesWithAgents[0].count}`);
  console.log(`  Migration Coverage: ${((policiesWithAgents[0].count / totalPolicies[0].count) * 100).toFixed(1)}%\n`);

  console.log("📊 POLICIES BY ORGANIZATION:");
  for (const org of policiesByOrg) {
    console.log(`  Organization ${org.organizationId}: ${org.count} policies`);
  }

  // Commission statistics
  const totalCommissions = await db
    .select({ count: sql<number>`count(*)` })
    .from(agentCommissions);

  const commissionsByStatus = await db
    .select({
      status: agentCommissions.paymentStatus,
      count: sql<number>`count(*)`
    })
    .from(agentCommissions)
    .groupBy(agentCommissions.paymentStatus);

  console.log("\n📊 COMMISSION STATISTICS:");
  console.log(`  Total Commissions: ${totalCommissions[0].count}`);
  for (const status of commissionsByStatus) {
    console.log(`  ${status.status}: ${status.count}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Phase 7 Migration Complete!");
  console.log("=".repeat(60) + "\n");
}

// Main execution
async function main() {
  try {
    const assignments = await backfillPolicyAgents();
    
    if (assignments && assignments.length > 0) {
      await backfillCommissions(assignments);
    }
    
    await generateMigrationReport();
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
