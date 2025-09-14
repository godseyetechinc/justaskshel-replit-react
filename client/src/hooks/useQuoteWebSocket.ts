import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface QuoteUpdateMessage {
  type: 'quote_update';
  requestId: string;
  providerId: string;
  quotes: any[];
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

interface QuoteCompletionMessage {
  type: 'quote_completion';
  requestId: string;
  totalQuotes: number;
  timestamp: string;
  organizationId?: number;
}

type WebSocketMessage = QuoteUpdateMessage | QuoteProgressMessage | QuoteCompletionMessage | any;

export function useQuoteWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [progress, setProgress] = useState<QuoteProgressMessage | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/quotes`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Quote WebSocket connected');
        setIsConnected(true);

        // Authenticate if user is available
        if (user && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            userId: user.id,
            organizationId: user.organizationId
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Quote WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            connect();
          }
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Quote WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_ack':
        console.log('WebSocket connection acknowledged:', message.clientId);
        break;

      case 'auth_success':
        console.log('WebSocket authentication successful');
        break;

      case 'quote_update':
        if (message.requestId === activeRequestId) {
          if (message.status === 'success') {
            setQuotes(prev => [...prev, ...message.quotes]);
          }
        }
        break;

      case 'quote_progress':
        if (message.requestId === activeRequestId) {
          setProgress(message);
        }
        break;

      case 'quote_completion':
        if (message.requestId === activeRequestId) {
          console.log(`Quote search completed: ${message.totalQuotes} quotes found`);
          setProgress(null);
        }
        break;

      case 'error':
        console.error('WebSocket error:', message.error);
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  const subscribeToQuoteRequest = (requestId: string) => {
    setActiveRequestId(requestId);
    setQuotes([]);
    setProgress(null);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_quotes',
        requestId
      }));
    }
  };

  const unsubscribeFromQuoteRequest = () => {
    if (activeRequestId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe_quotes',
        requestId: activeRequestId
      }));
    }
    
    setActiveRequestId(null);
    setQuotes([]);
    setProgress(null);
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setActiveRequestId(null);
    setQuotes([]);
    setProgress(null);
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [user?.id]);

  return {
    isConnected,
    quotes,
    progress,
    activeRequestId,
    subscribeToQuoteRequest,
    unsubscribeFromQuoteRequest,
    connect,
    disconnect
  };
}