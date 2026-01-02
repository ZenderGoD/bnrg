// OpenRouter integration using OpenAI SDK
import OpenAI from 'openai';

interface OpenAIResponse {
  message: string;
  intent: string;
  searchTerms?: string[];
  productRequest?: {
    category?: string;
    color?: string;
    brand?: string;
    priceRange?: { min?: number; max?: number };
    size?: string;
  };
  confidence: number;
}

class OpenAIService {
  private openai: OpenAI | null = null;
  private apiKey: string;

  constructor() {
    // Use environment variable only - no hardcoded keys
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    
    // Debug logging
    console.log('🔍 Environment check:', {
      hasApiKey: !!this.apiKey,
      keyLength: this.apiKey?.length || 0,
      keyPrefix: this.apiKey?.substring(0, 10) || 'none',
      allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('OPENROUTER') || k.includes('OPENAI'))
    });
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not found in environment variables (VITE_OPENROUTER_API_KEY)');
      console.warn('Chatbot will use rule-based fallback instead of AI');
      console.warn('Make sure .env file is in the project root and dev server is restarted');
    } else {
      console.log('✅ OpenRouter API key found, AI chatbot enabled');
    }
  }

  private getClient(): OpenAI {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is missing. Please set VITE_OPENROUTER_API_KEY in your environment variables.');
    }
    if (!this.openai && typeof window !== 'undefined') {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        dangerouslyAllowBrowser: true, // Required for browser usage with OpenRouter
        defaultHeaders: {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MONTEVELORIS Shopping Assistant',
        },
      });
    }
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    return this.openai;
  }

  async processMessage(
    userMessage: string,
    context: {
      messageHistory: Array<{ type: 'user' | 'bot'; content: string }>;
      userPreferences?: Record<string, unknown>;
      currentPage?: string;
    }
  ): Promise<OpenAIResponse> {
    try {
      const systemPrompt = this.createSystemPrompt();
      const conversationHistory = this.formatConversationHistory(context.messageHistory);
      
      console.log('🤖 Calling OpenRouter API with model: openai/gpt-4o-mini');
      
      const response = await this.getClient().chat.completions.create({
        model: 'openai/gpt-4o-mini', // Using GPT-4o-mini (faster and cheaper than GPT-4)
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.7,
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_user_request',
              description: 'Analyze user request and extract intent and product details',
              parameters: {
                type: 'object',
                properties: {
                  intent: {
                    type: 'string',
                    enum: [
                      'search_products',
                      'navigate_catalog',
                      'navigate_men',
                      'navigate_women',
                      'view_cart',
                      'add_to_cart',
                      'check_order',
                      'account_info',
                      'credits_info',
                      'greeting',
                      'get_help',
                      'contact_support',
                      'price_inquiry',
                      'size_inquiry',
                      'availability',
                      'brand_inquiry',
                      'color_preference'
                    ]
                  },
                  message: {
                    type: 'string',
                    description: 'Friendly response message for the user'
                  },
                  searchTerms: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Relevant search terms for product discovery'
                  },
                  productRequest: {
                    type: 'object',
                    properties: {
                      category: {
                        type: 'string',
                        enum: ['men', 'women', 'athletic', 'casual', 'running', 'basketball', 'lifestyle']
                      },
                      color: {
                        type: 'string',
                        enum: ['red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray']
                      },
                      brand: {
                        type: 'string',
                        enum: ['nike', 'adidas', 'jordan', 'puma', 'reebok', 'converse', 'vans']
                      },
                      priceRange: {
                        type: 'object',
                        properties: {
                          min: { type: 'number' },
                          max: { type: 'number' }
                        }
                      },
                      size: { type: 'string' }
                    }
                  },
                  confidence: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    description: 'Confidence level in the intent classification'
                  }
                },
                required: ['intent', 'message', 'confidence']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_user_request' } }
      });

      const message = response.choices[0]?.message;
      const toolCalls = message?.tool_calls;
      
      if (toolCalls && toolCalls.length > 0) {
        const toolCall = toolCalls[0];
        if (toolCall.type === 'function' && toolCall.function.name === 'analyze_user_request') {
          const result = JSON.parse(toolCall.function.arguments);
          return {
            message: result.message || 'I can help you with that!',
            intent: result.intent || 'search_products',
            searchTerms: result.searchTerms || [],
            productRequest: result.productRequest,
            confidence: result.confidence || 0.5
          };
        }
      }

      // Fallback if function calling doesn't work
      return this.fallbackResponse(userMessage);

    } catch (error) {
      console.error('❌ OpenRouter Service Error:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check for specific error types
        if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('🔑 Authentication failed - API key may be invalid or expired');
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          console.error('🚫 Access forbidden - Check API key permissions');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          console.error('🌐 Network error - Check internet connection and OpenRouter service status');
        } else if (error.message.includes('model') || error.message.includes('invalid')) {
          console.error('🤖 Model error - The model "openai/gpt-4o-mini" may not be available or you may need credits');
        }
      }
      
      return this.fallbackResponse(userMessage);
    }
  }

  private createSystemPrompt(): string {
    return `You are a helpful shopping assistant for MONTEVELORIS, a premium footwear store. Your role is to:

1. Help customers find products they're looking for
2. Provide information about footwear, sizing, and availability
3. Navigate users to the right sections of the store
4. Assist with orders, cart management, and account questions
5. Be friendly, knowledgeable, and concise

Store Information:
- MONTEVELORIS specializes in premium footwear for men and women
- Categories: Athletic/Sports, Lifestyle/Casual, Limited Edition, Retro/Classics
- Brands: Nike, Adidas, Jordan, Puma, Reebok, Converse, Vans, and more
- Price ranges: Budget-friendly to premium ($50-$300+)
- Sizes: US 4-16 for most styles

Guidelines:
- Keep responses conversational and helpful
- When users ask about products, extract relevant details (color, brand, category, price, size)
- For navigation requests, identify the best section to direct them to
- For greetings, be welcoming and ask how you can help
- If unclear, ask clarifying questions
- Always maintain a friendly, professional tone

Examples:
- "Show me red Nike footwear" → intent: search_products, searchTerms: ["red", "nike"], productRequest: {color: "red", brand: "nike"}
- "Take me to men's section" → intent: navigate_men
- "What's in my cart?" → intent: view_cart
- "Hi there!" → intent: greeting`;
  }

  private formatConversationHistory(history: Array<{ type: 'user' | 'bot'; content: string }>): Array<{ role: 'user' | 'assistant'; content: string }> {
    return history.slice(-6).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  private fallbackResponse(userMessage: string): OpenAIResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple keyword matching as fallback
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
      return {
        message: "Hey there! 👋 Welcome to MONTEVELORIS! I'm your AI shopping assistant and I'm here to help you find the perfect footwear. What can I help you with today?",
        intent: 'greeting',
        confidence: 0.8
      };
    }
    
    if (lowerMessage.includes('help')) {
      return {
        message: "I'm here to help! I can assist you with:\n\n🔍 **Product Discovery** - Find footwear by brand, color, style\n📏 **Size & Fit** - Sizing guides and recommendations\n🛒 **Shopping** - Cart management and checkout help\n💳 **Credits** - MONTEVELORIS rewards and credit system\n📱 **Account** - Login, profile, and account management\n\nIf I can't solve your issue, I'll connect you with our Shopify customer support team!",
        intent: 'get_help',
        confidence: 0.8
      };
    }
    
    if (lowerMessage.includes('cart')) {
      return {
        message: "I can help you with your cart! Let me take you there.",
        intent: 'view_cart',
        confidence: 0.7
      };
    }
    
    if (lowerMessage.includes('men')) {
      return {
        message: "I'll take you to our men's footwear collection!",
        intent: 'navigate_men',
        confidence: 0.7
      };
    }
    
    if (lowerMessage.includes('women')) {
      return {
        message: "Let me show you our women's footwear collection!",
        intent: 'navigate_women',
        confidence: 0.7
      };
    }

    // Extract potential search terms
    const searchTerms = this.extractSearchTerms(userMessage);
    
    return {
      message: "I'll help you find what you're looking for! Let me search our collection.",
      intent: 'search_products',
      searchTerms,
      confidence: 0.5
    };
  }

  private extractSearchTerms(message: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'show', 'find', 'get', 'want', 'need', 'looking', 'search'];
    const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];
    const brands = ['nike', 'adidas', 'jordan', 'puma', 'reebok', 'converse', 'vans'];
    const categories = ['running', 'athletic', 'sports', 'basketball', 'tennis', 'casual', 'formal', 'footwear', 'shoes'];
    
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
    
    const relevantTerms = words.filter(word => 
      colors.includes(word) || 
      brands.includes(word) || 
      categories.includes(word) ||
      word.includes('shoe') ||
      word.includes('footwear')
    );
    
    return relevantTerms.length > 0 ? relevantTerms : words.slice(0, 3);
  }

  // Test connection to OpenRouter
  async testConnection(): Promise<boolean> {
    try {
      // Simple test by attempting to create a minimal completion
      await this.getClient().chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const openaiService = new OpenAIService();
