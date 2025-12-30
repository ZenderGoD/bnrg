// OpenAI integration for enhanced chatbot responses
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
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    // Use environment variable only - no hardcoded keys
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found in environment variables');
    }
  }

  async processMessage(
    userMessage: string,
    context: {
      messageHistory: Array<{ type: 'user' | 'bot'; content: string }>;
      userPreferences?: Record<string, any>;
      currentPage?: string;
    }
  ): Promise<OpenAIResponse> {
    try {
      const systemPrompt = this.createSystemPrompt();
      const conversationHistory = this.formatConversationHistory(context.messageHistory);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage }
          ],
          max_tokens: 300,
          temperature: 0.7,
          functions: [
            {
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
          ],
          function_call: { name: 'analyze_user_request' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const functionCall = data.choices[0]?.message?.function_call;
      
      if (functionCall && functionCall.name === 'analyze_user_request') {
        const result = JSON.parse(functionCall.arguments);
        return {
          message: result.message || 'I can help you with that!',
          intent: result.intent || 'search_products',
          searchTerms: result.searchTerms || [],
          productRequest: result.productRequest,
          confidence: result.confidence || 0.5
        };
      }

      // Fallback if function calling doesn't work
      return this.fallbackResponse(userMessage);

    } catch (error) {
      console.error('OpenAI Service Error:', error);
      return this.fallbackResponse(userMessage);
    }
  }

  private createSystemPrompt(): string {
    return `You are a helpful shopping assistant for 2XY, a premium sneaker store. Your role is to:

1. Help customers find products they're looking for
2. Provide information about sneakers, sizing, and availability
3. Navigate users to the right sections of the store
4. Assist with orders, cart management, and account questions
5. Be friendly, knowledgeable, and concise

Store Information:
- 2XY specializes in premium sneakers for men and women
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
- "Show me red Nike sneakers" → intent: search_products, searchTerms: ["red", "nike"], productRequest: {color: "red", brand: "nike"}
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
        message: "Hey there! 👋 Welcome to 2XY! I'm your AI shopping assistant and I'm here to help you find the perfect sneakers. What can I help you with today?",
        intent: 'greeting',
        confidence: 0.8
      };
    }
    
    if (lowerMessage.includes('help')) {
      return {
        message: "I'm here to help! I can assist you with:\n\n🔍 **Product Discovery** - Find sneakers by brand, color, style\n📏 **Size & Fit** - Sizing guides and recommendations\n🛒 **Shopping** - Cart management and checkout help\n💳 **Credits** - 2XY rewards and credit system\n📱 **Account** - Login, profile, and account management\n\nIf I can't solve your issue, I'll connect you with our Shopify customer support team!",
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
        message: "I'll take you to our men's sneaker collection!",
        intent: 'navigate_men',
        confidence: 0.7
      };
    }
    
    if (lowerMessage.includes('women')) {
      return {
        message: "Let me show you our women's sneaker collection!",
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
    const categories = ['running', 'athletic', 'sports', 'basketball', 'tennis', 'casual', 'formal', 'sneakers', 'shoes'];
    
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
      word.includes('sneaker')
    );
    
    return relevantTerms.length > 0 ? relevantTerms : words.slice(0, 3);
  }

  // Test connection to OpenAI
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const openaiService = new OpenAIService();
