import { DatabaseStorage } from "./storage";
import { users, agentOrganizations, persons, personUsers } from "../shared/schema";
import { eq, isNull, and, sql } from "drizzle-orm";
import { db } from "./db";

export class DataIntegrityService {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  /**
   * Comprehensive data integrity check and repair for multi-tenant system
   */
  async runIntegrityCheck(): Promise<{
    issues: Array<{
      type: string;
      count: number;
      description: string;
      fixed?: boolean;
    }>;
    summary: {
      totalUsersChecked: number;
      issuesFound: number;
      issuesFixed: number;
    };
  }> {
    console.log("Starting data integrity check...");
    
    const issues: Array<{
      type: string;
      count: number;
      description: string;
      fixed?: boolean;
    }> = [];

    // 1. Check for users without organization assignments
    const orphanedUsers = await this.findOrphanedUsers();
    if (orphanedUsers.length > 0) {
      issues.push({
        type: "orphaned_users",
        count: orphanedUsers.length,
        description: `Users without valid organization assignments (roles: Agent, TenantAdmin, Member)`
      });
    }

    // 2. Check for users with invalid organization references
    const invalidOrgUsers = await this.findUsersWithInvalidOrganizations();
    if (invalidOrgUsers.length > 0) {
      issues.push({
        type: "invalid_org_refs",
        count: invalidOrgUsers.length,
        description: `Users referencing non-existent organizations`
      });
    }

    // 3. Check for missing person entities
    const usersWithoutPersons = await this.findUsersWithoutPersons();
    if (usersWithoutPersons.length > 0) {
      issues.push({
        type: "missing_persons",
        count: usersWithoutPersons.length,
        description: `Users without corresponding person records`
      });
    }

    // 4. Check for role-organization mismatches
    const roleMismatches = await this.findRoleOrganizationMismatches();
    if (roleMismatches.length > 0) {
      issues.push({
        type: "role_mismatches",
        count: roleMismatches.length,
        description: `Users with roles requiring organization but missing assignment`
      });
    }

    const totalUsers = await this.getTotalUserCount();
    
    console.log(`Data integrity check complete. Found ${issues.length} issue types affecting users.`);
    
    return {
      issues,
      summary: {
        totalUsersChecked: totalUsers,
        issuesFound: issues.reduce((sum, issue) => sum + issue.count, 0),
        issuesFixed: 0 // Will be updated after fixes
      }
    };
  }

  /**
   * Fix identified data integrity issues
   */
  async fixIntegrityIssues(): Promise<{
    fixedIssues: Array<{
      type: string;
      count: number;
      description: string;
      actions: string[];
    }>;
    summary: {
      totalFixed: number;
      errors: string[];
    };
  }> {
    console.log("Starting data integrity fixes...");
    
    const fixedIssues: Array<{
      type: string;
      count: number;
      description: string;
      actions: string[];
    }> = [];
    const errors: string[] = [];

    try {
      // 1. Fix orphaned users by creating default organization or reassigning
      const orphanedFixed = await this.fixOrphanedUsers();
      if (orphanedFixed.count > 0) {
        fixedIssues.push(orphanedFixed);
      }

      // 2. Fix users with invalid organization references
      const invalidOrgFixed = await this.fixInvalidOrganizationReferences();
      if (invalidOrgFixed.count > 0) {
        fixedIssues.push(invalidOrgFixed);
      }

      // 3. Create missing person entities
      const missingPersonsFixed = await this.createMissingPersons();
      if (missingPersonsFixed.count > 0) {
        fixedIssues.push(missingPersonsFixed);
      }

      // 4. Fix role-organization mismatches
      const roleMismatchesFixed = await this.fixRoleOrganizationMismatches();
      if (roleMismatchesFixed.count > 0) {
        fixedIssues.push(roleMismatchesFixed);
      }

    } catch (error) {
      console.error("Error during integrity fixes:", error);
      errors.push(`Fix operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const totalFixed = fixedIssues.reduce((sum, issue) => sum + issue.count, 0);
    
    console.log(`Data integrity fixes complete. Fixed ${totalFixed} issues.`);
    
    return {
      fixedIssues,
      summary: {
        totalFixed,
        errors
      }
    };
  }

  // ===== DETECTION METHODS =====

  private async findOrphanedUsers(): Promise<any[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          isNull(users.organizationId),
          sql`${users.role} IN ('Agent', 'TenantAdmin', 'Member')`
        )
      );
  }

  private async findUsersWithInvalidOrganizations(): Promise<any[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        organizationId: users.organizationId
      })
      .from(users)
      .leftJoin(agentOrganizations, eq(users.organizationId, agentOrganizations.id))
      .where(
        and(
          sql`${users.organizationId} IS NOT NULL`,
          sql`${agentOrganizations.id} IS NULL`
        )
      );
    
    return result;
  }

  private async findUsersWithoutPersons(): Promise<any[]> {
    // Find users with null personId (never assigned) OR invalid personId (pointing to non-existent person)
    const usersWithNullPersonId = await db
      .select({
        id: users.id,
        email: users.email,
        personId: users.personId,
        issue: sql<string>`'null_person_id'`
      })
      .from(users)
      .where(isNull(users.personId));
    
    const usersWithInvalidPersonId = await db
      .select({
        id: users.id,
        email: users.email,
        personId: users.personId,
        issue: sql<string>`'invalid_person_id'`
      })
      .from(users)
      .leftJoin(persons, eq(users.personId, persons.id))
      .where(
        and(
          sql`${users.personId} IS NOT NULL`,
          sql`${persons.id} IS NULL`
        )
      );
    
    return [...usersWithNullPersonId, ...usersWithInvalidPersonId];
  }

  private async findRoleOrganizationMismatches(): Promise<any[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.role} IN ('Agent', 'TenantAdmin', 'Member')`,
          isNull(users.organizationId)
        )
      );
  }

  private async getTotalUserCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    return result[0]?.count || 0;
  }

  // ===== FIX METHODS =====

  private async fixOrphanedUsers(): Promise<{
    type: string;
    count: number;
    description: string;
    actions: string[];
  }> {
    const orphanedUsers = await this.findOrphanedUsers();
    const actions: string[] = [];
    let fixedCount = 0;

    if (orphanedUsers.length === 0) {
      return {
        type: "orphaned_users",
        count: 0,
        description: "No orphaned users found",
        actions: []
      };
    }

    // Create a default organization for orphaned users
    const defaultOrg = await this.findOrCreateDefaultOrganization();
    actions.push(`Found/created default organization: ${defaultOrg.name}`);

    for (const user of orphanedUsers) {
      try {
        await this.storage.updateUserProfile(user.id, {
          organizationId: defaultOrg.id,
          // Adjust role and privilege level based on current role
          privilegeLevel: this.getRolePrivilegeLevel(user.role)
        });
        
        fixedCount++;
        actions.push(`Assigned user ${user.email} to default organization`);
      } catch (error) {
        console.error(`Failed to fix orphaned user ${user.id}:`, error);
        actions.push(`Failed to fix user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      type: "orphaned_users",
      count: fixedCount,
      description: `Fixed users without organization assignments`,
      actions
    };
  }

  private async fixInvalidOrganizationReferences(): Promise<{
    type: string;
    count: number;
    description: string;
    actions: string[];
  }> {
    const invalidUsers = await this.findUsersWithInvalidOrganizations();
    const actions: string[] = [];
    let fixedCount = 0;

    if (invalidUsers.length === 0) {
      return {
        type: "invalid_org_refs",
        count: 0,
        description: "No invalid organization references found",
        actions: []
      };
    }

    const defaultOrg = await this.findOrCreateDefaultOrganization();

    for (const user of invalidUsers) {
      try {
        await this.storage.updateUserProfile(user.id, {
          organizationId: defaultOrg.id
        });
        
        fixedCount++;
        actions.push(`Fixed invalid org reference for user ${user.email}`);
      } catch (error) {
        console.error(`Failed to fix invalid org reference for user ${user.id}:`, error);
        actions.push(`Failed to fix user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      type: "invalid_org_refs",
      count: fixedCount,
      description: `Fixed users with invalid organization references`,
      actions
    };
  }

  private async createMissingPersons(): Promise<{
    type: string;
    count: number;
    description: string;
    actions: string[];
  }> {
    const actions: string[] = [];
    let totalFixed = 0;
    
    try {
      // Get initial count of users without persons
      const initialUsersWithoutPersons = await this.findUsersWithoutPersons();
      const initialCount = initialUsersWithoutPersons.length;
      
      if (initialCount === 0) {
        return {
          type: "missing_persons",
          count: 0,
          description: "All users already have person records",
          actions: ["No missing person records found"]
        };
      }
      
      actions.push(`Found ${initialCount} users without person records`);
      
      // Run the existing person migration to create persons for users
      const migrationResult = await this.storage.migrateDataToPersons();
      actions.push("Ran person migration to create missing person entities");
      
      // Re-check for remaining users without persons
      const remainingUsersWithoutPersons = await this.findUsersWithoutPersons();
      const remainingCount = remainingUsersWithoutPersons.length;
      
      totalFixed = initialCount - remainingCount;
      
      if (remainingCount > 0) {
        actions.push(`WARNING: ${remainingCount} users still without person records after migration`);
        remainingUsersWithoutPersons.forEach(user => {
          actions.push(`  - User ${user.email} (ID: ${user.id}) - Issue: ${user.issue || 'unknown'}`);
        });
      } else {
        actions.push("✅ All users now have valid person records");
      }
      
      return {
        type: "missing_persons",
        count: totalFixed,
        description: `Created person records for ${totalFixed} users`,
        actions
      };
    } catch (error) {
      console.error("Failed to create missing persons:", error);
      return {
        type: "missing_persons",
        count: 0,
        description: `Failed to create missing person records`,
        actions: [...actions, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private async fixRoleOrganizationMismatches(): Promise<{
    type: string;
    count: number;
    description: string;
    actions: string[];
  }> {
    // This is essentially the same as orphaned users fix
    return await this.fixOrphanedUsers();
  }

  // ===== HELPER METHODS =====

  private async findOrCreateDefaultOrganization(): Promise<any> {
    // Try to find an existing default organization
    const existingOrgs = await this.storage.getOrganizations();
    let defaultOrg = existingOrgs.find(org => 
      org.name.toLowerCase().includes('default') || 
      org.name.toLowerCase().includes('general')
    );

    if (!defaultOrg) {
      // Create a default organization
      defaultOrg = await this.storage.createOrganization({
        name: "Default Organization",
        displayName: "Default Organization",
        description: "Default organization for users migrated during data integrity fixes",
        status: "Active",
        subscriptionPlan: "Basic",
        subscriptionStatus: "Active",
        maxAgents: 5,
        maxMembers: 100,
        primaryColor: "#0EA5E9",
        secondaryColor: "#64748B",
      });
      
      console.log("Created default organization for orphaned users");
    }

    return defaultOrg;
  }

  private getRolePrivilegeLevel(role: string): number {
    switch (role) {
      case "SuperAdmin": return 0;
      case "TenantAdmin": return 1;
      case "Agent": return 2;
      case "Member": return 3;
      case "Guest": return 4;
      case "Visitor": return 5;
      default: return 4; // Default to Guest level
    }
  }

  /**
   * Generate a comprehensive integrity report
   */
  async generateIntegrityReport(): Promise<string> {
    const checkResult = await this.runIntegrityCheck();
    
    let report = "=== DATA INTEGRITY REPORT ===\n\n";
    report += `Total Users Checked: ${checkResult.summary.totalUsersChecked}\n`;
    report += `Issues Found: ${checkResult.summary.issuesFound}\n\n`;
    
    if (checkResult.issues.length === 0) {
      report += "✅ No data integrity issues found!\n";
    } else {
      report += "Issues Detected:\n";
      checkResult.issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.type.toUpperCase()}: ${issue.count} users\n`;
        report += `   Description: ${issue.description}\n\n`;
      });
      
      report += "\nRecommendation: Run fixIntegrityIssues() to resolve these issues.\n";
    }
    
    return report;
  }
}