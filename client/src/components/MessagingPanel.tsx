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
import { CURRENT_AGENT, Client } from "@/lib/mockData";

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
  client: Client;
  propertyAddress: string;
}

// Initial mock messages
const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg_1",
    senderId: "a1",
    senderName: CURRENT_AGENT.name,
    senderAvatar: CURRENT_AGENT.avatar,
    content: "Hello! I wanted to follow up on the required documents for your property transaction.",
    timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
    isAgent: true,
  },
  {
    id: "msg_2",
    senderId: "c1",
    senderName: "Client",
    senderAvatar: "",
    content: "Hi James, thank you for reaching out. I've uploaded the proof of ID. Working on getting the other documents ready.",
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    isAgent: false,
  },
  {
    id: "msg_3",
    senderId: "a1",
    senderName: CURRENT_AGENT.name,
    senderAvatar: CURRENT_AGENT.avatar,
    content: "That's great! I've approved the ID. Please let me know if you need any clarification on the remaining documents.",
    timestamp: new Date(Date.now() - 3600000 * 4), // 4 hours ago
    isAgent: true,
  },
];

export function MessagingPanel({ isOpen, onClose, client, propertyAddress }: MessagingPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => 
    INITIAL_MESSAGES.map(m => ({
      ...m,
      senderName: m.isAgent ? CURRENT_AGENT.name : client.name,
      senderAvatar: m.isAgent ? CURRENT_AGENT.avatar : client.avatar,
    }))
  );
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

    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: CURRENT_AGENT.id,
      senderName: CURRENT_AGENT.name,
      senderAvatar: CURRENT_AGENT.avatar,
      content: newMessage.trim(),
      timestamp: new Date(),
      isAgent: true,
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
              <AvatarImage src={client.avatar} />
              <AvatarFallback>{client.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">{client.name}</h3>
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
                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        message.isAgent ? "justify-end" : "justify-start"
                      )}
                    >
                      {!message.isAgent && (
                        <Avatar className="h-8 w-8 border border-border mt-1">
                          <AvatarImage src={message.senderAvatar} />
                          <AvatarFallback className="text-xs">{message.senderName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "max-w-[75%] flex flex-col",
                        message.isAgent ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm",
                          message.isAgent
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

                      {message.isAgent && (
                        <Avatar className="h-8 w-8 border border-border mt-1">
                          <AvatarImage src={message.senderAvatar} />
                          <AvatarFallback className="text-xs">{message.senderName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
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
