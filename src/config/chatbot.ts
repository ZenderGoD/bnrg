// Chatbot configuration
export const CHATBOT_CONFIG = {
  // API endpoints
  endpoints: {
    // Add your AI service endpoint here when ready
    // aiService: process.env.VITE_AI_SERVICE_URL || 'http://localhost:3001/api/chat',
  },

  // UI configuration
  ui: {
    position: {
      bottom: '6rem', // 60px + 1rem spacing from scroll-to-top
      right: '1.5rem',
      zIndex: 40, // Below scroll-to-top (z-50)
    },
    
    widget: {
      size: '3.5rem', // 56px (h-14 w-14)
      borderRadius: '50%',
      backgroundColor: 'hsl(var(--primary))',
      hoverScale: 1.05,
    },
    
    window: {
      width: '24rem', // 384px
      height: '31.25rem', // 500px
      borderRadius: '0.5rem',
      shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    
    animation: {
      stiffness: 300,
      damping: 30,
      duration: 0.2,
    },
  },

  // Functional configuration
  features: {
    persistMessages: true,
    messageRetentionHours: 24,
    maxMessageHistory: 50,
    enableTypingIndicator: true,
    enableUnreadCount: true,
    enableOfflineSupport: false, // Can be enabled later
    enableVoiceInput: false, // Future feature
  },

  // Performance settings
  performance: {
    debounceDelay: 300, // ms
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 100,
    batchSize: 5,
    enableLazyLoading: true,
  },

  // Default messages
  messages: {
    welcome: "Hey! I'm your MONTEVELORIS shopping assistant. Ask me about products, sizes, orders, or anything else!",
    offline: "I'm currently offline, but I'll help you as soon as I'm back online!",
    error: "I'm sorry, I'm having trouble right now. Please try again in a moment.",
    typing: "Typing...",
    reconnecting: "Reconnecting...",
  },

  // Product search configuration
  search: {
    maxResults: 5,
    enableFuzzySearch: true,
    searchFields: ['title', 'description', 'tags', 'vendor'],
    highlightTerms: true,
  },

  // Integration settings
  integrations: {
    shopify: {
      enableOrderTracking: true,
      enableCustomerData: true,
      enableProductSearch: true,
      enableCartIntegration: true,
    },
    
    analytics: {
      enabled: false, // Can be enabled for tracking chat interactions
      events: ['chat_open', 'message_sent', 'product_clicked', 'navigation_used'],
    },
  },

  // Accessibility
  accessibility: {
    announceNewMessages: true,
    keyboardNavigation: true,
    highContrastMode: false,
    fontSize: 'medium',
  },

  // Development settings
  development: {
    enableDebugLogs: import.meta.env.DEV,
    enablePerformanceMonitoring: import.meta.env.DEV,
    mockResponses: false,
  },
} as const;

// Type definitions for configuration
export type ChatbotConfig = typeof CHATBOT_CONFIG;

// Helper functions for configuration
export const getChatbotConfig = () => CHATBOT_CONFIG;

export const updateChatbotConfig = (updates: Partial<ChatbotConfig>) => {
  return { ...CHATBOT_CONFIG, ...updates };
};
