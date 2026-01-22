import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { usePropertyMessages, useSendMessage } from "@/hooks/use-client-data";
import type { Message } from "@shared/schema";

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface MessagingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientInfo;
  propertyId: string;
  propertyAddress: string;
  currentUserType?: 'agent' | 'client';
  currentUserId?: string;
}

export function MessagingPanel({ 
  isOpen, 
  onClose, 
  client, 
  propertyId,
  propertyAddress, 
  currentUserType = 'agent',
  currentUserId
}: MessagingPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: messages = [], isLoading } = usePropertyMessages(isOpen ? propertyId : undefined);
  const sendMessageMutation = useSendMessage();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!newMessage.trim() || !propertyId) return;

    const receiverId = currentUserType === 'agent' ? client.id : client.id;
    
    try {
      await sendMessageMutation.mutateAsync({
        propertyId,
        receiverId,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((message: Message) => {
    const timestamp = new Date(message.createdAt);
    const dateKey = format(timestamp, "yyyy-MM-dd");
    const displayDate = format(timestamp, "EEEE, d MMMM yyyy");
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
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback>{currentUserType === 'agent' ? client.name.substring(0, 2) : 'AG'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">
                {currentUserType === 'agent' ? client.name : 'Your Agent'}
              </h3>
              <p className="text-xs text-muted-foreground">{propertyAddress}</p>
            </div>
          </div>
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-1 bg-slate-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground/70">Start the conversation by sending a message</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-white text-xs text-muted-foreground px-3 py-1 rounded-full border shadow-sm">
                      {group.date}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {group.messages.map((message) => {
                      const isMe = message.senderId === currentUserId;
                      const timestamp = new Date(message.createdAt);
                      
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
                              <AvatarFallback className="text-xs">
                                {currentUserType === 'agent' ? client.name.substring(0, 2) : 'AG'}
                              </AvatarFallback>
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
                                {format(timestamp, "h:mm a")}
                              </span>
                            </div>
                          </div>

                          {isMe && (
                            <Avatar className="h-8 w-8 border border-border mt-1">
                              <AvatarFallback className="text-xs">Me</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-slate-50 border-border/60"
              data-testid="input-message"
            />
            <Button 
              onClick={handleSend} 
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              size="icon"
              className="shrink-0"
              data-testid="button-send-message"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
