import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, RotateCcw, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useChatbot } from '@/contexts/ChatbotContext';
import { cn, formatCurrency } from '@/lib/utils';
import { isCustomerLoggedIn } from '@/lib/shopify';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'outline';
  }>;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    sendMessage,
    isLoading,
    unreadCount,
    markAsRead,
    clearMessages
  } = useChatbot();

  const isLoggedIn = isCustomerLoggedIn();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple formatting for URLs, mentions, etc.
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Chat Widget Button - Positioned in bottom right corner */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring', 
          stiffness: 260, 
          damping: 20,
          delay: 0.2 
        }}
      >
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
              "bg-[#052e16] hover:bg-[#052e16]/90",
              "text-white border border-[#052e16]/20",
              "hover:scale-110 active:scale-95",
              "group relative overflow-hidden"
            )}
            aria-label="Open MONTEVELORIS Assistant"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <MessageCircle className="h-6 w-6 relative z-10" />
          </Button>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce z-[60] border-2 border-white shadow-xl min-w-[20px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-mobile fixed bottom-24 right-6 z-50 w-96 h-[600px] sm:w-96 sm:h-[600px]"
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              opacity: { duration: 0.2 }
            }}
          >
            <Card className="h-full shadow-2xl border border-border/20 bg-background/98 backdrop-blur-md">
              <CardHeader className="pb-3 bg-gradient-to-r from-background to-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg ring-2 ring-primary/20">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background animate-pulse shadow-sm" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        MONTEVELORIS Assistant
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      </h3>
                      <div className="text-xs text-muted-foreground/80 font-medium">
                        {isTyping ? (
                          <span className="flex items-center gap-1">
                            <div className="flex space-x-0.5">
                              <div className="h-1 w-1 bg-primary rounded-full animate-bounce" />
                              <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                              <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                            </div>
                            Typing...
                          </span>
                        ) : 'Always here to help'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearMessages()}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200"
                      title="Start new conversation"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Separator className="bg-border/30" />
              </CardHeader>

              {/* Messages */}
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[440px] px-4">
                  <div className="space-y-4 py-4">
                    {messages.length === 0 && (
                      <motion.div 
                        className="text-center py-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="relative mb-4">
                          <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                            <Bot className="h-8 w-8 text-primary-foreground" />
                          </div>
                          <div className="absolute -bottom-1 -right-6 mx-auto">
                            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                          </div>
                        </div>
                        <h4 className="font-bold text-lg text-foreground mb-3 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                          Welcome to MONTEVELORIS!
                        </h4>
                        <p className="text-sm text-muted-foreground/90 max-w-xs mx-auto leading-relaxed mb-5">
                          I'm your AI shopping assistant. Ask me about sneakers, sizes, orders, or anything else!
                        </p>
                        <div className="flex flex-wrap gap-2.5 justify-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setInputValue("Show me new arrivals")}
                            className={cn(
                              "text-xs px-4 py-2 rounded-lg border-primary/20 bg-primary/5 hover:bg-primary/10",
                              "hover:border-primary/40 transition-all duration-200 shadow-sm",
                              "text-primary hover:text-primary font-medium"
                            )}
                          >
                            ✨ New Arrivals
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setInputValue("Find me running shoes")}
                            className={cn(
                              "text-xs px-4 py-2 rounded-lg border-primary/20 bg-primary/5 hover:bg-primary/10",
                              "hover:border-primary/40 transition-all duration-200 shadow-sm",
                              "text-primary hover:text-primary font-medium"
                            )}
                          >
                            🏃 Running Shoes
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          message.type === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        )}
                      >
                        {message.type === 'bot' && (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Bot className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                        
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3.5 text-sm shadow-sm border backdrop-blur-sm",
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-primary/30 rounded-br-md shadow-primary/20'
                              : 'bg-background/90 text-foreground border-border/30 rounded-bl-md hover:bg-background/95 transition-colors duration-200'
                          )}
                        >
                          <div className="leading-relaxed">{formatMessageContent(message.content)}</div>
                          
                          {/* Product images for bot messages */}
                          {message.metadata?.products && message.metadata.products.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-3 max-w-[200px]">
                              {message.metadata.products.slice(0, 4).map((product: {
                                id: string;
                                title: string;
                                handle: string;
                                images?: {
                                  edges?: Array<{
                                    node?: {
                                      url: string;
                                      altText?: string | null;
                                    };
                                  }>;
                                };
                              }, productIndex: number) => (
                                <div key={productIndex} className="relative group cursor-pointer" onClick={() => {
                                  console.log('Image click - navigating to:', product.handle, product.title);
                                  if (product.handle) {
                                    window.location.href = `/product/${product.handle}`;
                                  } else {
                                    window.location.href = '/catalog';
                                  }
                                }}>
                                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                    {product.images?.edges?.[0]?.node?.url ? (
                                      <img 
                                        src={product.images.edges[0].node.url} 
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Sparkles className="h-6 w-6" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors duration-200" />
                                  <div className="mt-1 text-xs font-medium text-foreground/80 truncate">{product.title}</div>
                                  <div className="text-xs text-primary font-semibold">
                                    {formatCurrency(parseFloat(product.priceRange?.minVariantPrice?.amount || '0'), "INR")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action buttons for bot messages */}
                          {message.actions && message.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {message.actions.map((action, actionIndex) => (
                                <Button
                                  key={actionIndex}
                                  variant={action.variant === 'default' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={action.action}
                                  className={cn(
                                    "h-8 text-xs transition-all duration-200",
                                    action.variant === 'default' 
                                      ? 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20' 
                                      : 'hover:bg-muted'
                                  )}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>

                        {message.type === 'user' && (
                          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                            <User className="h-4 w-4 text-accent-foreground" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <motion.div 
                        className="flex gap-3 max-w-[85%] mr-auto"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3 border border-border shadow-sm">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-border/20 bg-gradient-to-r from-background to-muted/20">
                {/* Input Row */}
                <div className="p-4">
                  <div className="flex space-x-3">
                    <div className="relative flex-1">
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about sneakers, orders, or anything..."
                        disabled={isLoading}
                        className={cn(
                          "h-11 pr-14 bg-background/80 backdrop-blur-sm border-border/30 rounded-xl",
                          "focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                          "transition-all duration-200 shadow-sm",
                          "placeholder:text-muted-foreground/60"
                        )}
                      />
                      {!isLoggedIn && inputValue.toLowerCase().includes('cart') && (
                        <div className="absolute -top-10 left-0 right-0 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/30 text-center shadow-sm">
                          Please log in to add items to cart
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="sm"
                      className={cn(
                        "h-11 w-11 rounded-xl bg-gradient-to-r from-primary to-primary/90",
                        "border border-primary/20 shadow-sm transition-all duration-200",
                        !inputValue.trim() || isLoading 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:scale-105 hover:shadow-md active:scale-95 hover:from-primary/90 hover:to-primary'
                      )}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Quick Actions - Below input */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border/10">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setInputValue("I need help with something")}
                      className={cn(
                        "h-8 px-3 text-xs rounded-lg border border-border/20 bg-background/50 backdrop-blur-sm",
                        "hover:bg-primary/5 hover:border-primary/30 hover:text-primary",
                        "transition-all duration-200 shadow-sm"
                      )}
                    >
                      <HelpCircle className="h-3 w-3 mr-1.5" />
                      Help
                    </Button>
                    {messages.length > 2 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => clearMessages()}
                        className={cn(
                          "h-8 px-3 text-xs rounded-lg border border-border/20 bg-background/50 backdrop-blur-sm",
                          "hover:bg-destructive/5 hover:border-destructive/30 hover:text-destructive",
                          "transition-all duration-200 shadow-sm"
                        )}
                      >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        New Chat
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile responsiveness */}
      <style>{`
        @media (max-width: 640px) {
          .chatbot-mobile {
            width: calc(100vw - 1rem) !important;
            right: 0.5rem !important;
            left: 0.5rem !important;
            bottom: 1rem !important;
            height: calc(100vh - 2rem) !important;
          }
        }
      `}</style>
    </>
  );
}
