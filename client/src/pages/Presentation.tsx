import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Slide {
  image: string;
  section: "agent" | "client";
  title: string;
  subtitle: string;
  description: string;
}

const slides: Slide[] = [
  {
    image: "/presentation/01-login-page.png",
    section: "agent",
    title: "Welcome to The Exchange",
    subtitle: "Secure Access",
    description: "A seamless login experience for agents and clients alike. One platform, two tailored experiences.",
  },
  {
    image: "/presentation/Agent Overview.png",
    section: "agent",
    title: "Your Portfolio at a Glance",
    subtitle: "Agent Dashboard",
    description: "Monitor all properties, track document progress, and manage client relationships from a single, intuitive dashboard.",
  },
  {
    image: "/presentation/Agent Document Tracking.png",
    section: "agent",
    title: "Track Every Document",
    subtitle: "Progress Monitoring",
    description: "Real-time visibility into each client's onboarding journey. Know exactly where every tenant stands.",
  },
  {
    image: "/presentation/Agent Document Library.png",
    section: "agent",
    title: "Organised Document Library",
    subtitle: "Document Management",
    description: "Review, approve, and manage all client documents in one centralised location. No more scattered files.",
  },
  {
    image: "/presentation/Client Document Journey.png",
    section: "client",
    title: "A Clear Path Forward",
    subtitle: "Client Onboarding",
    description: "Clients see exactly what's needed. A guided journey through each stage of document submission.",
  },
  {
    image: "/presentation/Client Document Upload.png",
    section: "client",
    title: "Simple Document Upload",
    subtitle: "Effortless Submission",
    description: "Upload documents with a single click. Clear instructions and instant confirmation for peace of mind.",
  },
  {
    image: "/presentation/Client Completed Journey.png",
    section: "client",
    title: "Journey Complete",
    subtitle: "All Documents Submitted",
    description: "A satisfying confirmation that everything is in order. Clients know their application is ready for review.",
  },
  {
    image: "/presentation/Client Approved Screen.png",
    section: "client",
    title: "Welcome Home",
    subtitle: "Active Tenancy",
    description: "Once approved, clients access their personalised portal with rent schedules, property information, and direct agent communication.",
  },
];

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = slides[currentSlide];
  const agentSlides = slides.filter((s) => s.section === "agent");
  const clientSlides = slides.filter((s) => s.section === "client");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
            Product Walkthrough
          </p>
          <h1 className="text-2xl font-serif font-semibold text-slate-900">
            The Exchange
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${slide.section === "agent" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
              Agent View
            </span>
            <span className={`px-3 py-1 rounded-full ${slide.section === "client" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
              Client View
            </span>
          </div>
          <span className="text-sm text-slate-500">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-7xl flex gap-12 items-center">
          <div className="w-1/3 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm uppercase tracking-widest text-slate-500 mb-2">
                  {slide.subtitle}
                </p>
                <h2 className="text-4xl font-serif font-semibold text-slate-900 leading-tight mb-4">
                  {slide.title}
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="h-12 w-12 rounded-full border-slate-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="h-12 w-12 rounded-full border-slate-300"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="w-2/3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 to-stone-200/50 rounded-2xl transform rotate-1" />
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="relative rounded-xl shadow-2xl border border-slate-200/60 w-full"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="px-8 py-6 border-t border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 mr-2">Agent</span>
              {agentSlides.map((_, idx) => (
                <button
                  key={`agent-${idx}`}
                  onClick={() => goToSlide(idx)}
                  className="p-1"
                >
                  <Circle
                    className={`h-2.5 w-2.5 transition-colors ${
                      currentSlide === idx
                        ? "fill-slate-900 text-slate-900"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 mr-2">Client</span>
              {clientSlides.map((_, idx) => (
                <button
                  key={`client-${idx}`}
                  onClick={() => goToSlide(agentSlides.length + idx)}
                  className="p-1"
                >
                  <Circle
                    className={`h-2.5 w-2.5 transition-colors ${
                      currentSlide === agentSlides.length + idx
                        ? "fill-slate-900 text-slate-900"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
