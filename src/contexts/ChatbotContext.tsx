import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatbotService } from '@/lib/chatbotService';
import { useCart } from '@/contexts/CartContext';
import { isCustomerLoggedIn } from '@/lib/shopify';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'outline';
  }>;
  metadata?: {
    products?: any[];
    intent?: string;
    confidence?: number;
  };
}

interface ChatbotState {
  messages: ChatMessage[];
  isLoading: boolean;
  unreadCount: number;
  sessionId: string;
  context: {
    lastSearchQuery?: string;
    currentCategory?: string;
    userPreferences?: Record<string, any>;
  };
}

type ChatbotAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'MARK_AS_READ' }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<ChatbotState['context']> }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'LOAD_PERSISTED_MESSAGES'; payload: ChatMessage[] };

const initialState: ChatbotState = {
  messages: [],
  isLoading: false,
  unreadCount: 0,
  sessionId: generateSessionId(),
  context: {}
};

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function chatbotReducer(state: ChatbotState, action: ChatbotAction): ChatbotState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      const newMessage = action.payload;
      const newUnreadCount = newMessage.type === 'bot' 
        ? state.unreadCount + 1 
        : state.unreadCount;
      
      return {
        ...state,
        messages: [...state.messages, newMessage],
        unreadCount: newUnreadCount
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'MARK_AS_READ':
      return {
        ...state,
        unreadCount: 0
      };

    case 'UPDATE_CONTEXT':
      return {
        ...state,
        context: { ...state.context, ...action.payload }
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        unreadCount: 0
      };

    case 'LOAD_PERSISTED_MESSAGES':
      return {
        ...state,
        messages: action.payload
      };

    default:
      return state;
  }
}

interface ChatbotContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  unreadCount: number;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => void;
  clearMessages: () => void;
  updateContext: (context: Partial<ChatbotState['context']>) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatbotReducer, initialState);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Persist messages to localStorage with better error handling
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatbot_messages');
    const savedSessionId = localStorage.getItem('chatbot_session_id');
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Only load recent messages (last 24 hours) and from current session
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentMessages = parsed.filter((msg: any) => 
          new Date(msg.timestamp) > oneDayAgo
        );
        
        if (recentMessages.length > 0) {
          dispatch({ 
            type: 'LOAD_PERSISTED_MESSAGES', 
            payload: recentMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              // Keep actions but regenerate them for bot messages
              actions: msg.type === 'bot' && msg.metadata?.products ? 
                msg.metadata.products.slice(0, 3).map((product: any) => ({
                  label: `View ${product.title}`,
                  action: () => {
                    console.log('Persisted action - navigating to:', product.handle, product.title);
                    if (product.handle) {
                      window.location.href = `/product/${product.handle}`;
                    } else {
                      window.location.href = '/catalog';
                    }
                  },
                  variant: 'default'
                })) : undefined
            }))
          });
        }
      } catch (error) {
        console.error('Failed to load persisted messages:', error);
        // Clear corrupted data
        localStorage.removeItem('chatbot_messages');
      }
    }
    
    // Save session ID
    localStorage.setItem('chatbot_session_id', state.sessionId);
  }, [state.sessionId]);

  // Save messages to localStorage with throttling
  useEffect(() => {
    if (state.messages.length > 0) {
      // Throttle saves to prevent excessive localStorage writes
      const timeoutId = setTimeout(() => {
        try {
          // Only persist messages without actions but keep metadata
          const persistableMessages = state.messages.slice(-50).map(msg => ({
            ...msg,
            actions: undefined,
            // Keep metadata for action regeneration
            metadata: msg.metadata
          }));
          localStorage.setItem('chatbot_messages', JSON.stringify(persistableMessages));
          localStorage.setItem('chatbot_last_save', new Date().toISOString());
        } catch (error) {
          console.error('Failed to save messages:', error);
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.messages]);

  const createNavigationAction = useCallback((path: string, label: string) => ({
    label,
    action: () => navigate(path),
    variant: 'outline' as const
  }), [navigate]);

  const createProductAction = useCallback((product: any) => ({
    label: `View ${product.title}`,
    action: () => {
      console.log('Navigating to product:', product.handle, product.title);
      if (product.handle) {
        navigate(`/product/${product.handle}`);
      } else {
        // Fallback to catalog if no handle
        navigate('/catalog');
      }
    },
    variant: 'default' as const
  }), [navigate]);

  const createAddToCartAction = useCallback((variantId: string, label: string = 'Add to Cart') => ({
    label,
    action: async () => {
      // Check if user is logged in
      if (!isCustomerLoggedIn()) {
        const loginMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'bot',
          content: '🔒 Please log in to add items to your cart. I can help you find products and you can add them later!',
          timestamp: new Date(),
          actions: [
            createNavigationAction('/profile', 'Log In'),
            createNavigationAction('/catalog', 'Continue Browsing')
          ]
        };
        dispatch({ type: 'ADD_MESSAGE', payload: loginMessage });
        return;
      }

      try {
        await addToCart(variantId, 1);
        // Add confirmation message
        const confirmationMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'bot',
          content: '✅ Added to cart! You can continue shopping or view your cart.',
          timestamp: new Date(),
          actions: [
            createNavigationAction('/cart', 'View Cart'),
            createNavigationAction('/catalog', 'Continue Shopping')
          ]
        };
        dispatch({ type: 'ADD_MESSAGE', payload: confirmationMessage });
      } catch (error) {
        console.error('Failed to add to cart:', error);
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'bot',
          content: '❌ Sorry, there was an issue adding the item to your cart. Please try again.',
          timestamp: new Date(),
          actions: [
            createNavigationAction('/cart', 'View Cart'),
            createNavigationAction('/catalog', 'Continue Shopping')
          ]
        };
        dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      }
    },
    variant: 'default' as const
  }), [addToCart, createNavigationAction]);

  const sendMessage = useCallback(async (content: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

    try {
      // Get bot response
      const response = await chatbotService.processMessage(content, {
        sessionId: state.sessionId,
        context: state.context,
        messageHistory: state.messages.slice(-10) // Last 10 messages for context
      });

      // Create actions based on response
      const actions: ChatMessage['actions'] = [];

      // Navigation actions
      if (response.navigation) {
        actions.push(createNavigationAction(response.navigation.path, response.navigation.label));
      }

      // Product actions
      if (response.products && response.products.length > 0) {
        response.products.slice(0, 3).forEach((product: any) => {
          actions.push(createProductAction(product));
          
          // Add to cart action if product has variants
          if (product.variants?.edges?.[0]?.node?.id) {
            actions.push(createAddToCartAction(
              product.variants.edges[0].node.id,
              `Add ${product.title} to Cart`
            ));
          }
        });
      }

      // Support options from context
      if (response.context?.supportOptions) {
        response.context.supportOptions.forEach((option: any) => {
          actions.push({
            label: option.title,
            action: () => {
              if (option.action.startsWith('mailto:') || option.action.startsWith('tel:') || option.action.startsWith('http')) {
                window.open(option.action, '_blank');
              } else if (option.action.startsWith('/')) {
                navigate(option.action);
              }
            },
            variant: option.type === 'email' ? 'default' : 'outline',
            description: option.description
          });
        });
      }

      // Additional quick actions based on intent
      switch (response.intent) {
        case 'search_products':
          actions.push(createNavigationAction('/catalog', 'Browse All Products'));
          break;
        case 'check_order':
          actions.push(createNavigationAction('/profile', 'View Orders'));
          break;
        case 'view_cart':
          actions.push(createNavigationAction('/cart', 'Go to Cart'));
          break;
        case 'add_to_cart':
          actions.push(createNavigationAction('/catalog', 'Browse More Products'));
          break;
        case 'get_help':
          if (!response.context?.supportEscalation) {
            actions.push({
              label: 'Contact Support',
              action: () => {
                const supportMessage: ChatMessage = {
                  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  type: 'user',
                  content: 'contact for support',
                  timestamp: new Date()
                };
                dispatch({ type: 'ADD_MESSAGE', payload: supportMessage });
                sendMessage('contact for support');
              },
              variant: 'default'
            });
          }
          actions.push({
            label: 'Start New Chat',
            action: () => dispatch({ type: 'CLEAR_MESSAGES' }),
            variant: 'outline'
          });
          break;
        case 'contact_support':
          // Don't add additional actions here since support options are already added above
          break;
      }

      // Create bot message
      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'bot',
        content: response.message,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
        metadata: {
          products: response.products,
          intent: response.intent,
          confidence: response.confidence
        }
      };

      dispatch({ type: 'ADD_MESSAGE', payload: botMessage });

      // Update context if provided
      if (response.context) {
        dispatch({ type: 'UPDATE_CONTEXT', payload: response.context });
      }

    } catch (error) {
      console.error('Failed to process message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'bot',
        content: "I'm sorry, I'm having trouble right now. Please try again in a moment or contact our support team.",
        timestamp: new Date(),
        actions: [
          createNavigationAction('/', 'Go to Homepage'),
          {
            label: 'Try Again',
            action: () => sendMessage(content),
            variant: 'outline'
          }
        ]
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.sessionId, state.context, state.messages, createNavigationAction, createProductAction, createAddToCartAction]);

  const markAsRead = useCallback(() => {
    dispatch({ type: 'MARK_AS_READ' });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    localStorage.removeItem('chatbot_messages');
  }, []);

  const updateContext = useCallback((context: Partial<ChatbotState['context']>) => {
    dispatch({ type: 'UPDATE_CONTEXT', payload: context });
  }, []);

  const contextValue: ChatbotContextType = {
    messages: state.messages,
    isLoading: state.isLoading,
    unreadCount: state.unreadCount,
    sendMessage,
    markAsRead,
    clearMessages,
    updateContext
  };

  return (
    <ChatbotContext.Provider value={contextValue}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}
