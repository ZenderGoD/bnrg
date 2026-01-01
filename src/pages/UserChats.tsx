import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Bot, User, ArrowLeft, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ResizableAdminLayout } from '@/components/ResizableAdminLayout';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: number;
  metadata?: {
    products?: Array<{
      id: string;
      title: string;
      handle: string;
    }>;
    intent?: string;
  };
}

function formatMessageContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, lineIndex) => {
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
}

function ChatSidebar({ 
  chats, 
  selectedChatId, 
  onSelectChat 
}: { 
  chats: any[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}) {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className="h-full">
      <SidebarHeader className="border-b">
        <div className="px-4 py-3">
          <h2 className="font-semibold text-sm">User Chats</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {chats.length} conversation{chats.length !== 1 ? 's' : ''}
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-2">
            {chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  "hover:bg-accent",
                  selectedChatId === chat._id
                    ? "bg-accent border border-primary/20"
                    : ""
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {chat.title || 'New Chat'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {chat.messageCount || chat.messages?.length || 0} messages
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}

function ChatView({ chat }: { chat: any }) {
  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Select a chat to view conversation</p>
        </div>
      </div>
    );
  }

  const messages: ChatMessage[] = chat.messages || [];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-semibold text-lg">{chat.title || 'Chat Conversation'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {messages.length} messages • {new Date(chat.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages in this chat</p>
            </div>
          ) : (
            messages.map((message) => (
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
                      : 'bg-muted text-foreground rounded-tl-sm border border-border/50'
                  )}
                >
                  <div className="leading-relaxed whitespace-pre-wrap break-words">
                    {formatMessageContent(message.content)}
                  </div>
                  {message.metadata?.products && message.metadata.products.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Related products:</p>
                      {message.metadata.products.slice(0, 3).map((product) => (
                        <div key={product.id} className="text-xs">
                          • {product.title}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground/70 mt-2">
                    {new Date(message.timestamp).toLocaleString()}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border/50">
                    <User className="h-4 w-4 text-foreground/70" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function UserChats() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const user = useQuery(
    api.users.getById,
    userId ? { id: userId as Id<"users"> } : "skip"
  );

  const chats = useQuery(
    api.chats.getByUserId,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  const selectedChat = useQuery(
    api.chats.getById,
    selectedChatId ? { id: selectedChatId as Id<"chats"> } : "skip"
  );

  // Auto-select first chat if available
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0]._id);
    }
  }, [chats, selectedChatId]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid user ID</p>
      </div>
    );
  }

  if (user === undefined || chats === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <ResizableAdminLayout
        sidebar={
          <ChatSidebar
            chats={chats || []}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
          />
        }
      >
        <SidebarInset className="h-full overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="border-b p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-4 max-w-3xl mx-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex-1">
                  <h1 className="font-semibold text-lg">
                    {user?.displayName || 'User'} Chats
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {user?.email} • {(chats || []).length} conversations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatView chat={selectedChat || null} />
            </div>
          </div>
        </SidebarInset>
      </ResizableAdminLayout>
    </SidebarProvider>
  );
}

