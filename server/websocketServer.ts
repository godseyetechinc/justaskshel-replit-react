import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { QuoteResponse } from './insuranceProviderConfig';

interface QuoteUpdateMessage {
  type: 'quote_update';
  requestId: string;
  providerId: string;
  quotes: QuoteResponse[];
  status: 'pending' | 'success' | 'error';
  error?: string;
  organizationId?: number;
}

interface QuoteProgressMessage {
  type: 'quote_progress';
  requestId: string;
  providersTotal: number;
  providersCompleted: number;
  providersSuccessful: number;
  providersFailed: number;
  organizationId?: number;
}

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  organizationId?: number;
  activeRequests: Set<string>;
}

export class QuoteWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/quotes'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('Quote WebSocket server initialized on /ws/quotes');
  }

  private handleConnection(ws: WebSocket, req: any) {
    const clientId = this.generateClientId();
    const connection: ClientConnection = {
      ws,
      activeRequests: new Set()
    };

    this.clients.set(clientId, connection);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendError(clientId, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.clients.delete(clientId);
    });

    // Send connection acknowledgment
    this.sendMessage(clientId, {
      type: 'connection_ack',
      clientId,
      timestamp: new Date().toISOString()
    });

    console.log(`Client ${clientId} connected to quotes WebSocket`);
  }

  private handleMessage(clientId: string, message: any) {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    switch (message.type) {
      case 'auth':
        this.handleAuth(clientId, message);
        break;
      case 'subscribe_quotes':
        this.handleSubscribeQuotes(clientId, message);
        break;
      case 'unsubscribe_quotes':
        this.handleUnsubscribeQuotes(clientId, message);
        break;
      default:
        this.sendError(clientId, `Unknown message type: ${message.type}`);
    }
  }

  private handleAuth(clientId: string, message: any) {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    // Extract user info from auth message
    connection.userId = message.userId;
    connection.organizationId = message.organizationId;

    this.sendMessage(clientId, {
      type: 'auth_success',
      userId: connection.userId,
      organizationId: connection.organizationId
    });
  }

  private handleSubscribeQuotes(clientId: string, message: any) {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    const requestId = message.requestId;
    if (requestId) {
      connection.activeRequests.add(requestId);
      
      this.sendMessage(clientId, {
        type: 'subscription_ack',
        requestId,
        subscribed: true
      });
    }
  }

  private handleUnsubscribeQuotes(clientId: string, message: any) {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    const requestId = message.requestId;
    if (requestId) {
      connection.activeRequests.delete(requestId);
      
      this.sendMessage(clientId, {
        type: 'subscription_ack',
        requestId,
        subscribed: false
      });
    }
  }

  // Public methods for sending updates
  broadcastQuoteUpdate(update: QuoteUpdateMessage) {
    for (const [clientId, connection] of Array.from(this.clients.entries())) {
      // Check if client is subscribed to this request
      if (connection.activeRequests.has(update.requestId)) {
        // Check organization access
        if (update.organizationId && connection.organizationId !== update.organizationId) {
          continue; // Skip if different organization
        }
        
        this.sendMessage(clientId, update);
      }
    }
  }

  broadcastQuoteProgress(progress: QuoteProgressMessage) {
    for (const [clientId, connection] of Array.from(this.clients.entries())) {
      // Check if client is subscribed to this request
      if (connection.activeRequests.has(progress.requestId)) {
        // Check organization access
        if (progress.organizationId && connection.organizationId !== progress.organizationId) {
          continue; // Skip if different organization
        }
        
        this.sendMessage(clientId, progress);
      }
    }
  }

  sendQuoteUpdateToUser(userId: string, update: QuoteUpdateMessage) {
    for (const [clientId, connection] of Array.from(this.clients.entries())) {
      if (connection.userId === userId && connection.activeRequests.has(update.requestId)) {
        this.sendMessage(clientId, update);
      }
    }
  }

  sendQuoteProgressToUser(userId: string, progress: QuoteProgressMessage) {
    for (const [clientId, connection] of Array.from(this.clients.entries())) {
      if (connection.userId === userId && connection.activeRequests.has(progress.requestId)) {
        this.sendMessage(clientId, progress);
      }
    }
  }

  // Send quote completion notification
  sendQuoteCompletion(requestId: string, organizationId?: number, totalQuotes?: number) {
    const completionMessage = {
      type: 'quote_completion',
      requestId,
      totalQuotes: totalQuotes || 0,
      timestamp: new Date().toISOString(),
      organizationId
    };

    for (const [clientId, connection] of Array.from(this.clients.entries())) {
      if (connection.activeRequests.has(requestId)) {
        // Check organization access
        if (organizationId && connection.organizationId !== organizationId) {
          continue;
        }
        
        this.sendMessage(clientId, completionMessage);
        // Auto-unsubscribe from completed request
        connection.activeRequests.delete(requestId);
      }
    }
  }

  private sendMessage(clientId: string, message: any) {
    const connection = this.clients.get(clientId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  private sendError(clientId: string, error: string) {
    this.sendMessage(clientId, {
      type: 'error',
      error,
      timestamp: new Date().toISOString()
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get connection stats for monitoring
  getConnectionStats() {
    let totalConnections = 0;
    let activeSubscriptions = 0;
    const organizationCounts: { [orgId: string]: number } = {};

    for (const connection of Array.from(this.clients.values())) {
      totalConnections++;
      activeSubscriptions += connection.activeRequests.size;
      
      if (connection.organizationId) {
        const orgId = connection.organizationId.toString();
        organizationCounts[orgId] = (organizationCounts[orgId] || 0) + 1;
      }
    }

    return {
      totalConnections,
      activeSubscriptions,
      organizationCounts,
      timestamp: new Date().toISOString()
    };
  }

  // Clean up inactive connections
  cleanup() {
    for (const [clientId, connection] of Array.from(this.clients.entries())) {
      if (connection.ws.readyState === WebSocket.CLOSED) {
        this.clients.delete(clientId);
      }
    }
  }
}

export let quoteWebSocketServer: QuoteWebSocketServer | null = null;

export function initializeQuoteWebSocket(server: Server): QuoteWebSocketServer {
  quoteWebSocketServer = new QuoteWebSocketServer(server);
  return quoteWebSocketServer;
}