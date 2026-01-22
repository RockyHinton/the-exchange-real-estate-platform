import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isAgent: boolean;
}

interface MessagingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientInfo;
  propertyAddress: string;
  currentUserType?: 'agent' | 'client';
}

const AGENT_PLACEHOLDER = { id: "agent", name: "Your Agent" };

export function MessagingPanel({ isOpen, onClose, client, propertyAddress, currentUserType = 'agent' }: MessagingPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const isAgent = currentUserType === 'agent';
    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: isAgent ? AGENT_PLACEHOLDER.id : client.id,
      senderName: isAgent ? AGENT_PLACEHOLDER.name : client.name,
      senderAvatar: undefined,
      content: newMessage.trim(),
      timestamp: new Date(),
      isAgent: isAgent,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach(message => {
    const dateKey = format(message.timestamp, "yyyy-MM-dd");
    const displayDate = format(message.timestamp, "EEEE, d MMMM yyyy");
    const existing = groupedMessages.find(g => g.date === dateKey);
    if (existing) {
      existing.messages.push(message);
    } else {
      groupedMessages.push({ date: displayDate, messages: [message] });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback>{currentUserType === 'agent' ? client.name.substring(0, 2) : 'AG'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">
                {currentUserType === 'agent' ? client.name : AGENT_PLACEHOLDER.name}
              </h3>
              <p className="text-xs text-muted-foreground">{propertyAddress}</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 bg-slate-50">
          <div className="p-4 space-y-6">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date Divider */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white text-xs text-muted-foreground px-3 py-1 rounded-full border shadow-sm">
                    {group.date}
                  </div>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-3">
                  {group.messages.map((message) => {
                    // Determine if this message is from "me" or "them"
                    const isMe = (currentUserType === 'agent' && message.isAgent) || 
                                 (currentUserType === 'client' && !message.isAgent);
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isMe && (
                          <Avatar className="h-8 w-8 border border-border mt-1">
                            <AvatarImage src={message.senderAvatar} />
                            <AvatarFallback className="text-xs">{message.senderName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "max-w-[75%] flex flex-col",
                          isMe ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-sm",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-white border border-border/60 text-foreground rounded-bl-md shadow-sm"
                          )}>
                            {message.content}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 px-1">
                            <span className="text-[10px] text-muted-foreground">
                              {format(message.timestamp, "h:mm a")}
                            </span>
                          </div>
                        </div>

                        {isMe && (
                          <Avatar className="h-8 w-8 border border-border mt-1">
                            <AvatarImage src={message.senderAvatar} />
                            <AvatarFallback className="text-xs">{message.senderName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-slate-50 border-border/60"
            />
            <Button 
              onClick={handleSend} 
              disabled={!newMessage.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
