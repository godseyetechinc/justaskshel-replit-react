import { Star, Users, Shield, Lock } from "lucide-react";
import consultationImage from "@assets/generated_images/Insurance_consultation_meeting_3b02f975.png";
import MultiStepQuoteForm from "@/components/multi-step-quote-form";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary to-primary/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Affordable Insurance
              <br />
              <span className="text-blue-200">That Fits Your Life</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto lg:mx-0">
              Compare quotes from top-rated insurers. Get expert advice. Save money on life, health, dental, vision, and hospital coverage.
            </p>
          </div>
          
          <div className="hidden lg:block">
            <img 
              src={consultationImage} 
              alt="Insurance consultation meeting" 
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
        
        <div className="mt-12">          
          {/* Multi-Step Insurance Quote Search Form */}
          <MultiStepQuoteForm />

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-blue-200">
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-400 mr-2" />
              <span>4.8/5 Rating</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <span>50K+ Happy Customers</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              <span>A+ BBB Rating</span>
            </div>
            <div className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              <span>100% Secure</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
