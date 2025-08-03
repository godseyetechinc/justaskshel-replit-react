import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  UserCheck, 
  Eye, 
  Stethoscope, 
  Building2, 
  Percent,
  ArrowRight,
  Shield
} from "lucide-react";
import { Link } from "wouter";

const iconMap = {
  heart: Heart,
  usercheck: UserCheck,
  eye: Eye,
  stethoscope: Stethoscope,
  building2: Building2,
  percent: Percent,
};

const insuranceDetails = {
  "Life Insurance": {
    icon: "heart",
    color: "text-primary",
    hoverColor: "hover:bg-primary hover:text-white",
    startingPrice: "$12",
    coverage: "$1M+",
    description: "Protect your loved ones' financial future with comprehensive life insurance coverage options.",
  },
  "Health Insurance": {
    icon: "stethoscope", 
    color: "text-green-600",
    hoverColor: "hover:bg-green-600 hover:text-white",
    startingPrice: "$89",
    coverage: "$1,000 deductible",
    description: "Comprehensive health coverage including medical, prescription, and preventive care benefits.",
  },
  "Dental Insurance": {
    icon: "usercheck",
    color: "text-purple-600", 
    hoverColor: "hover:bg-purple-600 hover:text-white",
    startingPrice: "$15",
    coverage: "$2,000 annual max",
    description: "Complete dental coverage including cleanings, fillings, and major dental procedures.",
  },
  "Vision Insurance": {
    icon: "eye",
    color: "text-blue-600",
    hoverColor: "hover:bg-blue-600 hover:text-white", 
    startingPrice: "$8",
    coverage: "$150 frame allowance",
    description: "Eye care coverage including exams, glasses, contacts, and vision correction procedures.",
  },
  "Hospital Indemnity": {
    icon: "building2",
    color: "text-red-600",
    hoverColor: "hover:bg-red-600 hover:text-white",
    startingPrice: "$25", 
    coverage: "$100-$500 daily",
    description: "Cash benefits for hospital stays to help cover expenses not covered by major medical insurance.",
  },
  "Discount Health Plans": {
    icon: "percent",
    color: "text-green-600",
    hoverColor: "hover:bg-green-600 hover:text-white",
    startingPrice: "$19",
    coverage: "10-60% savings",
    description: "Access discounted rates on medical, dental, vision, and prescription services nationwide.",
  },
};

export default function InsuranceTypesGrid() {
  const { data: insuranceTypes, isLoading } = useQuery({
    queryKey: ["/api/insurance-types"],
  });

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Insurance Coverage Options
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive range of insurance products designed to protect you and your family
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-80 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {insuranceTypes?.map((type) => {
              const details = insuranceDetails[type.name as keyof typeof insuranceDetails];
              if (!details) return null;
              
              const IconComponent = iconMap[details.icon as keyof typeof iconMap] || Shield;
              
              return (
                <Card key={type.id} className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
                  <CardHeader className="text-center">
                    <div className={`${details.color} text-4xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit`}>
                      <IconComponent className="h-12 w-12" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900 mb-3">
                      {type.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <p className="text-gray-600 mb-6">
                      {details.description}
                    </p>
                    
                    <div className="text-sm text-gray-500 space-y-2">
                      <div className="flex justify-between">
                        <span>Starting at:</span>
                        <span className={`font-semibold ${details.color}`}>
                          {details.startingPrice}/month
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coverage:</span>
                        <span className="font-semibold">
                          {details.coverage}
                        </span>
                      </div>
                    </div>

                    <Link href="/quotes">
                      <Button 
                        className={`w-full bg-gray-100 text-gray-700 font-medium transition-all duration-300 ${details.hoverColor}`}
                      >
                        Get Quotes
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
