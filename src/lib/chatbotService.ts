import { 
  getAllProducts, 
  getProductsByCollection, 
  searchProducts,
  getProduct,
  type ShopifyProduct 
} from './shopify';
import { openaiService } from './openaiService';

interface ChatbotRequest {
  sessionId: string;
  context: Record<string, unknown>;
  messageHistory: Array<{
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
  }>;
}

interface ChatbotResponse {
  message: string;
  intent: string;
  confidence: number;
  products?: ShopifyProduct[];
  navigation?: {
    path: string;
    label: string;
  };
  context?: Record<string, unknown>;
}

// Intent patterns and responses
const INTENT_PATTERNS = {
  // Product search intents
  search_products: [
    /(?:show|find|search|look|want|need|get).*(shoes?|footwear|socks?)/i,
    /(?:red|blue|green|black|white|yellow|orange|purple|pink|brown|gray|grey).*(shoes?|footwear|socks?)/i,
    /(?:nike|adidas|jordan|puma|reebok|converse|vans)/i,
    /(?:running|athletic|sports?|basketball|tennis|casual|formal)/i,
    /(?:men'?s?|women'?s?|kids?|unisex).*(shoes?|footwear|socks?)/i,
    /size\s*\d+/i,
    /under\s*\$?\d+/i,
    /socks?/i,
  ],
  
  // Navigation intents
  navigate_catalog: [
    /(?:browse|catalog|all products|see everything|shop)/i,
    /(?:show|see).*(collection|category|section)/i,
  ],
  
  navigate_men: [
    /(?:men'?s?|male|guys?).*(section|category|shoes?|footwear)/i,
  ],
  
  navigate_women: [
    /(?:women'?s?|female|ladies|girls?).*(section|category|shoes?|footwear)/i,
  ],
  
  // Cart and order intents
  view_cart: [
    /(?:what'?s?|show|view).*(in my cart|added|my bag)/i,
    /(?:go to|open).*cart/i,
  ],
  
  add_to_cart: [
    /add.*(?:to cart|to bag|to basket)/i,
    /(?:put|place).*(?:in cart|in bag|in basket)/i,
    /(?:buy|purchase|get).*(?:this|it|these|them)/i,
    /(?:i want|i need|i'll take).*(?:this|it|these|them)/i,
  ],
  
  check_order: [
    /(?:order|purchase|delivery|shipping).*(status|track|where)/i,
    /(?:where|when).*(order|package|delivery)/i,
  ],
  
  // Account intents
  account_info: [
    /(?:account|profile|login|sign in)/i,
    /(?:my|personal).*(info|details|account)/i,
  ],
  
  credits_info: [
    /credits?|points?|rewards?|loyalty/i,
    /(?:how many|check).*(credits?|points?)/i,
  ],
  
  // Help and general intents
  greeting: [
    /^(?:hi|hello|hey|greetings|good morning|good afternoon|good evening)/i,
  ],
  
  get_help: [
    /help|support|assist|customer service/i,
    /(?:how|what|can).*(help|do|assist)/i,
    /contact.*support|speak.*human|talk.*person/i,
    /(?:need|want).*(help|support|assistance)/i,
    /can't.*find|having.*trouble|problem.*with/i,
  ],
  
  contact_support: [
    /contact.*support|speak.*human|talk.*person/i,
    /customer.*service|live.*chat|call.*store/i,
    /escalate|can't.*help|more.*help/i,
  ],
  
  price_inquiry: [
    /(?:price|cost|how much|expensive|cheap)/i,
    /\$\d+/,
  ],
  
  size_inquiry: [
    /(?:size|fit|sizing|measurement)/i,
    /(?:what size|size guide|size chart)/i,
  ],
  
  availability: [
    /(?:available|in stock|out of stock|sold out)/i,
    /(?:do you have|got any)/i,
  ],
};

// Response templates
const RESPONSE_TEMPLATES = {
  greeting: [
    "Hey there! 👋 Welcome to MONTEVELORIS! I'm here to help you find the perfect footwear. What are you looking for today?",
    "Hello! I'm your MONTEVELORIS shopping assistant. Whether you need help finding shoes, checking orders, or have questions, I'm here to help!",
    "Hi! Ready to find some amazing footwear? I can help you search our collection, check sizes, or answer any questions you have.",
  ],
  
  search_products: [
    "I found some great options for you! Here are the products that match what you're looking for:",
    "Perfect! I've found some footwear that might interest you:",
    "Here are some awesome options from our collection:",
  ],
  
  no_products_found: [
    "I couldn't find any products matching that exactly, but here are some similar options you might like:",
    "No exact matches, but I think you'll love these alternatives:",
    "Let me show you some similar products that might work for you:",
  ],
  
  navigation_help: [
    "I can help you navigate to the right section! Here are some quick links:",
    "Let me direct you to where you want to go:",
    "Here are some helpful navigation options:",
  ],
  
  cart_help: [
    "I can help you with your cart! Let me get that information for you:",
    "Here's what I can help you with regarding your cart:",
  ],
  
  account_help: [
    "I can help you with your account information:",
    "Here are your account options:",
  ],
  
  general_help: [
    "I'm here to help! I can assist you with finding products, checking orders, navigating the site, and more. What would you like to do?",
    "I can help you with lots of things! Product searches, order tracking, account info, sizing help, and more. What do you need?",
  ],
  
  error: [
    "I'm sorry, I didn't quite understand that. Could you try asking in a different way?",
    "I'm not sure about that one. Can you be more specific about what you're looking for?",
    "Let me help you better - could you rephrase your question?",
  ],
};

class ChatbotService {
  private productCache: Map<string, ShopifyProduct[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async processMessage(message: string, request: ChatbotRequest): Promise<ChatbotResponse> {
    try {
      // First try OpenRouter for enhanced understanding
      try {
        const userPreferences = 
          typeof request.context.userPreferences === 'object' && 
          request.context.userPreferences !== null &&
          !Array.isArray(request.context.userPreferences)
            ? request.context.userPreferences as Record<string, unknown>
            : undefined;
        const currentPage = typeof request.context.currentPage === 'string' 
          ? request.context.currentPage 
          : undefined;

        const aiResponse = await openaiService.processMessage(message, {
          messageHistory: request.messageHistory,
          userPreferences,
          currentPage,
        });
        
        // Use AI response to generate better output
        const response = await this.generateResponseFromAI(aiResponse, request);
        return {
          ...response,
          intent: aiResponse.intent,
          confidence: aiResponse.confidence,
        };
      } catch (aiError) {
        console.warn('OpenRouter service unavailable, falling back to rule-based system:', aiError);
        
        // Fallback to rule-based system
        const intent = this.detectIntent(message);
        const response = await this.generateResponse(message, intent, request);
        
        return {
          ...response,
          intent,
          confidence: this.calculateConfidence(message, intent),
        };
      }
    } catch (error) {
      console.error('ChatbotService error:', error);
      // Better error handling - try to provide a helpful response even on error
      try {
        const intent = this.detectIntent(message);
        const response = await this.generateResponse(message, intent, request);
        return {
          ...response,
          intent,
          confidence: 0.3,
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return {
          message: "I'm here to help! Could you try asking in a different way? For example:\n• \"Show me footwear\"\n• \"Browse men's collection\"\n• \"What's in my cart?\"",
          intent: 'get_help',
          confidence: 0,
        };
      }
    }
  }

  private async generateResponseFromAI(
    aiResponse: {
      intent: string;
      message: string;
      searchTerms?: string[];
      productRequest?: {
        category?: string;
        color?: string;
        brand?: string;
        priceRange?: { min?: number; max?: number };
        size?: string;
      };
    },
    request: ChatbotRequest
  ): Promise<Omit<ChatbotResponse, 'intent' | 'confidence'>> {
    const { intent, message: aiMessage, searchTerms, productRequest } = aiResponse;
    
    // Use AI insights to enhance product search
    if (intent === 'search_products' && (searchTerms?.length > 0 || productRequest)) {
      return await this.handleEnhancedProductSearch(aiMessage, searchTerms, productRequest, request);
    }
    
    // For other intents, use the existing logic but with AI message
    const fallbackResponse = await this.generateResponse('', intent, request);
    return {
      ...fallbackResponse,
      message: aiMessage || fallbackResponse.message,
    };
  }

  private async handleEnhancedProductSearch(
    aiMessage: string,
    searchTerms: string[] = [],
    productRequest: {
      category?: string;
      color?: string;
      brand?: string;
      priceRange?: { min?: number; max?: number };
      size?: string;
    } = {},
    request: ChatbotRequest
  ): Promise<Omit<ChatbotResponse, 'intent' | 'confidence'>> {
    try {
      let products: ShopifyProduct[] = [];
      
      // Build search query based on AI insights
      const searchQuery = this.buildSearchQuery(searchTerms, productRequest);
      const cacheKey = `ai_${searchQuery}`;
      
      // Check cache first
      products = this.getCachedProducts(cacheKey);
      
      if (!products) {
        // Enhanced search with AI insights
        if (searchQuery) {
          console.log('Searching for products with query:', searchQuery);
          products = await searchProducts(searchQuery);
          console.log('Search results:', products.length, 'products found');
          
          // If no results, try broader search
          if (products.length === 0 && searchTerms.length > 0) {
            console.log('No results, trying broader search with:', searchTerms[0]);
            products = await searchProducts(searchTerms[0]);
            console.log('Broader search results:', products.length, 'products found');
          }
        }
        
        // Category-specific search if specified
        if (products.length === 0 && productRequest.category) {
          if (productRequest.category === 'men') {
            products = await getProductsByCollection('men');
          } else if (productRequest.category === 'women') {
            products = await getProductsByCollection('women');
          }
        }
        
        // Fallback to popular products
        if (products.length === 0) {
          console.log('No products found, getting popular products');
          products = await getAllProducts(12);
          console.log('Fallback products:', products.length, 'products loaded');
        }
        
        // Filter by AI-detected criteria
        products = this.filterProductsByAI(products, productRequest);
        
        this.setCachedProducts(cacheKey, products);
      }

      if (products.length > 0) {
        const displayProducts = products.slice(0, 5);
        
        return {
          message: aiMessage || `Great! I found ${products.length} result${products.length > 1 ? 's' : ''} for you:`,
          products: displayProducts,
          context: {
            lastSearchQuery: searchQuery,
            searchResults: products.length,
            aiInsights: productRequest,
          },
        };
      } else {
        const fallbackProducts = await getAllProducts(4);
        
        return {
          message: aiMessage || "I couldn't find exactly what you're looking for, but here are some great options:",
          products: fallbackProducts,
          context: {
            lastSearchQuery: searchQuery,
            searchResults: 0,
            aiInsights: productRequest,
          },
        };
      }
    } catch (error) {
      console.error('Enhanced product search error:', error);
      return {
        message: aiMessage || "I'm having trouble searching right now. Let me show you some popular options!",
        products: await getAllProducts(4),
      };
    }
  }

  private buildSearchQuery(
    searchTerms: string[],
    productRequest: {
      category?: string;
      color?: string;
      brand?: string;
      priceRange?: { min?: number; max?: number };
      size?: string;
    }
  ): string {
    const terms = [...searchTerms];
    
    if (productRequest.color) terms.push(productRequest.color);
    if (productRequest.brand) terms.push(productRequest.brand);
    if (productRequest.category && !['men', 'women'].includes(productRequest.category)) {
      terms.push(productRequest.category);
    }
    
    return terms.join(' ');
  }

  private filterProductsByAI(
    products: ShopifyProduct[],
    productRequest: {
      category?: string;
      color?: string;
      brand?: string;
      priceRange?: { min?: number; max?: number };
      size?: string;
    }
  ): ShopifyProduct[] {
    let filtered = [...products];
    
    // Filter by price range if specified
    if (productRequest.priceRange) {
      const { min, max } = productRequest.priceRange;
      filtered = filtered.filter(product => {
        const price = parseFloat(product.priceRange.minVariantPrice.amount);
        return (!min || price >= min) && (!max || price <= max);
      });
    }
    
    // Filter by color (check title and tags)
    if (productRequest.color) {
      const color = productRequest.color.toLowerCase();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(color) ||
        product.tags.some(tag => tag.toLowerCase().includes(color))
      );
    }
    
    // Filter by brand (check title and tags)
    if (productRequest.brand) {
      const brand = productRequest.brand.toLowerCase();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(brand) ||
        product.tags.some(tag => tag.toLowerCase().includes(brand))
      );
    }
    
    return filtered.length > 0 ? filtered : products; // Return original if no matches
  }

  private detectIntent(message: string): string {
    const lowercaseMessage = message.toLowerCase();
    
    // Check each intent pattern
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(lowercaseMessage)) {
          return intent;
        }
      }
    }
    
    // Default intent based on common keywords
    if (lowercaseMessage.includes('help')) return 'get_help';
    if (lowercaseMessage.includes('hi') || lowercaseMessage.includes('hello')) return 'greeting';
    
    return 'search_products'; // Default to product search
  }

  private calculateConfidence(message: string, intent: string): number {
    const patterns = INTENT_PATTERNS[intent as keyof typeof INTENT_PATTERNS];
    if (!patterns) return 0.5;
    
    const lowercaseMessage = message.toLowerCase();
    let maxConfidence = 0;
    
    for (const pattern of patterns) {
      if (pattern.test(lowercaseMessage)) {
        // Calculate confidence based on pattern specificity
        const patternString = pattern.toString();
        const complexity = patternString.length / 50; // Rough measure of specificity
        maxConfidence = Math.max(maxConfidence, Math.min(0.9, 0.6 + complexity));
      }
    }
    
    return maxConfidence || 0.3;
  }

  private async generateResponse(
    message: string, 
    intent: string, 
    request: ChatbotRequest
  ): Promise<Omit<ChatbotResponse, 'intent' | 'confidence'>> {
    switch (intent) {
      case 'greeting':
        return {
          message: this.getRandomTemplate('greeting'),
        };

      case 'search_products':
        return await this.handleProductSearch(message, request);

      case 'navigate_catalog':
        return {
          message: this.getRandomTemplate('navigation_help'),
          navigation: { path: '/catalog', label: 'Browse All Products' },
        };

      case 'navigate_men':
        return {
          message: "I'll take you to our men's collection! Check out our latest footwear for men.",
          navigation: { path: '/men', label: "Shop Men's Footwear" },
        };

      case 'navigate_women':
        return {
          message: "Here's our women's collection! Discover amazing footwear for women.",
          navigation: { path: '/women', label: "Shop Women's Footwear" },
        };

      case 'view_cart':
        return {
          message: this.getRandomTemplate('cart_help'),
          navigation: { path: '/cart', label: 'View Your Cart' },
        };

      case 'add_to_cart':
        return await this.handleAddToCartRequest(message, request);

      case 'check_order':
        return await this.handleOrderInquiry(message, request);

      case 'account_info':
        return {
          message: this.getRandomTemplate('account_help'),
          navigation: { path: '/profile', label: 'Go to Profile' },
        };

      case 'credits_info':
        return {
          message: "Check your MONTEVELORIS credits and see how you can earn more rewards!",
          navigation: { path: '/credits', label: 'View Credits' },
        };

      case 'get_help':
        return {
          message: "I'm here to help! I can assist with product discovery, sizing, account questions, and more. If you need additional support, I can connect you with our customer service team.",
          context: {
            helpOptions: [
              'Product search and recommendations',
              'Size and fit guidance', 
              'Account and login help',
              'Credit system questions',
              'General shopping assistance'
            ],
            supportEscalation: true
          }
        };

      case 'contact_support':
        return {
          message: "I'll help you get in touch with our support team! Here are your options:",
          context: {
            supportOptions: [
              {
                type: 'email',
                title: 'Email Support',
                description: 'Get help via email - usually responds within 24 hours',
                action: 'mailto:support@monteveloris.store?subject=Customer Support Request'
              },
              {
                type: 'shopify',
                title: 'Shopify Help Center',
                description: 'Access order help, returns, and account support',
                action: 'https://help.shopify.com/en/customers'
              },
              {
                type: 'account',
                title: 'Account Dashboard',
                description: 'View orders, track shipments, and manage returns',
                action: '/profile'
              },
              {
                type: 'phone',
                title: 'Phone Support',
                description: 'Call us during business hours: Mon-Fri 9AM-6PM',
                action: 'tel:+1-800-MONTEVELORIS-HELP'
              }
            ],
            escalated: true
          }
        };

      case 'price_inquiry':
        return await this.handlePriceInquiry(message, request);

      case 'size_inquiry':
        return await this.handleSizeInquiry(message, request);

      case 'availability':
        return await this.handleAvailabilityCheck(message, request);

      default:
        return await this.handleProductSearch(message, request);
    }
  }

  private async handleProductSearch(
    message: string,
    request: ChatbotRequest
  ): Promise<Omit<ChatbotResponse, 'intent' | 'confidence'>> {
    try {
      // Extract search terms from message
      const searchTerms = this.extractSearchTerms(message);
      console.log('Regular search - Original message:', message);
      console.log('Regular search - Extracted terms:', searchTerms);
      const cacheKey = searchTerms.join('_');
      
      // Check cache first
      let products = this.getCachedProducts(cacheKey);
      
      if (!products) {
        // Search for products
        if (searchTerms.length > 0) {
          const searchQuery = searchTerms.join(' ');
          console.log('Regular search - Search query:', searchQuery);
          products = await searchProducts(searchQuery);
          console.log('Regular search - Results found:', products.length);
        } else {
          // Fallback to featured products
          console.log('Regular search - No terms, using getAllProducts');
          products = await getAllProducts(8);
        }
        
        this.setCachedProducts(cacheKey, products);
      }

      if (products.length > 0) {
        const responseMessage = `${this.getRandomTemplate('search_products')} Found ${products.length} result${products.length > 1 ? 's' : ''}:`;
        
        // Limit to top 5 products for chat display
        const displayProducts = products.slice(0, 5);
        
        return {
          message: responseMessage,
          products: displayProducts,
          context: {
            lastSearchQuery: searchTerms.join(' '),
            searchResults: products.length,
          },
        };
      } else {
        // No products found, try broader search or show popular items
        const fallbackProducts = await getAllProducts(4);
        
        return {
          message: this.getRandomTemplate('no_products_found'),
          products: fallbackProducts,
          context: {
            lastSearchQuery: searchTerms.join(' '),
            searchResults: 0,
          },
        };
      }
    } catch (error) {
      console.error('Product search error:', error);
      return {
        message: "I'm having trouble searching right now. Please try browsing our catalog instead.",
        navigation: { path: '/catalog', label: 'Browse Catalog' },
      };
    }
  }

  private async handleOrderInquiry(
    message: string,
    request: ChatbotRequest
  ): Promise<Omit<ChatbotResponse, 'intent' | 'confidence'>> {
    return {
      message: "I can help you check your order status! Please log in to view your recent orders and tracking information.",
      navigation: { path: '/profile', label: 'View Orders' },
    };
  }

  private async handlePriceInquiry(
    message: string,
    request: ChatbotRequest
  ): Promise<Omit<ChatbotResponse, 'intent' | 'confidence'>> {
    // Extract price range if mentioned
    const priceMatch = message.match(/\$?(\d+)/);
    if (priceMatch) {
      const maxPrice = parseInt(priceMatch[1]);
      
      try {
        // Get products and filter by price
        const allProducts = await getAllProducts(20);
        const affordableProducts = allProducts.filter(product => {
          const price = parseFloat(product.priceRange.minVariantPrice.amount);
          return price <= maxPrice;
        });

        if (affordableProducts.length > 0) {
          return {
            message: `Great! I found ${affordableProducts.length} footwear under $${maxPrice}:`,
            products: affordableProducts.slice(0, 5),
          };
        } else {
          return {
            message: `I don't have any footwear under $${maxPrice} right now, but here are some great value options:`,
            products: allProducts.slice(0, 3),
          };
        }
      } catch (error) {
        return {
          message: "Let me help you find footwear in your price range! Check out our catalog with price filters.",
          navigation: { path: '/catalog', label: 'Browse by Price' },
        };
      }
    }

    return {
      message: "I can help you find footwear in your budget! What's your price range?",
      navigation: { path: '/catalog', label: 'Browse All Prices' },
    };
  }

  private async handleSizeInquiry(
    message: string,
    request: ChatbotRequest
  ): Promise<Omit<ChatbotResponse, 'intent' | 'confidence'>> {
    const sizeMatch = message.match(/size\s*(\d+(?:\.\d+)?)/i);
    
    if (sizeMatch) {
      const size = sizeMatch[1];
      return {
        message: `I'll help you find footwear in size ${size}! Most of our products have detailed size information on their individual pages.`,
        navigation: { path: '/catalog', label: `Shop Size ${size}` },
      };
    }

    return {
      message: "I can help you with sizing! Each product page has detailed size charts and fit information. What size are you looking for?",
      navigation: { path: '/catalog', label: 'Browse Products' },
    };
  }

  private async handleAvailabilityCheck(
    message: string,
    request: ChatbotRequest
  ): Promise<Omit<ChatbotResponse, 'intent' | 'confidence'>> {
    return {
      message: "I can help you check what's available! All our in-stock items are shown in the catalog with real-time availability.",
      navigation: { path: '/catalog', label: 'Check Availability' },
    };
  }

  private async handleAddToCartRequest(
    message: string,
    request: ChatbotRequest
  ): Promise<Omit<ChatbotResponse, 'intent' | 'confidence'>> {
    try {
      // Check if user is asking to add a specific product they mentioned
      const productTerms = this.extractSearchTerms(message);
      console.log('Add to cart - Original message:', message);
      console.log('Add to cart - Extracted terms:', productTerms);
      
      if (productTerms.length > 0) {
        // Search for products matching their request
        let products: ShopifyProduct[] = [];
        const searchQuery = productTerms.join(' ');
        console.log('Add to cart - Search query:', searchQuery);
        
        try {
          products = await searchProducts(searchQuery);
          console.log('Add to cart - Search results:', products.length, 'products found');
          
          if (products.length === 0) {
            // Try searching for individual terms
            for (const term of productTerms) {
              console.log('Add to cart - Trying individual term:', term);
              products = await searchProducts(term);
              if (products.length > 0) {
                console.log('Add to cart - Found results with term:', term, products.length, 'products');
                break;
              }
            }
            
            // If still no results, only then use getAllProducts as absolute fallback
            if (products.length === 0) {
              console.log('Add to cart - No search results, using fallback products');
              products = await getAllProducts(8);
            }
          }
        } catch (error) {
          console.error('Product search error in add to cart:', error);
          products = await getAllProducts(8);
        }

        if (products.length > 0) {
          const displayProducts = products.slice(0, 3);
          
          return {
            message: "Great! I found these products for you. Click 'Add to Cart' on any product you'd like:",
            products: displayProducts,
            context: {
              lastSearchQuery: searchQuery,
              searchResults: products.length,
              addToCartRequest: true,
            },
          };
        }
      }
      
      // If no specific product mentioned or found, show popular products
      const popularProducts = await getAllProducts(6);
      
      return {
        message: "I'd love to help you add items to your cart! Here are some popular products you might like:",
        products: popularProducts.slice(0, 3),
        context: {
          addToCartRequest: true,
        },
      };
      
    } catch (error) {
      console.error('Add to cart request error:', error);
      return {
        message: "I can help you add items to your cart! Let me show you our popular products, or you can browse our catalog.",
        navigation: { path: '/catalog', label: 'Browse Products' },
      };
    }
  }

  private extractSearchTerms(message: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'show', 'find', 'get', 'want', 'need', 'looking', 'search', 'add', 'cart', 'put', 'place', 'these', 'them', 'this', 'that', 'some', 'any'];
    
    const cleanMessage = message.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanMessage.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));
    
    // Add specific product-related terms
    const productTerms = [];
    
    // Color detection
    const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];
    words.forEach(word => {
      if (colors.includes(word)) productTerms.push(word);
    });
    
    // Brand detection
    const brands = ['nike', 'adidas', 'jordan', 'puma', 'reebok', 'converse', 'vans'];
    words.forEach(word => {
      if (brands.includes(word)) productTerms.push(word);
    });
    
    // Product type detection - common footwear/shoe terms
    const productTypes = ['footwear', 'shoes', 'shoe', 'boots', 'boot', 'runners', 'running', 'basketball', 'tennis', 'casual', 'athletic', 'sports', 'trainers', 'trainer', 'socks', 'sock'];
    words.forEach(word => {
      if (productTypes.includes(word)) productTerms.push(word);
    });
    
    // Category detection
    const categories = ['running', 'athletic', 'sports', 'basketball', 'tennis', 'casual', 'formal', 'footwear', 'shoes'];
    words.forEach(word => {
      if (categories.includes(word)) productTerms.push(word);
    });
    
    // Return unique terms
    return [...new Set([...productTerms, ...words.slice(0, 3)])];
  }

  private getCachedProducts(key: string): ShopifyProduct[] | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() < expiry) {
      return this.productCache.get(key) || null;
    }
    
    // Clean up expired cache
    this.productCache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  private setCachedProducts(key: string, products: ShopifyProduct[]): void {
    this.productCache.set(key, products);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private getRandomTemplate(templateKey: keyof typeof RESPONSE_TEMPLATES): string {
    const templates = RESPONSE_TEMPLATES[templateKey];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

export const chatbotService = new ChatbotService();
