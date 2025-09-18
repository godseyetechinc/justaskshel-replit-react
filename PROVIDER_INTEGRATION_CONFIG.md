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
JASASSURE_API_KEY=your_jasassure_api_key
JASASSURE_API_URL=http://api1.justaskshel.com:8700/web-api/v1
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

## How To: Switch Providers from Mock to Live Mode

### Understanding Provider Modes

Each insurance provider can operate in two modes:

**Mock Mode (Default):**
- Returns simulated quote data
- No external HTTP requests made
- Safe for development and testing
- Activated when API keys are missing

**Live Mode:**
- Makes actual HTTP requests to provider APIs
- Returns real insurance quotes
- Requires valid API keys
- Used in production environments

### Check Current Provider Status

**Method 1: Examine Configuration**
```bash
# Look for provider configs in server/insuranceProviderConfig.ts
grep -A 10 "jas_assure" server/insuranceProviderConfig.ts
```

**Method 2: Check Environment Variables**

**In Replit:**
1. Go to **Secrets** pane in workspace
2. Look for `JASASSURE_API_KEY` in the secrets list

**In Local Development:**
```bash
# Verify if required API keys exist
echo $JASASSURE_API_KEY  # Should show API key value or be empty
```

**Method 3: Server Logs**
```bash
# Look for provider initialization messages
# Mock providers won't show external HTTP activity
```

### Enable Live API Calls

**For `jas_assure` Provider:**

**Using Replit Secrets (Recommended):**
1. **Open Secrets Pane**
   - Click on the **Secrets** tool in your Replit workspace

2. **Add API Key**
   - Click **"Add a new secret"**
   - Key: `JASASSURE_API_KEY`
   - Value: `your_actual_api_key_here`
   - Click **"Add secret"**

3. **Optional: Set Custom API URL**
   - Click **"Add a new secret"** again
   - Key: `JASASSURE_API_URL`
   - Value: `http://api1.justaskshel.com:8700/web-api/v1`
   - Click **"Add secret"**

4. **Restart the Application**
   - Application will automatically restart in Replit
   - Or manually restart with **Run** button

**Using Local Environment:**
1. **Set Required Environment Variable**
   ```bash
   export JASASSURE_API_KEY=your_actual_api_key_here
   ```

2. **Optional: Set Custom API URL**
   ```bash
   export JASASSURE_API_URL=http://api1.justaskshel.com:8700/web-api/v1
   ```

3. **Restart the Application**
   ```bash
   npm run dev
   ```

4. **Verify Live Mode**
   - Check server logs for external HTTP requests
   - Monitor network tab in browser developer tools
   - Test quote search functionality

**For Other Providers:**

Each provider follows the same pattern:
```bash
# General format
export PROVIDER_NAME_API_KEY=your_key
export PROVIDER_NAME_API_URL=provider_url  # If custom URL needed
```

**Example Provider Environment Variables:**

**In Replit Secrets:**
- Add secrets with keys: `HEALTHPLUS_API_KEY`, `DENTALCARE_API_KEY`, `VISIONFIRST_API_KEY`, etc.
- Each secret value should be the actual API key from the provider

**In Local Environment:**
```bash
# JAS Assure provider (primary example)
JASASSURE_API_KEY=your_jas_assure_key
JASASSURE_API_URL=http://api1.justaskshel.com:8700/web-api/v1

# Health Plus provider
HEALTHPLUS_API_KEY=your_health_plus_key
HEALTHPLUS_API_URL=https://api.healthplus.com/quotes

# Dental Care provider  
DENTALCARE_API_KEY=your_dental_care_key
DENTALCARE_API_URL=https://api.dentalcare.com/v2

# Vision First provider
VISIONFIRST_API_KEY=your_vision_first_key
VISIONFIRST_API_URL=https://api.visionfirst.com/v1
```

### Troubleshooting

**Problem: Provider still using mock data**
- ✅ Verify API key environment variable is set correctly
- ✅ Restart the application after setting variables
- ✅ Check for typos in environment variable names
- ✅ Ensure API key is valid and has proper permissions

**Problem: External API calls failing**
- ✅ Verify API endpoint URL is correct
- ✅ Check API key permissions with provider
- ✅ Review server logs for detailed error messages
- ✅ Test API endpoint manually with curl or Postman

**Problem: Provider not appearing in results**
- ✅ Ensure `isActive: true` in provider configuration
- ✅ Check if provider supports the requested coverage type
- ✅ Verify provider priority settings

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
8. ✅ Test specific provider live mode (e.g., `jas_assure`) by setting required API keys

### How To: Test Specific Provider Integration

**Testing `jas_assure` Provider:**
1. **Set environment variable in Replit:**
   - Go to Secrets pane
   - Add secret: Key=`JASASSURE_API_KEY`, Value=`test_key_value`
2. Restart application (automatic in Replit)
3. Call `/api/quotes/search?includeExternal=true&typeId=1`
4. Check server logs for HTTP requests to `http://api1.justaskshel.com:8700/web-api/v1`
5. Verify response includes quotes from JAS Assurance provider

**Generic Provider Testing:**
1. Set provider-specific API key environment variable
2. Restart application to disable mock mode
3. Monitor external HTTP requests in logs
4. Verify quote responses include provider data

For questions or support, contact the development team or refer to the main project documentation.