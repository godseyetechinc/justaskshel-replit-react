import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Star, Users, Shield, Lock } from "lucide-react";
import { useLocation } from "wouter";

export default function HeroSection() {
  const [, setLocation] = useLocation();
  const [searchFilters, setSearchFilters] = useState({
    typeId: "",
    ageRange: "",
    zipCode: "",
    coverageAmount: "",
  });

  const { data: insuranceTypes } = useQuery({
    queryKey: ["/api/insurance-types"],
  });

  const handleSearch = () => {
    // Navigate to quotes page with search parameters
    const params = new URLSearchParams();
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    setLocation(`/quotes?${params.toString()}`);
  };

  return (
    <section className="bg-gradient-to-br from-primary to-primary/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Affordable Insurance
            <br />
            <span className="text-blue-200">That Fits Your Life</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Compare quotes from top-rated insurers. Get expert advice. Save money on life, health, dental, vision, and hospital coverage.
          </p>
          
          {/* Insurance Quote Search Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="coverageType" className="block text-sm font-medium text-gray-700 mb-2">
                  Coverage Type
                </Label>
                <Select value={searchFilters.typeId} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, typeId: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </Label>
                <Select value={searchFilters.ageRange} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, ageRange: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-25">18-25</SelectItem>
                    <SelectItem value="26-35">26-35</SelectItem>
                    <SelectItem value="36-45">36-45</SelectItem>
                    <SelectItem value="46-55">46-55</SelectItem>
                    <SelectItem value="56-65">56-65</SelectItem>
                    <SelectItem value="65+">65+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </Label>
                <Input
                  id="zipCode"
                  placeholder="Enter ZIP"
                  value={searchFilters.zipCode}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="coverageAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Coverage Amount
                </Label>
                <Select value={searchFilters.coverageAmount} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, coverageAmount: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25000">$25,000</SelectItem>
                    <SelectItem value="50000">$50,000</SelectItem>
                    <SelectItem value="100000">$100,000</SelectItem>
                    <SelectItem value="250000">$250,000</SelectItem>
                    <SelectItem value="500000">$500,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleSearch}
              className="w-full font-semibold py-4 px-8 text-lg"
              size="lg"
            >
              <Search className="h-5 w-5 mr-2" />
              Find My Quotes
            </Button>
          </div>

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
