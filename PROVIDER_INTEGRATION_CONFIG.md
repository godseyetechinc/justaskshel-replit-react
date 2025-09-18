# Provider Integration Configuration Guide - Phase 1

## Overview

This guide explains how to configure and use the Phase 1: Core Multi-Tenant Integration features for ProviderApiClient integration in JustAskShel. Phase 1 provides foundational multi-tenant provider integration with basic real-time updates.

**Important**: This is Phase 1 implementation - many advanced features are planned for future phases.

## Architecture Components

### 1. Provider Orchestrator Service (`server/providerOrchestrator.ts`)

Foundation service for multiple insurance provider integrations with:
- **Multi-tenant provider selection** (basic implementation with organization context)
- **Basic error handling** with timeout management
- **Organization-specific caching** with cache key structure
- **Concurrent provider calls** for quote aggregation

### 2. WebSocket Server (`server/websocketServer.ts`)

Basic real-time communication infrastructure:
- **WebSocket connection setup** on `/ws/quotes` endpoint
- **Basic message broadcasting** for quote completion
- **Connection management** with client identification
- **Foundation for real-time updates** (basic implementation)

### 3. Enhanced Provider Configuration (`server/insuranceProviderConfig.ts`)

Extended provider configuration structure:
- **Organization override scaffolding** for future customization
- **Provider configuration templates** with mock mode support
- **API endpoint and authentication setup**
- **Coverage type mapping** for provider APIs

## Configuration Steps

### 1. Environment Variables

Configure these environment variables for provider integration:

```bash
# Core Database
DATABASE_URL=postgresql://username:password@host:port/database

# Provider API Keys (optional - enables live providers)
LIFESECURE_API_KEY=your_lifesecure_api_key
LIFESECURE_API_URL=https://api.lifesecure.com/v1
HEALTHPLUS_API_KEY=your_healthplus_api_key
HEALTHPLUS_API_URL=https://api.healthplus.com/quotes
DENTALCARE_API_KEY=your_dentalcare_api_key
DENTALCARE_API_URL=https://api.dentalcare.com/v2
VISIONFIRST_API_KEY=your_visionfirst_api_key
VISIONFIRST_API_URL=https://api.visionfirst.com/v1
FAMILYSHIELD_API_KEY=your_familyshield_api_key
FAMILYSHIELD_API_URL=https://api.familyshield.com/api

# Session Configuration
SESSION_SECRET=your_secure_session_secret
```

**Note**: If API keys are not provided, providers will run in mock mode with simulated quotes.

### 2. Provider Configuration

Providers are configured in `server/insuranceProviderConfig.ts`. Each provider includes:

```typescript
{
  id: "provider_id",
  name: "provider_name", 
  displayName: "Provider Display Name",
  baseUrl: process.env.PROVIDER_API_URL || "fallback_url",
  apiKey: process.env.PROVIDER_API_KEY,
  authHeader: "X-API-Key", // or "Authorization"
  rateLimit: {
    requestsPerSecond: 10,
    burstLimit: 50
  },
  timeout: 8000, // milliseconds
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  },
  supportedCoverageTypes: ["life", "health", "dental"],
  isActive: true,
  priority: 1, // Lower = higher priority
  mockMode: !process.env.PROVIDER_API_KEY // Auto-enable mock mode
}
```

### 3. Organization-Specific Provider Settings

SuperAdmin users can configure organization-specific provider settings:

1. **Access Provider Management**: Dashboard → Provider Management (SuperAdmin only)
2. **Configure Organization Overrides**: Set custom priorities, commission rates, and timeouts
3. **Enable/Disable Providers**: Control which providers are available per organization
4. **Monitor Performance**: View basic provider status and response logs

## Usage Guide

### 1. Quote Search API

The enhanced quote search endpoint supports multi-tenant provider aggregation and is **publicly accessible without authentication**:

#### Authentication Requirements
- **No Authentication Required**: The `/api/quotes/search` endpoint can be accessed by anyone without logging in
- **Enhanced Experience for Authenticated Users**: Logged-in users receive:
  - Organization-specific provider configurations
  - Customized provider priorities and commission rates  
  - Multi-tenant aware quote processing
- **Anonymous Access**: Unauthenticated users get standard quote results from all active providers

```javascript
// Frontend usage
const response = await fetch('/api/quotes/search?' + new URLSearchParams({
  typeId: '1', // Coverage type ID
  ageRange: '25-35',
  zipCode: '10001',
  coverageAmount: '250000',
  includeExternal: 'true' // Enable provider aggregation
}));

const result = await response.json();
console.log(result);
// Returns:
// {
//   quotes: [...], // Combined internal + external quotes
//   providers: { total: 5, successful: 4, failed: 1, errors: [...] },
//   requestId: "req_1694...",
//   source: "live", // or "cached"
//   organizationId: 1,
//   cached: false
// }
```

### 2. Real-Time WebSocket Integration

Use the provided React hook for real-time quote updates:

```javascript
import { useQuoteWebSocket } from '@/hooks/useQuoteWebSocket';

function QuoteSearchComponent() {
  const { 
    isConnected, 
    quotes, 
    progress, 
    subscribeToQuoteRequest 
  } = useQuoteWebSocket();

  const handleSearch = async () => {
    const response = await fetch('/api/quotes/search?...');
    const result = await response.json();
    
    // Subscribe to real-time updates
    if (result.requestId) {
      subscribeToQuoteRequest(result.requestId);
    }
  };

  return (
    <div>
      <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {progress && (
        <div>Progress: {progress.providersCompleted}/{progress.providersTotal}</div>
      )}
      <div>Live Quotes: {quotes.length}</div>
    </div>
  );
}
```

### 3. Organization-Specific Configuration (SuperAdmin Only)

For SuperAdmin users, provider configurations can be managed across all organizations:

```javascript
// Provider selection considers organization context
const result = await providerOrchestrator.getQuotesForOrganization(
  quoteRequest,
  organizationId, // Auto-detected from user session
  userRole
);
```

## Current Monitoring Capabilities (Phase 1)

### 1. Basic Provider Status

Current monitoring includes:
- **Provider Configuration Status**: View which providers are configured and active
- **Mock Mode Detection**: See which providers are running in mock vs. live mode
- **Basic Response Logging**: Server-side logging of provider responses

### 2. Planned for Future Phases

Advanced monitoring features planned for Phase 2+:
- **Provider Health Dashboard** with real-time health scores
- **Circuit Breaker Status** monitoring with automatic failover
- **Performance Metrics** with response time and success rate tracking
- **SLA Compliance** monitoring and alerting

## Troubleshooting

### Common Issues

1. **Provider in Mock Mode**
   - **Cause**: Missing API key environment variable
   - **Solution**: Add `PROVIDER_API_KEY` to environment variables

2. **WebSocket Connection Failed**
   - **Cause**: Network or authentication issues
   - **Solution**: Check browser console for detailed error messages

3. **No External Quotes**
   - **Cause**: Providers disabled, missing API keys, or request timeouts
   - **Solution**: Check provider configuration, ensure API keys are set, verify network connectivity

4. **Organization Access Issues**
   - **Cause**: User not assigned to organization or role permissions
   - **Solution**: Verify user organization assignment and role privileges

### Debug Information

Enable detailed logging by setting environment variables:
```bash
DEBUG=provider:* # Provider-specific debugging
NODE_ENV=development # Detailed error messages
```

## Security Considerations

1. **API Key Management**: Store provider API keys securely in environment variables
2. **Organization Context**: Basic organization-scoped operations (Phase 1 implementation)
3. **WebSocket Connection**: Basic WebSocket setup with requestId-scoped messaging (no PII transmitted; authentication enhancement planned for Phase 2)
4. **Mock Mode Security**: Automatic fallback to mock data when live APIs unavailable

**Note**: Enhanced security features including robust WebSocket authentication and comprehensive organization isolation are planned for Phase 2.

## Performance Features (Phase 1)

1. **Basic Caching**: Organization-specific cache keys with 5-minute TTL
2. **Concurrent Requests**: Parallel provider calls for improved response times
3. **Mock Mode Fallback**: Automatic mock data when API keys not configured
4. **Request Timeout Management**: 8-second timeout per provider with graceful handling

## Planned Optimizations (Phase 2+)

1. **Circuit Breaker Patterns**: Automatic provider fallback during outages
2. **Geographic Intelligence**: Provider selection based on coverage areas and user location
3. **Request Deduplication**: Intelligent caching to prevent duplicate API calls
4. **Health-Based Routing**: Dynamic provider selection based on performance metrics

## Phase 1 Status & Next Steps

### What Phase 1 Delivers
- ✅ Multi-tenant provider orchestrator foundation
- ✅ Basic WebSocket infrastructure for real-time updates  
- ✅ Organization-aware caching structure
- ✅ Concurrent provider API calls
- ✅ Enhanced provider configuration framework
- ✅ Mock mode support for development

### Phase 2 Planned Features
- 🔄 Circuit breaker patterns with automatic failover
- 🔄 Provider health scoring and SLA monitoring
- 🔄 Enhanced WebSocket authentication and organization isolation
- 🔄 Geographic intelligence for provider selection
- 🔄 Advanced caching with request deduplication
- 🔄 Real-time provider performance dashboards

### Verification Checklist
To verify Phase 1 setup:
1. ✅ Server starts with "Quote WebSocket server initialized on /ws/quotes"
2. ✅ `/api/quotes/search?includeExternal=true` returns combined results **without authentication**
3. ✅ Anonymous users can access quote search functionality
4. ✅ Authenticated users receive organization-specific enhanced results
5. ✅ Providers show mock mode when API keys not configured
6. ✅ WebSocket connection established (check browser dev tools)
7. ✅ Organization context properly maintained in authenticated requests

For questions or support, contact the development team or refer to the main project documentation.