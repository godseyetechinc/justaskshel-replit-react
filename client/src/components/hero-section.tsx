import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Star, Users, Shield, Lock, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import consultationImage from "@assets/generated_images/Insurance_consultation_meeting_3b02f975.png";

export default function HeroSection() {
  const [, setLocation] = useLocation();
  const [searchFilters, setSearchFilters] = useState({
    typeId: "",
    ageRange: "",
    zipCode: "",
    coverageAmount: "",
    paymentCycle: "",
    termLength: "",
    effectiveDate: "",
    hasSpouse: false,
    spouseAge: "",
    children: [] as Array<{ age: string; id: string }>,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDependents, setShowDependents] = useState(false);

  const { data: insuranceTypes } = useQuery({
    queryKey: ["/api/insurance-types"],
  });

  const addChild = () => {
    const newChild = {
      id: Date.now().toString(),
      age: ""
    };
    setSearchFilters(prev => ({
      ...prev,
      children: [...prev.children, newChild]
    }));
  };

  const removeChild = (id: string) => {
    setSearchFilters(prev => ({
      ...prev,
      children: prev.children.filter(child => child.id !== id)
    }));
  };

  const updateChildAge = (id: string, age: string) => {
    setSearchFilters(prev => ({
      ...prev,
      children: prev.children.map(child => 
        child.id === id ? { ...child, age } : child
      )
    }));
  };

  const handleSearch = () => {
    // Navigate to quotes page with search parameters
    const params = new URLSearchParams();
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (key === 'children' && Array.isArray(value)) {
        value.forEach((child, index) => {
          if (child.age) params.append(`child_${index}_age`, child.age);
        });
      } else if (value && typeof value !== 'boolean') {
        params.append(key, value.toString());
      } else if (typeof value === 'boolean' && value) {
        params.append(key, 'true');
      }
    });
    setLocation(`/quotes?${params.toString()}`);
  };

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
          {/* Insurance Quote Search Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl mx-auto">
            {/* Basic Fields */}
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

            {/* Advanced Options Toggle */}
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-gray-600 hover:text-gray-800"
                data-testid="toggle-advanced-options"
              >
                {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                Advanced Options
              </Button>
            </div>

            {/* Advanced Fields */}
            {showAdvanced && (
              <div className="border-t pt-6 mb-6">
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="paymentCycle" className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Cycle
                    </Label>
                    <Select value={searchFilters.paymentCycle} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, paymentCycle: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Payment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="termLength" className="block text-sm font-medium text-gray-700 mb-2">
                      Term Length
                    </Label>
                    <Select value={searchFilters.termLength} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, termLength: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 Years</SelectItem>
                        <SelectItem value="15">15 Years</SelectItem>
                        <SelectItem value="20">20 Years</SelectItem>
                        <SelectItem value="25">25 Years</SelectItem>
                        <SelectItem value="30">30 Years</SelectItem>
                        <SelectItem value="whole-life">Whole Life</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Effective Date
                    </Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={searchFilters.effectiveDate}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, effectiveDate: e.target.value }))}
                      className="w-full"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Dependents Toggle */}
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDependents(!showDependents)}
                    className="text-gray-600 hover:text-gray-800"
                    data-testid="toggle-dependents"
                  >
                    {showDependents ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                    Add Dependents
                  </Button>
                </div>

                {/* Dependents Section */}
                {showDependents && (
                  <div className="border-t pt-4 space-y-4">
                    {/* Spouse Section */}
                    <div className="flex items-center space-x-3 mb-4">
                      <Checkbox
                        id="hasSpouse"
                        checked={searchFilters.hasSpouse}
                        onCheckedChange={(checked) => setSearchFilters(prev => ({ 
                          ...prev, 
                          hasSpouse: !!checked,
                          spouseAge: checked ? prev.spouseAge : ""
                        }))}
                        data-testid="checkbox-spouse"
                      />
                      <Label htmlFor="hasSpouse" className="text-sm font-medium text-gray-700">
                        Include Spouse
                      </Label>
                      {searchFilters.hasSpouse && (
                        <div className="flex-1 max-w-xs">
                          <Select 
                            value={searchFilters.spouseAge} 
                            onValueChange={(value) => setSearchFilters(prev => ({ ...prev, spouseAge: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Spouse Age" />
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
                      )}
                    </div>

                    {/* Children Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-gray-700">Children</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addChild}
                          className="text-blue-600 hover:text-blue-800"
                          data-testid="button-add-child"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Child
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {searchFilters.children.map((child, index) => (
                          <div key={child.id} className="flex items-center space-x-2">
                            <Label className="text-sm text-gray-600 w-16">
                              Child {index + 1}:
                            </Label>
                            <Select 
                              value={child.age} 
                              onValueChange={(value) => updateChildAge(child.id, value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select Age" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0-2">0-2 years</SelectItem>
                                <SelectItem value="3-5">3-5 years</SelectItem>
                                <SelectItem value="6-12">6-12 years</SelectItem>
                                <SelectItem value="13-17">13-17 years</SelectItem>
                                <SelectItem value="18-25">18-25 years</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeChild(child.id)}
                              className="text-red-600 hover:text-red-800"
                              data-testid={`button-remove-child-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <Button 
              onClick={handleSearch}
              className="w-full font-semibold py-4 px-8 text-lg"
              size="lg"
              data-testid="button-find-quotes"
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
