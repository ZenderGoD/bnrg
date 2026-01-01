// Admin chatbot service with vision capabilities and function calling using OpenAI SDK
import OpenAI from 'openai';
import type { Id } from '../../convex/_generated/dataModel';

interface ProductData {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  collection?: 'mens-collection' | 'womens-collection' | 'kids-collection';
  tags?: string[];
  brand?: string;
  color?: string;
  variants?: Array<{
    title: string;
    price: number;
    quantity: number;
    availableForSale: boolean;
  }>;
}

interface VisionResponse {
  extractedData?: Partial<ProductData>;
  message: string;
  needsMoreInfo?: string[];
  isComplete?: boolean;
}

// Tool function types
type ToolFunction = (args: any) => Promise<any>;

class AdminChatbotService {
  private openai: OpenAI | null = null;
  private apiKey: string;
  private toolFunctions: Map<string, ToolFunction> = new Map();

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found');
    }
  }

  // Register tool functions
  registerTool(name: string, fn: ToolFunction) {
    this.toolFunctions.set(name, fn);
  }

  private getClient(): OpenAI {
    if (!this.openai && typeof window !== 'undefined') {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MONTEVELORIS Admin Assistant',
        },
      });
    }
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    return this.openai;
  }

  // Convert image file to base64
  private async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getMimeType(file: File): string {
    return file.type || 'image/jpeg';
  }

  // Analyze product image and extract data
  async analyzeProductImage(
    imageFile: File,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    existingData?: Partial<ProductData>
  ): Promise<VisionResponse> {
    try {
      const base64Image = await this.imageToBase64(imageFile);
      const mimeType = this.getMimeType(imageFile);

      const systemPrompt = `You are banerjee.boy, an AI admin assistant for MONTEVELORIS sneaker store. Your job is to extract product information from images and help fill out product forms.

When analyzing product images, extract:
- Product name/title (e.g., "Nike Air Max 90", "Adidas Ultraboost")
- Brand (Nike, Adidas, Jordan, Puma, Reebok, Converse, Vans, etc.)
- Color
- Category (premium-lifestyle, athletic-performance, street-fashion, limited-edition-hype, retro-classics)
- Collection (mens-collection, womens-collection, kids-collection - infer from style)
- Estimated price range (in INR)
- Description (style, features, target use)
- Tags (relevant keywords)

If you can't determine something, mention what you need. Be conversational and helpful.

Available categories:
- premium-lifestyle
- athletic-performance  
- street-fashion
- limited-edition-hype
- retro-classics

Available collections:
- mens-collection
- womens-collection
- kids-collection

Return your response as JSON with this structure:
{
  "extractedData": {
    "title": "...",
    "description": "...",
    "price": number,
    "category": "...",
    "collection": "...",
    "tags": ["..."],
    "brand": "...",
    "color": "..."
  },
  "message": "Friendly message explaining what you found",
  "needsMoreInfo": ["what you need"],
  "isComplete": false
}`;

      const response = await this.getClient().chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: existingData 
                  ? `Here's an updated image. Previous data: ${JSON.stringify(existingData)}. Analyze this product image and extract/update the product information.`
                  : 'This is a new product image. Please analyze it and extract all the product information you can see.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Try to extract JSON from response
      let extractedResponse: VisionResponse;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          extractedResponse = {
            extractedData: parsed.extractedData || {},
            message: parsed.message || content,
            needsMoreInfo: parsed.needsMoreInfo || [],
            isComplete: parsed.isComplete || false
          };
        } else {
          throw new Error('No JSON found');
        }
      } catch {
        const extractedData: Partial<ProductData> = {};
        const titleMatch = content.match(/(?:title|name)[:：]?\s*([^\n]+)/i);
        if (titleMatch) extractedData.title = titleMatch[1].trim();
        const priceMatch = content.match(/(?:price|₹|INR)[:：]?\s*([\d,]+)/i);
        if (priceMatch) extractedData.price = parseFloat(priceMatch[1].replace(/,/g, ''));
        
        extractedResponse = {
          message: content,
          extractedData,
          needsMoreInfo: [],
          isComplete: false
        };
      }

      return extractedResponse;

    } catch (error) {
      console.error('AdminChatbotService Error:', error);
      return {
        message: 'Sorry, I had trouble analyzing the image. Please try again or provide details manually.',
        extractedData: {},
        needsMoreInfo: [],
        isComplete: false
      };
    }
  }

  // Ask follow-up questions with function calling
  async askFollowUpQuestion(
    question: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    currentData?: Partial<ProductData>,
    tools?: {
      getProducts?: (query: string) => Promise<any[]>;
      getProductById?: (id: string) => Promise<any>;
      searchProducts?: (query: string) => Promise<any[]>;
      updateProduct?: (id: string, data: any) => Promise<void>;
    }
  ): Promise<{ 
    message: string; 
    extractedData?: Partial<ProductData>;
    action?: 'updateHero' | 'updateCategoryCard' | 'addCategoryCard' | 'deleteCategoryCard';
    actionData?: {
      videos?: string[];
      heroImage?: string;
      categoryCard?: {
        id?: string;
        title: string;
        handle: string;
        image: string;
        description?: string;
        order?: number;
      };
    };
    toolCalls?: Array<{ name: string; args: any; result?: any }>;
  }> {
    try {
      const systemPrompt = `You are banerjee.boy, an AI admin assistant for MONTEVELORIS sneaker store. You can help with:

1. **Product Management:**
   - Search and find existing products
   - Get product details by ID or name
   - Update product information (title, description, price, images, variants, tags, category)
   - Add or remove images from products
   - **CREATE NEW PRODUCTS** - Extract product details from user descriptions and images

2. **Homepage Management:**
   - Update hero video/image
   - Add/update/delete category cards (the 4 cards below hero)

3. **General Assistance:**
   - Answer questions about products, orders, users
   - Help with admin tasks

**CRITICAL: Product Creation from Text:**
When a user provides product details in text (e.g., "product named 'green alpha' price 2200 rupees with 10% discount"), you MUST:
1. Extract ALL product information from the text:
   - Title/name (e.g., "green alpha", "Green Alpha")
   - Price (calculate final price if discount mentioned: 2200 with 10% discount = 1980)
   - Brand (if mentioned, e.g., "MONTEVELORIS")
   - Category (infer from context: premium-lifestyle, athletic-performance, street-fashion, limited-edition-hype, retro-classics)
   - Collection (infer: mens-collection, womens-collection, kids-collection)
   - Description (create from context)
   - Tags (extract keywords)
   - Discount percentage (if mentioned)

2. Return this data in the extractedData field as JSON:
{
  "extractedData": {
    "title": "Green Alpha",
    "price": 1980,  // Calculate: 2200 - (2200 * 0.10) = 1980
    "brand": "MONTEVELORIS",
    "category": "street-fashion",  // or appropriate category
    "collection": "mens-collection",  // or appropriate collection
    "description": "Green Alpha sneakers from MONTEVELORIS",
    "tags": ["green", "alpha", "bnrg", "sneakers"]
  }
}

3. If images were uploaded, combine the image analysis with text input.

**IMPORTANT:** Always use the available tools/functions when the user asks about EXISTING products. For example:
- "Show me Nike products" → use searchProducts
- "Get product details for [name]" → use searchProducts then getProductById
- "Update product [id] price to 5000" → use updateProduct
- "Add image to product [id]" → use updateProduct with images array

But when user describes a NEW product or provides product details, extract the data and return it in extractedData - DO NOT use tools for new product creation.

Be conversational, helpful, and proactive. When user provides product details, acknowledge what you extracted and confirm the information.`;

      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'searchProducts',
            description: 'Search for products by name, brand, category, or any search term. Returns array of products.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query - can be product name, brand, category, etc.'
                }
              },
              required: ['query']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'getProductById',
            description: 'Get detailed information about a specific product by its ID',
            parameters: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Product ID'
                }
              },
              required: ['id']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'updateProduct',
            description: 'Update product information. Can update title, description, price, images (add/remove), variants, tags, category, etc.',
            parameters: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Product ID to update'
                },
                title: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                images: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      url: { type: 'string' },
                      altText: { type: 'string' }
                    }
                  },
                  description: 'Array of image objects. To add images, include existing + new. To remove, exclude the ones to remove.'
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' }
                },
                category: { type: 'string' },
                collection: { type: 'string' }
              },
              required: ['id']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'getAllProducts',
            description: 'Get all products, optionally filtered by collection or category',
            parameters: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Maximum number of products to return' },
                collection: { type: 'string' },
                category: { type: 'string' }
              }
            }
          }
        }
      ];

      // Check if this is a product creation request (user describing a new product)
      const lowerQuestion = question.toLowerCase();
      const isProductCreation = 
        (lowerQuestion.includes('product') && (lowerQuestion.includes('named') || lowerQuestion.includes('name') || lowerQuestion.includes('price'))) ||
        (lowerQuestion.match(/\d+\s*(?:rupees?|₹|inr)/i) && (lowerQuestion.includes('named') || lowerQuestion.includes('name'))) ||
        (currentData && Object.keys(currentData).length > 0 && (lowerQuestion.includes('price') || lowerQuestion.includes('discount')));

      const response = await this.getClient().chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          })),
          { 
            role: 'user', 
            content: isProductCreation 
              ? `${question}\n\nIMPORTANT: Extract product details from the above message and return them in JSON format with extractedData field. Do NOT use tools for new product creation.`
              : question 
          }
        ],
        tools: isProductCreation ? undefined : tools, // Don't use tools for product creation
        tool_choice: isProductCreation ? 'none' : 'auto',
        max_tokens: 1000,
        temperature: 0.7,
      });

      const message = response.choices[0]?.message;
      const toolCalls = message?.tool_calls || [];
      const toolResults: Array<{ name: string; args: any; result?: any }> = [];

      // Execute tool calls if any
      if (toolCalls.length > 0 && tools) {
        const messagesWithToolResults = [
          { role: 'system' as const, content: systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          })),
          { role: 'user' as const, content: question },
          message
        ];

        for (const toolCall of toolCalls) {
          if (toolCall.type === 'function') {
            const { name, arguments: argsStr } = toolCall.function;
            const args = JSON.parse(argsStr);
            
            try {
              let result;
              if (name === 'searchProducts' && tools.searchProducts) {
                result = await tools.searchProducts(args.query);
              } else if (name === 'getProductById' && tools.getProductById) {
                result = await tools.getProductById(args.id);
              } else if (name === 'updateProduct' && tools.updateProduct) {
                await tools.updateProduct(args.id, args);
                result = { success: true, message: 'Product updated successfully' };
              } else if (name === 'getAllProducts' && tools.getProducts) {
                result = await tools.getProducts(args.query || '');
              }
              
              toolResults.push({ name, args, result });
              messagesWithToolResults.push({
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
              });
            } catch (error) {
              console.error(`Tool ${name} error:`, error);
              toolResults.push({ name, args, result: { error: String(error) } });
              messagesWithToolResults.push({
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: String(error) })
              });
            }
          }
        }

        // Get final response with tool results
        const finalResponse = await this.getClient().chat.completions.create({
          model: 'openai/gpt-4o-mini',
          messages: messagesWithToolResults,
          max_tokens: 1000,
          temperature: 0.7,
        });

        const finalContent = finalResponse.choices[0]?.message?.content || '';
        
        // Check for homepage actions
        const lowerContent = finalContent.toLowerCase();
        let action: 'updateHero' | 'updateCategoryCard' | 'addCategoryCard' | undefined;
        let actionData: any = {};

        if (lowerContent.includes('hero')) {
          action = 'updateHero';
        } else if (lowerContent.includes('category card') || lowerContent.includes('categorycard')) {
          if (lowerContent.includes('add') || lowerContent.includes('create')) {
            action = 'addCategoryCard';
          } else {
            action = 'updateCategoryCard';
          }
        }

        return {
          message: finalContent,
          toolCalls: toolResults,
          action,
          actionData
        };
      }

      // No tool calls - parse response for actions or product data
      const content = message?.content || '';
      const lowerContent = content.toLowerCase();
      
      let action: 'updateHero' | 'updateCategoryCard' | 'addCategoryCard' | undefined;
      let actionData: any = {};
      let extractedData: Partial<ProductData> = {};

      if (lowerContent.includes('hero')) {
        action = 'updateHero';
      } else if (lowerContent.includes('category card')) {
        action = lowerContent.includes('add') ? 'addCategoryCard' : 'updateCategoryCard';
      }

      // Try to extract product data from response - check for JSON first
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.extractedData) {
            extractedData = parsed.extractedData;
          }
        }
      } catch {
        // Not JSON, try to extract from text using regex patterns
        // Extract title/name - try multiple patterns
        const titlePatterns = [
          /(?:product|named|name|title)[:：]?\s*["']?([^"'\n,]+)["']?/i,
          /["']([^"']+)["']/,
          /(?:is|are|called)\s+["']?([^"'\n,]+)["']?/i,
          /(?:named|name)\s+["']?([^"'\n,]+)["']?/i
        ];
        
        let titleMatch = null;
        for (const pattern of titlePatterns) {
          titleMatch = content.match(pattern) || question.match(pattern);
          if (titleMatch && titleMatch[1] && titleMatch[1].trim().length > 0) {
            break;
          }
        }
        
        if (titleMatch && titleMatch[1]) {
          const title = titleMatch[1].trim();
          // Filter out common words that aren't product names
          if (!['product', 'these', 'all', 'one', 'the', 'a', 'an'].includes(title.toLowerCase())) {
            extractedData.title = title.charAt(0).toUpperCase() + title.slice(1);
          }
        }
        
        // Extract price (handle discount calculations)
        const pricePatterns = [
          /(?:price|₹|INR|rupees?)[:：]?\s*([\d,]+)/i,
          /([\d,]+)\s*(?:rupees?|₹|inr)/i
        ];
        
        let priceMatch = null;
        for (const pattern of pricePatterns) {
          priceMatch = content.match(pattern) || question.match(pattern);
          if (priceMatch) break;
        }
        
        if (priceMatch) {
          let price = parseFloat(priceMatch[1].replace(/,/g, ''));
          
          // Check for discount - look in both content and question
          const discountPatterns = [
            /(\d+)%\s*(?:discount|off)/i,
            /(?:discount|off)\s+of\s+(\d+)%/i,
            /(\d+)%\s*(?:less|reduction)/i
          ];
          
          let discountMatch = null;
          for (const pattern of discountPatterns) {
            discountMatch = content.match(pattern) || question.match(pattern);
            if (discountMatch) break;
          }
          
          if (discountMatch) {
            const discountPercent = parseFloat(discountMatch[1]) / 100;
            price = price * (1 - discountPercent);
          }
          
          extractedData.price = Math.round(price);
        }
        
        // Extract brand - look for BNRG or other brands
        const brandPatterns = [
          /(?:brand)[:：]?\s*([^\n,]+)/i,
          /\b(MONTEVELORIS|Nike|Adidas|Jordan|Puma|Reebok|Converse|Vans)\b/i
        ];
        
        let brandMatch = null;
        for (const pattern of brandPatterns) {
          brandMatch = content.match(pattern) || question.match(pattern);
          if (brandMatch) break;
        }
        
        if (brandMatch) {
          extractedData.brand = brandMatch[1] ? brandMatch[1].trim() : brandMatch[0].trim();
        }
        
        // If we have title or price, we likely have product data
        if (extractedData.title || extractedData.price) {
          // Merge with current data if available
          if (currentData) {
            extractedData = { ...currentData, ...extractedData };
          }
          
          // Infer category and collection if not provided
          if (!extractedData.category) {
            extractedData.category = 'street-fashion'; // default
          }
          if (!extractedData.collection) {
            extractedData.collection = 'mens-collection'; // default
          }
          if (!extractedData.description && extractedData.title) {
            extractedData.description = `${extractedData.title}${extractedData.brand ? ` from ${extractedData.brand}` : ''} - Premium sneakers`;
          }
          if (!extractedData.tags) {
            extractedData.tags = [];
            if (extractedData.title) {
              extractedData.tags.push(...extractedData.title.toLowerCase().split(/\s+/));
            }
            if (extractedData.brand) {
              extractedData.tags.push(extractedData.brand.toLowerCase());
            }
            extractedData.tags.push('sneakers');
          }
        } else if (currentData) {
          // If no new data extracted but we have current data, use it
          extractedData = currentData;
        }
      }

      return {
        message: content,
        extractedData: Object.keys(extractedData).length > 0 ? extractedData : undefined,
        action,
        actionData
      };

    } catch (error) {
      console.error('AdminChatbotService Error:', error);
      return {
        message: 'I had trouble processing that. Could you rephrase?'
      };
    }
  }
}

export const adminChatbotService = new AdminChatbotService();
