import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Wifi, Trash2, Phone, FileText, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface WelcomeSlide {
  id: string;
  title: string;
  body: string;
  icon?: string;
  fields?: { label: string; value: string; copyable?: boolean }[];
}

interface WelcomePackProps {
  isOpen: boolean;
  onClose: () => void;
  slides: WelcomeSlide[];
}

export function WelcomePack({ isOpen, onClose, slides }: WelcomePackProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(curr => curr + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(curr => curr - 1);
    }
  };

  // Helper to map string icon names to components
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'wifi': return <Wifi className="h-12 w-12 text-primary" />;
      case 'trash': return <Trash2 className="h-12 w-12 text-primary" />;
      case 'phone': return <Phone className="h-12 w-12 text-primary" />;
      case 'info': return <Info className="h-12 w-12 text-primary" />;
      default: return <FileText className="h-12 w-12 text-primary" />;
    }
  };

  const current = slides[currentSlide];

  if (!slides || slides.length === 0 || !current) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl h-[500px] flex flex-col">
        {/* Header / Nav */}
        <div className="absolute top-4 right-4 z-50">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 relative flex flex-col">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentSlide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full"
                >
                    <div className="mb-6 p-4 bg-primary/5 rounded-full ring-8 ring-primary/5">
                        {getIcon(current.icon)}
                    </div>
                    
                    <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
                        {current.title}
                    </h2>
                    
                    <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
                        {current.body}
                    </p>

                    {current.fields && (
                        <div className="w-full max-w-sm space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {current.fields.map((field, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm group">
                                    <span className="text-muted-foreground">{field.label}</span>
                                    <span className="font-medium font-mono text-foreground flex items-center gap-2">
                                        {field.value}
                                        {field.copyable && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => navigator.clipboard.writeText(field.value)}
                                            >
                                                <span className="sr-only">Copy</span>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                            </Button>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Footer Controls */}
        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
            <Button 
                variant="ghost" 
                onClick={prevSlide} 
                disabled={currentSlide === 0}
                className={cn(currentSlide === 0 && "invisible")}
            >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <div className="flex gap-1.5">
                {slides.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            idx === currentSlide ? "w-6 bg-primary" : "w-1.5 bg-slate-300"
                        )} 
                    />
                ))}
            </div>

            <Button 
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1}
                className={cn(currentSlide === slides.length - 1 && "invisible")}
            >
                Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}