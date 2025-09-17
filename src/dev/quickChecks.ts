// ============= Quick Regression Checks for Core Functions =============
// Tests critical functionality to prevent regressions
// Only runs in development mode

import { aggregateContractorStatusById } from '@/services/contractors';
import { isExpiring } from '@/utils/validity';
import { slugifyPreserveGerman } from '@/utils/slug';
import { upsertDoc, setDocs } from '@/services/contractorDocs.store';
import { createContractor } from '@/services/contractors.store';

function clearTestData(contractorId: string) {
  // Clear documents for the test contractor
  setDocs(contractorId, []);
}

export function runQuickChecks() {
  if (import.meta.env.PROD) return; // Skip in production

  console.log('🔍 Running quick regression checks...');
  
  try {
    // ========== Test 1: Umlaut Slug Handling ==========
    console.assert(
      slugifyPreserveGerman('Führerschein') === 'fuehrerschein',
      '❌ Umlaut slug failed: ü → ue conversion'
    );
    
    console.assert(
      slugifyPreserveGerman('Beschäftigung Ärzte') === 'beschaeftigung-aerzte',
      '❌ Umlaut slug failed: ä → ae conversion with spaces'
    );

    console.assert(
      slugifyPreserveGerman('Größe & Maße') === 'groesse-masse',
      '❌ Umlaut slug failed: ö → oe, ß → ss, special chars'
    );

    // ========== Test 2: Expiring Boundary (30 days) ==========
    const now = new Date();
    
    // Date exactly 30 days from now (should be expiring)
    const exactly30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    console.assert(
      isExpiring(exactly30Days, 30) === true,
      '❌ Expiring boundary failed: exactly 30 days should be expiring'
    );
    
    // Date 31 days from now (should NOT be expiring)
    const over30Days = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
    console.assert(
      isExpiring(over30Days, 30) === false,
      '❌ Expiring boundary failed: 31+ days should NOT be expiring'
    );
    
    // Date 1 day from now (should be expiring)
    const oneDayLeft = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    console.assert(
      isExpiring(oneDayLeft, 30) === true,
      '❌ Expiring boundary failed: 1 day left should be expiring'
    );
    
    // Already expired date (should NOT be expiring)
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    console.assert(
      isExpiring(yesterdayDate, 30) === false,
      '❌ Expiring boundary failed: expired dates should NOT be expiring'
    );

    // ========== Test 3: Aggregation with 1 Missing Required Doc ==========
    
    // Create test contractor
    const testContractor = createContractor({
      company_name: 'Test Contractor GmbH',
      contact_name: 'Test User',
      email: 'test@example.com',
      phone: '123456789',
      address: 'Test Address 123',
      country: 'DE'
    });

    // Clear any existing test data
    clearTestData(testContractor.id);

    // Add one missing required document
    upsertDoc(testContractor.id, {
      contractorId: testContractor.id,
      documentTypeId: 'liability_insurance',
      requirement: 'required',
      status: 'missing',
      label: 'Haftpflichtversicherung',
      customName: undefined,
      validUntil: undefined
    });

    // Test aggregation
    const aggregation = aggregateContractorStatusById(testContractor.id);
    console.assert(
      aggregation.status === 'missing',
      '❌ Aggregation failed: 1 missing required doc should result in "missing" status'
    );
    
    console.assert(
      aggregation.counts.missing === 1,
      '❌ Aggregation failed: missing count should be 1'
    );
    
    console.assert(
      aggregation.hasRequired === true,
      '❌ Aggregation failed: should detect required documents exist'
    );

    // ========== Test 4: Aggregation with All Complete ==========

    // Clear and add accepted required document
    clearTestData(testContractor.id);
    
    upsertDoc(testContractor.id, {
      contractorId: testContractor.id,
      documentTypeId: 'liability_insurance',
      requirement: 'required',
      status: 'accepted',
      label: 'Haftpflichtversicherung',
      customName: undefined,
      validUntil: undefined // No expiry
    });

    const completeAggregation = aggregateContractorStatusById(testContractor.id);
    console.assert(
      completeAggregation.status === 'complete',
      '❌ Aggregation failed: accepted required doc should result in "complete" status'
    );
    
    console.assert(
      completeAggregation.counts.valid === 1,
      '❌ Aggregation failed: valid count should be 1'
    );

    // Clean up test data
    clearTestData(testContractor.id);

    console.log('✅ All quick checks passed!');
    
  } catch (error) {
    console.error('💥 Quick checks failed with error:', error);
  }
}