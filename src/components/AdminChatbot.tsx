import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, RotateCcw, Upload, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { adminChatbotService } from '@/lib/adminChatbotService';
import { useAdmin } from '@/contexts/AdminContext';
import { useMutation, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { sanitizeConvexError } from '@/lib/errorHandler';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';

interface AdminMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

// Estimate tokens (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const MAX_CONTEXT_TOKENS = 8000; // Conservative limit for conversation context

export function AdminChatbot() {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImages, setPendingImages] = useState<Array<{ file: File; url: string }>>([]);
  const [extractedProductData, setExtractedProductData] = useState<Partial<{
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    collection?: 'mens-collection' | 'womens-collection' | 'kids-collection';
    tags?: string[];
    brand?: string;
    color?: string;
  }> | null>(null);
  
  const { updateProductFormData, openAddDialog, productFormData } = useAdmin();
  const convex = useConvex();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const updateHeroMutation = useMutation(api.homepage.updateHero);
  const upsertCategoryCardMutation = useMutation(api.homepage.upsertCategoryCard);
  const updateProductMutation = useMutation(api.products.update);

  // Calculate context usage
  const contextUsage = useMemo(() => {
    // Count tokens from last 6 messages (conversation history)
    const recentMessages = messages.slice(-6);
    const totalTokens = recentMessages.reduce((sum, msg) => {
      return sum + estimateTokens(msg.content) + (msg.imageUrl ? 500 : 0); // Images use more tokens
    }, 0);
    
    const percentage = Math.min((totalTokens / MAX_CONTEXT_TOKENS) * 100, 100);
    return {
      tokens: totalTokens,
      maxTokens: MAX_CONTEXT_TOKENS,
      percentage,
    };
  }, [messages]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addMessage = (message: Omit<AdminMessage, 'id' | 'timestamp'>) => {
    const newMessage: AdminMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleImageUpload = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      addMessage({
        type: 'bot',
        content: 'Please upload image files (JPG, PNG, etc.)'
      });
      return;
    }

    // Add images to pending list (don't auto-send)
    const newPendingImages = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    
    setPendingImages(prev => [...prev, ...newPendingImages]);
    
    // Show preview message
    addMessage({
      type: 'user',
      content: `📷 Uploaded ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}. Add a message and click send to analyze.`,
      imageUrl: newPendingImages[0]?.url
    });
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && pendingImages.length === 0) || isTyping) return;

    const messageText = inputValue.trim();
    const imagesToProcess = [...pendingImages];
    
    // Clear pending images and input
    setPendingImages([]);
    setInputValue('');

    // Show user message with images
    if (imagesToProcess.length > 0) {
      addMessage({
        type: 'user',
        content: messageText || `Analyze ${imagesToProcess.length} image${imagesToProcess.length > 1 ? 's' : ''}`,
        imageUrl: imagesToProcess[0]?.url
      });
    } else {
      addMessage({
        type: 'user',
        content: messageText
      });
    }
    
    setIsTyping(true);

    try {
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      // Process images first if any
      if (imagesToProcess.length > 0) {
        for (const { file, url } of imagesToProcess) {
          // Clean up blob URL after processing
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          
          const response = await adminChatbotService.analyzeProductImage(
            file,
            conversationHistory,
            extractedProductData
          );

          if (response.extractedData) {
            const newData = { ...extractedProductData, ...response.extractedData };
            setExtractedProductData(newData);
            
            // Auto-fill form with extracted data
            const formData: any = {};
            if (newData.title) {
              formData.title = newData.title;
              formData.handle = generateHandle(newData.title);
            }
            if (newData.description) formData.description = newData.description;
            if (newData.price) formData.price = newData.price;
            if (newData.category) formData.category = newData.category;
            if (newData.collection) formData.collection = newData.collection;
            const tags = [...(newData.tags || [])];
            if (newData.brand) tags.push(newData.brand.toLowerCase());
            if (newData.color) tags.push(newData.color.toLowerCase());
            if (tags.length > 0) formData.tags = tags;
            updateProductFormData(formData);
          }

          addMessage({
            type: 'bot',
            content: response.message
          });

          // Ask follow-up questions if needed
          if (response.needsMoreInfo && response.needsMoreInfo.length > 0) {
            setTimeout(() => {
              addMessage({
                type: 'bot',
                content: `I need a bit more information:\n${response.needsMoreInfo.map(q => `• ${q}`).join('\n')}\n\nCan you help me fill these in?`
              });
            }, 500);
          }
        }
      }

      // Process text message with function calling
      if (messageText) {
        // Setup tool functions
        const tools = {
          searchProducts: async (query: string) => {
            const results = await convex.query(api.products.search, { query, limit: 10 });
            return results || [];
          },
          getProductById: async (id: string) => {
            try {
              const product = await convex.query(api.products.getById, { id: id as Id<"products"> });
              return product;
            } catch {
              // Try searching by name if ID fails
              const results = await convex.query(api.products.search, { query: id, limit: 5 });
              return results?.[0] || null;
            }
          },
          updateProduct: async (id: string, data: any) => {
            await updateProductMutation({ id: id as Id<"products">, ...data });
          },
          getProducts: async (query?: string) => {
            if (query) {
              return await convex.query(api.products.search, { query, limit: 20 });
            }
            return await convex.query(api.products.getAll, { limit: 100 });
          }
        };

        const response = await adminChatbotService.askFollowUpQuestion(
          messageText,
          conversationHistory,
          extractedProductData || productFormData,
          tools
        );

        // Handle tool calls results
        if (response.toolCalls && response.toolCalls.length > 0) {
          const toolResultsText = response.toolCalls.map(tc => {
            if (tc.name === 'searchProducts' && tc.result) {
              const products = tc.result as any[];
              if (products.length > 0) {
                return `Found ${products.length} product(s):\n${products.slice(0, 5).map((p: any, i: number) => `${i + 1}. ${p.title} (ID: ${p._id}) - ₹${p.price}`).join('\n')}`;
              }
              return 'No products found.';
            } else if (tc.name === 'getProductById' && tc.result) {
              const product = tc.result as any;
              if (product) {
                return `Product: ${product.title}\nPrice: ₹${product.price}\nImages: ${product.images?.length || 0}\nVariants: ${product.variants?.length || 0}`;
              }
              return 'Product not found.';
            } else if (tc.name === 'updateProduct' && tc.result) {
              return '✅ Product updated successfully!';
            }
            return '';
          }).filter(Boolean).join('\n\n');

          if (toolResultsText) {
            addMessage({
              type: 'bot',
              content: `${response.message}\n\n${toolResultsText}`
            });
          } else {
            addMessage({
              type: 'bot',
              content: response.message
            });
          }
        } else {
          addMessage({
            type: 'bot',
            content: response.message
          });
        }

        // Handle homepage actions
        if (response.action && response.actionData) {
          if (response.action === 'updateHero') {
            try {
              await updateHeroMutation(response.actionData);
              addMessage({
                type: 'bot',
                content: '✅ Hero content updated successfully! The changes will appear on the homepage.'
              });
            } catch (error) {
              const message = sanitizeConvexError(error);
              addMessage({
                type: 'bot',
                content: `❌ Error updating hero: ${message}`
              });
            }
          } else if (response.action === 'addCategoryCard' || response.action === 'updateCategoryCard') {
            if (response.actionData.categoryCard) {
              try {
                await upsertCategoryCardMutation({
                  id: response.action === 'updateCategoryCard' && response.actionData.categoryCard.id 
                    ? (response.actionData.categoryCard.id as Id<"homepageContent">)
                    : undefined,
                  title: response.actionData.categoryCard.title,
                  handle: response.actionData.categoryCard.handle,
                  image: response.actionData.categoryCard.image,
                  description: response.actionData.categoryCard.description,
                  order: response.actionData.categoryCard.order,
                  isActive: true
                });
                addMessage({
                  type: 'bot',
                  content: `✅ Category card ${response.action === 'addCategoryCard' ? 'added' : 'updated'} successfully!`
                });
              } catch (error) {
                const message = sanitizeConvexError(error);
                addMessage({
                  type: 'bot',
                  content: `❌ Error: ${message}`
                });
              }
            }
          }
        }

        // Update extracted data if any new info (product data)
        if (response.extractedData) {
          const newData = { ...extractedProductData, ...response.extractedData };
          setExtractedProductData(newData);

          // Update form
          const formData: Partial<{
            title?: string;
            handle?: string;
            description?: string;
            price?: number;
            category?: string;
            collection?: 'mens-collection' | 'womens-collection' | 'kids-collection';
            tags?: string[];
          }> = {};
          if (newData.title) {
            formData.title = newData.title;
            formData.handle = generateHandle(newData.title);
          }
          if (newData.description) formData.description = newData.description;
          if (newData.price) formData.price = newData.price;
          if (newData.category) formData.category = newData.category;
          if (newData.collection) formData.collection = newData.collection;
          if (newData.tags) formData.tags = newData.tags;
          
          updateProductFormData(formData);
        }
      }

    } catch (error) {
      console.error('Error processing message:', error);
      addMessage({
        type: 'bot',
        content: 'Sorry, I had trouble processing that. Could you rephrase?'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIndex) => {
      // Handle bold text **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={lineIndex}>
          {parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIndex} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={partIndex}>{part}</span>;
          })}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  const clearMessages = () => {
    setMessages([]);
    setExtractedProductData(null);
  };

  const refreshContext = () => {
    if (messages.length === 0) return;
    
    // Clear old messages but add a system message indicating context refresh
    setMessages([{
      id: `system_${Date.now()}`,
      type: 'bot' as const,
      content: 'Context refreshed. Starting a fresh conversation while keeping recent context.',
      timestamp: new Date(),
    }]);
    // Keep extracted product data for continuity
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        type: 'bot',
        content: `Hey! I'm banerjee.boy, your AI admin assistant! 🚀\n\nI can help you:\n\n📦 **Products**\n• Upload product images - I'll extract all details\n• Create products automatically\n• Ask me questions to fill forms\n\n🏠 **Homepage Management**\n• "Update hero video" / "Set hero image"\n• "Add category card: [title] - [description]"\n• "Update category section"\n• Manage the 4 category cards below hero\n\nJust upload images or describe what you need!`
      });
    }
  }, []);

  return (
    <Sidebar side="right" variant="floating" collapsible="offcanvas" className="h-full flex flex-col bg-transparent">
      <SidebarHeader className="border-b border-sidebar-border/50 flex-shrink-0 bg-sidebar/50 backdrop-blur-sm">
        <div className="flex flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground text-sm flex items-center gap-2">
                  banerjee.boy
                  {isTyping && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </h3>
                <p className="text-xs text-sidebar-foreground/60">
                  AI Admin Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshContext}
                className="h-8 w-8 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-all"
                title="Refresh context (keep recent messages)"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="h-8 w-8 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-all"
                title="Start new conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Context Usage Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sidebar-foreground/60">Context Usage</span>
              <span className={cn(
                "font-medium",
                contextUsage.percentage > 80 ? "text-orange-500" : 
                contextUsage.percentage > 60 ? "text-yellow-500" : 
                "text-sidebar-foreground/60"
              )}>
                {contextUsage.tokens.toLocaleString()} / {contextUsage.maxTokens.toLocaleString()} tokens
              </span>
            </div>
            <Progress 
              value={contextUsage.percentage} 
              className={cn(
                "h-1.5",
                contextUsage.percentage > 80 ? "bg-orange-500/20 [&>div]:bg-orange-500" :
                contextUsage.percentage > 60 ? "bg-yellow-500/20 [&>div]:bg-yellow-500" :
                "bg-primary/20 [&>div]:bg-primary"
              )}
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0 flex-1 min-h-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base text-sidebar-foreground mb-2">
                  How can I help you today?
                </h3>
                <p className="text-sm text-sidebar-foreground/60 max-w-sm">
                  I can help you manage products, update homepage content, and more. Just ask or upload an image!
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 group",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'bot' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm max-w-[80%]",
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-sidebar-accent text-sidebar-foreground rounded-tl-sm border border-sidebar-border/50'
                  )}
                >
                  {message.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden -mx-1">
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded product" 
                        className="w-full max-w-[280px] h-auto rounded"
                      />
                    </div>
                  )}
                  <div className="leading-relaxed whitespace-pre-wrap break-words">
                    {formatMessageContent(message.content)}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-sidebar-border/50">
                    <User className="h-4 w-4 text-sidebar-foreground/70" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-4 justify-start">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-sidebar-accent rounded-2xl rounded-tl-sm px-4 py-3 border border-sidebar-border/50">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-sidebar-foreground/40 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-sidebar-foreground/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <div className="h-2 w-2 bg-sidebar-foreground/40 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-0 flex-shrink-0 bg-sidebar/50 backdrop-blur-sm">
        <div className="p-4 max-w-3xl mx-auto w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {pendingImages.length > 0 && (
            <div className="mb-2 flex gap-2 flex-wrap">
              {pendingImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img.url} alt={`Pending ${idx + 1}`} className="h-12 w-12 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(img.url);
                      setPendingImages(prev => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative flex items-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isTyping}
              className="h-9 w-9 p-0 hover:bg-sidebar-accent border border-sidebar-border/50 rounded-lg shrink-0"
              title="Upload image"
            >
              <Upload className="h-4 w-4" />
            </Button>
            
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message banerjee.boy..."
                disabled={isTyping}
                className={cn(
                  "min-h-[44px] pr-12 py-3 bg-background/50 border-sidebar-border/50 rounded-xl",
                  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50",
                  "transition-all text-sm resize-none",
                  "placeholder:text-sidebar-foreground/50"
                )}
              />
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && pendingImages.length === 0) || isTyping}
              size="sm"
              className={cn(
                "h-[44px] w-[44px] rounded-xl shrink-0",
                (!inputValue.trim() && pendingImages.length === 0) || isTyping
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95'
              )}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-sidebar-foreground/50 mt-2 text-center">
            banerjee.boy can make mistakes. Check important info.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
