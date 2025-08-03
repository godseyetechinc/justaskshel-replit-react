import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  UserCheck, 
  Eye, 
  Stethoscope, 
  Building2, 
  Percent,
  ArrowRight,
  Shield,
  DollarSign,
  Clock
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

// Helper function to get insurance type page URLs
const getInsuranceTypeUrl = (typeName: string): string => {
  const urlMap: Record<string, string> = {
    "Life Insurance": "/life-insurance",
    "Health Insurance": "/health-insurance", 
    "Dental Insurance": "/dental-insurance",
    "Vision Insurance": "/vision-insurance",
    "Hospital Indemnity": "/hospital-indemnity-insurance",
    "Discount Health Plans": "/discount-health-insurance",
  };
  return urlMap[typeName] || "/insurance-types";
};

export default function CoverageTypes() {
  const { data: insuranceTypes = [], isLoading } = useQuery({
    queryKey: ["/api/insurance-types"],
  });

  // Detailed information for each insurance type
  const insuranceDetails = {
    "Life Insurance": {
      description: "Protect your loved ones' financial future with comprehensive life insurance coverage options. Term life, whole life, and universal life policies available.",
      features: [
        "Death benefit protection",
        "Cash value accumulation (whole life)",
        "Convertible term options",
        "No medical exam options available",
      ],
      benefits: [
        "Financial security for beneficiaries",
        "Estate planning tool",
        "Tax-advantaged savings",
        "Peace of mind",
      ],
      startingPrice: "$12",
      coverage: "$1M+",
      icon: "heart",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    "Health Insurance": {
      description: "Comprehensive health coverage including medical, prescription, and preventive care benefits. Individual, family, and group plans available.",
      features: [
        "Preventive care coverage",
        "Prescription drug benefits",
        "Specialist visits",
        "Emergency care",
      ],
      benefits: [
        "Reduced medical costs",
        "Access to provider networks",
        "Preventive care incentives",
        "Emergency protection",
      ],
      startingPrice: "$89",
      coverage: "Various deductibles",
      icon: "stethoscope",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    "Dental Insurance": {
      description: "Complete dental coverage including cleanings, fillings, and major dental procedures. Keep your smile healthy and bright.",
      features: [
        "Preventive care (cleanings, exams)",
        "Basic procedures (fillings, extractions)",
        "Major procedures (crowns, bridges)",
        "Orthodontic coverage options",
      ],
      benefits: [
        "Lower out-of-pocket costs",
        "Regular preventive care",
        "Access to dental networks",
        "Early problem detection",
      ],
      startingPrice: "$15",
      coverage: "$2,000 annual max",
      icon: "usercheck",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    "Vision Insurance": {
      description: "Eye care coverage including exams, glasses, contacts, and vision correction procedures. See clearly and protect your eyesight.",
      features: [
        "Annual eye exams",
        "Prescription eyewear",
        "Contact lens allowance",
        "LASIK surgery discounts",
      ],
      benefits: [
        "Regular eye health monitoring",
        "Affordable eyewear",
        "Early detection of eye diseases",
        "Vision correction options",
      ],
      startingPrice: "$8",
      coverage: "$150 frame allowance",
      icon: "eye",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    "Hospital Indemnity": {
      description: "Cash benefits for hospital stays to help cover expenses not covered by major medical insurance. Financial protection when you need it most.",
      features: [
        "Daily hospital benefits",
        "ICU coverage",
        "Outpatient surgery benefits",
        "No network restrictions",
      ],
      benefits: [
        "Cash payments for any use",
        "Supplements major medical",
        "Helps with deductibles",
        "Income replacement",
      ],
      startingPrice: "$25",
      coverage: "$100-$500 daily",
      icon: "building2",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    "Discount Health Plans": {
      description: "Access discounted rates on medical, dental, vision, and prescription services nationwide. Save money on healthcare costs.",
      features: [
        "Medical service discounts",
        "Prescription savings",
        "Dental and vision discounts",
        "No waiting periods",
      ],
      benefits: [
        "Immediate savings",
        "No claim forms",
        "Large provider network",
        "Supplement to insurance",
      ],
      startingPrice: "$19",
      coverage: "10-60% savings",
      icon: "percent",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Coverage Options
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive range of coverage options designed to protect you and your family
          </p>
        </div>

        {/* Insurance Types Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {insuranceTypes.map((type: any) => {
              const details = insuranceDetails[type.name as keyof typeof insuranceDetails];
              if (!details) return null;
              
              const IconComponent = iconMap[details.icon as keyof typeof iconMap] || Shield;
              
              return (
                <Card key={type.id} className={`hover:shadow-lg transition-all duration-300 ${details.borderColor} border-2`}>
                  <CardHeader className={`${details.bgColor} rounded-t-xl`}>
                    <div className={`${details.color} text-4xl mb-4`}>
                      <IconComponent className="h-12 w-12" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {type.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-6 space-y-6">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {details.description}
                    </p>
                    
                    {/* Pricing Info */}
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm text-gray-600">Starting at:</span>
                      </div>
                      <span className={`font-semibold ${details.color}`}>
                        ${details.startingPrice}/month
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm text-gray-600">Coverage:</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {details.coverage}
                      </span>
                    </div>

                    {/* Key Features */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Key Features
                      </h4>
                      <ul className="space-y-2">
                        {details.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-600">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4">
                      <Link href="/quotes">
                        <Button className="w-full" size="lg">
                          Get Quotes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                      
                      <Link href={getInsuranceTypeUrl(type.name)}>
                        <Button variant="outline" className="w-full">
                          Learn More
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Call to Action Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Find Your Perfect Coverage?
              </h2>
              <p className="text-xl mb-6 text-blue-100">
                Compare quotes from top insurers and save money on your insurance needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/quotes">
                  <Button size="lg" variant="secondary" className="min-w-[200px]">
                    Compare All Quotes
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="min-w-[200px] border-white text-white hover:bg-white hover:text-primary">
                  Contact an Expert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
