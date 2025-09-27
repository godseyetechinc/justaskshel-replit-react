import { db } from './db';
import { claims, claimWorkflowSteps, claimCommunications, claimDocuments, users, policies } from '../shared/schema';
import { faker } from '@faker-js/faker';

// Enhanced claim type configurations with realistic data
const CLAIM_TYPES = {
  medical: {
    types: ['medical'],
    providers: [
      'Regional Medical Center', 'City General Hospital', 'Community Health Clinic',
      'Downtown Emergency Care', 'Family Practice Associates', 'Urgent Care Plus'
    ],
    priorities: { low: 0.3, normal: 0.5, high: 0.15, urgent: 0.05 },
    amountRange: { min: 150, max: 25000 },
    statuses: { 
      submitted: 0.2, under_review: 0.3, approved: 0.35, denied: 0.1, paid: 0.05 
    }
  },
  dental: {
    types: ['dental'],
    providers: [
      'Smile Dental Care', 'Perfect Teeth Dentistry', 'Family Dental Group',
      'Elite Oral Surgery', 'Bright Smile Orthodontics', 'Gentle Dental Center'
    ],
    priorities: { low: 0.6, normal: 0.3, high: 0.08, urgent: 0.02 },
    amountRange: { min: 75, max: 8000 },
    statuses: { 
      submitted: 0.25, under_review: 0.25, approved: 0.4, denied: 0.07, paid: 0.03 
    }
  },
  vision: {
    types: ['vision'],
    providers: [
      'ClearVision Eye Center', 'Premier Optical', 'Eye Care Specialists',
      'Vision Plus Clinic', 'Advanced Eye Institute', 'Family Eye Care'
    ],
    priorities: { low: 0.7, normal: 0.25, high: 0.04, urgent: 0.01 },
    amountRange: { min: 50, max: 3000 },
    statuses: { 
      submitted: 0.3, under_review: 0.2, approved: 0.45, denied: 0.04, paid: 0.01 
    }
  },
  life: {
    types: ['life'],
    providers: [
      'Memorial Hospital', 'City Coroner Office', 'Legal Services Group',
      'Estate Planning Associates', 'Probate Court Services', 'Documentation Center'
    ],
    priorities: { low: 0.1, normal: 0.3, high: 0.4, urgent: 0.2 },
    amountRange: { min: 50000, max: 500000 },
    statuses: { 
      submitted: 0.4, under_review: 0.35, approved: 0.15, denied: 0.08, paid: 0.02 
    }
  },
  disability: {
    types: ['disability'],
    providers: [
      'Rehabilitation Services', 'Occupational Health Center', 'Disability Assessment Clinic',
      'Workers Compensation Board', 'Medical Evaluation Services', 'Physical Therapy Plus'
    ],
    priorities: { low: 0.2, normal: 0.4, high: 0.3, urgent: 0.1 },
    amountRange: { min: 1000, max: 15000 },
    statuses: { 
      submitted: 0.35, under_review: 0.4, approved: 0.2, denied: 0.04, paid: 0.01 
    }
  }
};

// Generate realistic claim titles based on type
function generateClaimTitle(claimType: string): string {
  const titles = {
    medical: [
      'Emergency Room Visit', 'Surgical Procedure', 'Specialist Consultation',
      'Diagnostic Testing', 'Preventive Care', 'Accident Injury Treatment',
      'Chronic Condition Management', 'Prescription Coverage'
    ],
    dental: [
      'Routine Cleaning', 'Dental Filling', 'Root Canal Treatment',
      'Orthodontic Care', 'Tooth Extraction', 'Crown Replacement',
      'Emergency Dental Care', 'Periodontal Treatment'
    ],
    vision: [
      'Eye Exam', 'Contact Lenses', 'Prescription Glasses',
      'Retinal Screening', 'Cataract Surgery', 'Glaucoma Treatment',
      'Vision Therapy', 'Emergency Eye Care'
    ],
    life: [
      'Life Insurance Benefit Claim', 'Accidental Death Benefit',
      'Terminal Illness Benefit', 'Disability Waiver Claim'
    ],
    disability: [
      'Short-term Disability', 'Long-term Disability', 'Work Injury Claim',
      'Rehabilitation Services', 'Equipment Coverage', 'Vocational Training'
    ]
  };

  const typeArray = titles[claimType as keyof typeof titles] || titles.medical;
  return faker.helpers.arrayElement(typeArray);
}

// Generate realistic claim descriptions
function generateClaimDescription(claimType: string, title: string): string {
  const scenarios = {
    medical: [
      `Patient presented with acute symptoms requiring immediate medical attention. Treatment included diagnostic procedures and appropriate medical intervention.`,
      `Scheduled procedure performed by qualified medical professional. Post-operative care and follow-up appointments included.`,
      `Preventive care services as part of routine health maintenance program. Includes screening and consultation services.`
    ],
    dental: [
      `Routine dental maintenance and preventive care to maintain oral health. Treatment completed according to standard protocols.`,
      `Emergency dental intervention required due to acute dental condition. Treatment provided to alleviate pain and restore function.`,
      `Restorative dental work to repair and maintain dental health. Procedure completed with appropriate materials and techniques.`
    ],
    vision: [
      `Comprehensive eye examination including vision assessment and eye health evaluation. Recommendations provided for ongoing care.`,
      `Corrective vision services including prescription updates and fitting. Quality vision products provided for optimal vision correction.`,
      `Specialized eye care for specific condition requiring expert evaluation and treatment planning.`
    ],
    life: [
      `Life insurance benefit claim submitted with all required documentation. Claim processed according to policy terms and conditions.`,
      `Accidental death benefit claim with complete incident documentation and verification of coverage eligibility.`
    ],
    disability: [
      `Disability benefit claim for work-related condition affecting ability to perform job duties. Medical documentation provided.`,
      `Short-term disability coverage for temporary condition requiring time away from work for recovery and treatment.`
    ]
  };

  const typeArray = scenarios[claimType as keyof typeof scenarios] || scenarios.medical;
  return faker.helpers.arrayElement(typeArray);
}

// Generate phone number within varchar(20) limit
function generatePhoneNumber(): string {
  return faker.phone.number('###-###-####'); // Format: XXX-XXX-XXXX (12 chars)
}

// Generate policy number
function generatePolicyNumber(): string {
  return `POL-${faker.string.numeric(8)}`;
}

// Select status based on weighted distribution
function selectWeightedStatus(distribution: Record<string, number>): string {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [status, weight] of Object.entries(distribution)) {
    cumulative += weight;
    if (rand <= cumulative) {
      return status;
    }
  }
  
  return Object.keys(distribution)[0]; // fallback
}

// Select priority based on weighted distribution
function selectWeightedPriority(distribution: Record<string, number>): string {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [priority, weight] of Object.entries(distribution)) {
    cumulative += weight;
    if (rand <= cumulative) {
      return priority;
    }
  }
  
  return 'normal'; // fallback
}

export async function seedClaims() {
  try {
    console.log('Starting comprehensive claims seeding...');

    // Clear existing claims data
    await db.delete(claimDocuments);
    await db.delete(claimCommunications);
    await db.delete(claimWorkflowSteps);
    await db.delete(claims);
    console.log('Cleared existing claims data');

    // Get all users and policies for proper relationships
    const allUsers = await db.select().from(users);
    const allPolicies = await db.select().from(policies);
    const memberUsers = allUsers.filter(user => user.role === 'Member');
    const agentUsers = allUsers.filter(user => user.role === 'Agent');

    if (memberUsers.length === 0 || allPolicies.length === 0) {
      throw new Error('No member users or policies found. Please run user and policy seeding first.');
    }

    console.log(`Found ${memberUsers.length} members and ${allPolicies.length} policies for claims`);

    const createdClaims = [];
    
    // Create 150-200 comprehensive claims
    const numberOfClaims = faker.number.int({ min: 150, max: 200 });
    
    for (let i = 0; i < numberOfClaims; i++) {
      // Select random claim type
      const claimTypeKey = faker.helpers.arrayElement(Object.keys(CLAIM_TYPES));
      const claimConfig = CLAIM_TYPES[claimTypeKey as keyof typeof CLAIM_TYPES];
      
      // Select random member and their policy
      const member = faker.helpers.arrayElement(memberUsers);
      const memberPolicies = allPolicies.filter(policy => policy.userId === member.id);
      const policy = memberPolicies.length > 0 
        ? faker.helpers.arrayElement(memberPolicies)
        : faker.helpers.arrayElement(allPolicies);
      
      // Assign to random agent
      const assignedAgent = faker.helpers.arrayElement(agentUsers);
      
      // Generate claim data
      const claimTitle = generateClaimTitle(claimTypeKey);
      const claimDescription = generateClaimDescription(claimTypeKey, claimTitle);
      const status = selectWeightedStatus(claimConfig.statuses);
      const priority = selectWeightedPriority(claimConfig.priorities);
      const estimatedAmount = faker.number.float({
        min: claimConfig.amountRange.min,
        max: claimConfig.amountRange.max,
        precision: 0.01
      });
      
      // Generate dates based on status
      const submittedAt = faker.date.past({ years: 2 });
      const reviewedAt = ['under_review', 'approved', 'denied', 'paid'].includes(status)
        ? faker.date.between({ from: submittedAt, to: new Date() })
        : null;
      const processedAt = ['approved', 'denied', 'paid'].includes(status)
        ? faker.date.between({ from: reviewedAt || submittedAt, to: new Date() })
        : null;
      const paidAt = status === 'paid'
        ? faker.date.between({ from: processedAt || submittedAt, to: new Date() })
        : null;
      
      // Generate comprehensive claim data with ALL fields
      const claimData = {
        userId: member.id,
        policyId: policy.id,
        claimNumber: `CLM-${Date.now()}-${String(i).padStart(4, '0')}`,
        title: claimTitle,
        description: claimDescription,
        claimType: claimTypeKey,
        incidentDate: faker.date.between({ 
          from: new Date('2023-01-01'), 
          to: submittedAt 
        }),
        estimatedAmount: estimatedAmount.toString(),
        amount: status === 'paid' ? estimatedAmount.toString() : null,
        status,
        priority,
        assignedAgent: assignedAgent.id,
        
        // NEW COMPREHENSIVE FIELDS
        policyNumber: generatePolicyNumber(),
        providerName: faker.helpers.arrayElement(claimConfig.providers),
        providerAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state({ abbreviated: true })} ${faker.location.zipCode()}`,
        contactPhone: generatePhoneNumber(),
        emergencyContact: `${faker.person.firstName()} ${faker.person.lastName()}`,
        emergencyPhone: generatePhoneNumber(),
        additionalNotes: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
        
        submittedAt,
        reviewedAt,
        processedAt,
        paidAt
      };

      const [newClaim] = await db.insert(claims).values(claimData).returning();
      createdClaims.push(newClaim);

      // Initialize workflow for each claim
      if (newClaim.claimType) {
        await initializeEnhancedWorkflow(newClaim.id, newClaim.claimType, newClaim.status);
      }

      // Add some communications for a percentage of claims
      if (Math.random() < 0.6) { // 60% of claims have communications
        await addClaimCommunications(newClaim.id, member.id, assignedAgent.id);
      }

      if ((i + 1) % 25 === 0) {
        console.log(`Created ${i + 1} comprehensive claims with full data`);
      }
    }

    console.log(`\n=== COMPREHENSIVE CLAIMS SEEDING COMPLETE ===`);
    console.log(`✓ ${createdClaims.length} claims created with complete field data`);
    console.log(`✓ All claims have realistic provider information`);
    console.log(`✓ Contact and emergency contact details populated`);
    console.log(`✓ Policy numbers and additional notes included`);
    console.log(`✓ Proper status distribution and workflow initialization`);
    console.log(`✓ Realistic date progressions based on claim status`);

    return createdClaims;

  } catch (error) {
    console.error('Error seeding comprehensive claims:', error);
    throw error;
  }
}

// Enhanced workflow initialization with realistic status progression
async function initializeEnhancedWorkflow(claimId: number, claimType: string, claimStatus: string) {
  const workflowTemplates = {
    medical: [
      { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
      { stepName: "Medical Review", stepDescription: "Medical professional reviews claim details" },
      { stepName: "Verification", stepDescription: "Verify medical records and treatment" },
      { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
      { stepName: "Payment Processing", stepDescription: "Process approved claim payment" }
    ],
    dental: [
      { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
      { stepName: "Dental Review", stepDescription: "Dental professional reviews claim details" },
      { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
      { stepName: "Payment Processing", stepDescription: "Process approved claim payment" }
    ],
    vision: [
      { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
      { stepName: "Vision Review", stepDescription: "Vision care professional reviews claim details" },
      { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
      { stepName: "Payment Processing", stepDescription: "Process approved claim payment" }
    ],
    life: [
      { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
      { stepName: "Investigation", stepDescription: "Investigate claim circumstances" },
      { stepName: "Documentation Review", stepDescription: "Review all required documentation" },
      { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
      { stepName: "Payment Processing", stepDescription: "Process approved claim payment" }
    ],
    disability: [
      { stepName: "Initial Review", stepDescription: "Review claim submission and documentation" },
      { stepName: "Medical Evaluation", stepDescription: "Medical evaluation of disability claim" },
      { stepName: "Vocational Assessment", stepDescription: "Assess work capability and vocational factors" },
      { stepName: "Approval Decision", stepDescription: "Final approval or denial decision" },
      { stepName: "Payment Setup", stepDescription: "Setup ongoing disability payments" }
    ]
  };

  const template = workflowTemplates[claimType.toLowerCase() as keyof typeof workflowTemplates] || workflowTemplates.medical;
  
  // Determine how many steps to complete based on claim status
  let stepsToComplete = 0;
  switch (claimStatus) {
    case 'submitted':
      stepsToComplete = faker.number.int({ min: 0, max: 1 });
      break;
    case 'under_review':
      stepsToComplete = faker.number.int({ min: 1, max: 2 });
      break;
    case 'approved':
    case 'denied':
      stepsToComplete = template.length - 1; // All except payment
      break;
    case 'paid':
      stepsToComplete = template.length; // All steps
      break;
    default:
      stepsToComplete = 0;
  }

  for (const [index, stepTemplate] of template.entries()) {
    let stepStatus = 'pending';
    let completedAt = null;

    if (index < stepsToComplete) {
      stepStatus = 'completed';
      completedAt = faker.date.past({ years: 1 });
    } else if (index === stepsToComplete && claimStatus !== 'submitted') {
      stepStatus = 'in_progress';
    }

    await db.insert(claimWorkflowSteps).values({
      claimId,
      stepName: stepTemplate.stepName,
      stepDescription: stepTemplate.stepDescription,
      status: stepStatus,
      completedAt
    });
  }
}

// Add realistic claim communications
async function addClaimCommunications(claimId: number, memberId: string, agentId: string) {
  const communicationCount = faker.number.int({ min: 1, max: 4 });
  
  for (let i = 0; i < communicationCount; i++) {
    const isInternal = Math.random() < 0.3; // 30% internal notes
    const messageTypes = isInternal 
      ? ['note', 'system_update', 'status_change']
      : ['message'];
    
    const subjects = isInternal
      ? ['Claim Review Notes', 'Status Update', 'Documentation Received', 'Medical Review Complete']
      : ['Claim Status Inquiry', 'Additional Information Request', 'Documentation Submitted', 'Follow-up Question'];
    
    const messages = isInternal
      ? [
          'Initial review completed. All required documentation received.',
          'Medical review in progress. Awaiting specialist opinion.',
          'Claim approved for payment processing.',
          'Additional documentation required from provider.'
        ]
      : [
          'Thank you for submitting your claim. We have received all required documentation.',
          'We are currently reviewing your claim and will update you on the status.',
          'Your claim has been approved and payment will be processed within 5-7 business days.',
          'We may need additional information to process your claim.'
        ];

    await db.insert(claimCommunications).values({
      claimId,
      userId: isInternal ? agentId : memberId,
      messageType: faker.helpers.arrayElement(messageTypes),
      subject: faker.helpers.arrayElement(subjects),
      message: faker.helpers.arrayElement(messages),
      isInternal
    });
  }
}

// Run seeding if called directly
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
  seedClaims()
    .then(() => {
      console.log('Comprehensive claims seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Claims seeding failed:', error);
      process.exit(1);
    });
}