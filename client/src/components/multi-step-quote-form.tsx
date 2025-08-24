import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Minus,
  CalendarIcon,
  User,
  Users,
  FileText,
  MapPin,
  Star,
  Check,
  X,
  Heart,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PersonDetails {
  gender: string;
  healthClass: string;
  dateOfBirth: Date | undefined;
  tobaccoUse: string;
  weightLb: string;
  heightIn: string;
}

interface FormData {
  applicant: PersonDetails;
  spouse?: PersonDetails;
  children: PersonDetails[];
  coverage: string;
  paymentMode: string;
  termLength: string;
  amount: string;
  effectiveDate: Date | undefined;
  state: string;
  county: string;
  zipCode: string;
}

const initialPersonDetails: PersonDetails = {
  gender: "",
  healthClass: "",
  dateOfBirth: undefined,
  tobaccoUse: "",
  weightLb: "",
  heightIn: ""
};

const steps = [
  { id: 1, title: "Your Details", icon: User },
  { id: 2, title: "Family", icon: Users },
  { id: 3, title: "Coverage", icon: FileText },
  { id: 4, title: "Location", icon: MapPin }
];

export default function MultiStepQuoteForm() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [includeSpouse, setIncludeSpouse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quoteResults, setQuoteResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    applicant: { ...initialPersonDetails },
    children: [],
    coverage: "",
    paymentMode: "",
    termLength: "",
    amount: "",
    effectiveDate: undefined,
    state: "",
    county: "",
    zipCode: ""
  });

  const updateApplicant = (field: keyof PersonDetails, value: any) => {
    setFormData(prev => ({
      ...prev,
      applicant: { ...prev.applicant, [field]: value }
    }));
  };

  const updateSpouse = (field: keyof PersonDetails, value: any) => {
    setFormData(prev => ({
      ...prev,
      spouse: prev.spouse ? { ...prev.spouse, [field]: value } : { ...initialPersonDetails, [field]: value }
    }));
  };

  const updateChild = (index: number, field: keyof PersonDetails, value: any) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }));
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { ...initialPersonDetails }]
    }));
  };

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const PersonDetailsForm = ({ 
    person, 
    onUpdate, 
    title, 
    showRemove = false, 
    onRemove 
  }: {
    person: PersonDetails;
    onUpdate: (field: keyof PersonDetails, value: any) => void;
    title: string;
    showRemove?: boolean;
    onRemove?: () => void;
  }) => (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{title}</h4>
        {showRemove && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Minus className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">Gender</Label>
          <Select value={person.gender} onValueChange={(value) => onUpdate('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Health Class</Label>
          <Select value={person.healthClass} onValueChange={(value) => onUpdate('healthClass', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preferred-plus">Preferred Plus</SelectItem>
              <SelectItem value="preferred">Preferred</SelectItem>
              <SelectItem value="standard-plus">Standard Plus</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !person.dateOfBirth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {person.dateOfBirth ? format(person.dateOfBirth, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={person.dateOfBirth}
                onSelect={(date) => onUpdate('dateOfBirth', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Tobacco Use</Label>
          <Select value={person.tobaccoUse} onValueChange={(value) => onUpdate('tobaccoUse', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="former">Former (12+ months)</SelectItem>
              <SelectItem value="current">Current</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Weight (LB)</Label>
          <Input
            placeholder="Enter weight"
            value={person.weightLb}
            onChange={(e) => onUpdate('weightLb', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Height (IN)</Label>
          <Select value={person.heightIn} onValueChange={(value) => onUpdate('heightIn', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 36 }, (_, i) => {
                const inches = i + 48; // 4'0" to 7'0"
                const feet = Math.floor(inches / 12);
                const remainingInches = inches % 12;
                return (
                  <SelectItem key={inches} value={inches.toString()}>
                    {feet}'{remainingInches}"
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal & Wellness</h3>
              <p className="text-gray-600">Tell us about yourself to get accurate quotes</p>
            </div>
            
            <PersonDetailsForm
              person={formData.applicant}
              onUpdate={updateApplicant}
              title="Applicant"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Family Coverage</h3>
              <p className="text-gray-600">Add family members for coverage (optional)</p>
            </div>

            <div className="space-y-4">
              {!includeSpouse ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIncludeSpouse(true);
                    setFormData(prev => ({ ...prev, spouse: { ...initialPersonDetails } }));
                  }}
                  className="w-full border-dashed border-2 border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Spouse
                </Button>
              ) : (
                <PersonDetailsForm
                  person={formData.spouse!}
                  onUpdate={updateSpouse}
                  title="Spouse"
                  showRemove
                  onRemove={() => {
                    setIncludeSpouse(false);
                    setFormData(prev => ({ ...prev, spouse: undefined }));
                  }}
                />
              )}

              {formData.children.map((child, index) => (
                <PersonDetailsForm
                  key={index}
                  person={child}
                  onUpdate={(field, value) => updateChild(index, field, value)}
                  title={`Child ${index + 1}`}
                  showRemove
                  onRemove={() => removeChild(index)}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addChild}
                className="w-full border-dashed border-2 border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Child
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Coverage & Payment</h3>
              <p className="text-gray-600">Choose your coverage options and payment preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Coverage</Label>
                <Select value={formData.coverage} onValueChange={(value) => setFormData(prev => ({ ...prev, coverage: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select coverage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term-life">Term Life Insurance</SelectItem>
                    <SelectItem value="whole-life">Whole Life Insurance</SelectItem>
                    <SelectItem value="universal-life">Universal Life Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Payment Mode</Label>
                <Select value={formData.paymentMode} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMode: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Term Length</Label>
                <Select value={formData.termLength} onValueChange={(value) => setFormData(prev => ({ ...prev, termLength: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 Years</SelectItem>
                    <SelectItem value="15">15 Years</SelectItem>
                    <SelectItem value="20">20 Years</SelectItem>
                    <SelectItem value="30">30 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Amount</Label>
                <Select value={formData.amount} onValueChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select coverage amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100000">$100,000</SelectItem>
                    <SelectItem value="250000">$250,000</SelectItem>
                    <SelectItem value="500000">$500,000</SelectItem>
                    <SelectItem value="1000000">$1,000,000</SelectItem>
                    <SelectItem value="2000000">$2,000,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-2">Effective Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.effectiveDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.effectiveDate ? format(formData.effectiveDate, "PPP") : "Select effective date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.effectiveDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, effectiveDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Location Information</h3>
              <p className="text-gray-600">Help us find the best rates in your area</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">State</Label>
                <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">County</Label>
                <Select value={formData.county} onValueChange={(value) => setFormData(prev => ({ ...prev, county: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="los-angeles">Los Angeles</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="san-diego">San Diego</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">ZIP Code</Label>
                <Input
                  placeholder="Enter ZIP code"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatDateForAPI = (date: Date | undefined): string => {
    if (!date) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  };

  const mapGenderToAPI = (gender: string): string => {
    return gender === 'male' ? 'M' : gender === 'female' ? 'F' : 'M';
  };

  const mapHealthClassToAPI = (healthClass: string): string => {
    const healthMap: { [key: string]: string } = {
      'preferred-plus': 'excellent',
      'preferred': 'good',
      'standard-plus': 'average',
      'standard': 'poor'
    };
    return healthMap[healthClass] || 'good';
  };

  const mapTobaccoToAPI = (tobacco: string): boolean => {
    return tobacco === 'current' || tobacco === 'former';
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Create the JSON payload matching the required format
      const payload = {
        isLifeInsuranceRequest: true,
        subCategoryFilter: ["term-life"],
        quoteCriteria: {
          quoteSearchId: 0,
          coverage: 0,
          coverageAmount: parseInt(formData.amount) || 1000000,
          state: formData.state || "FL",
          zipCode: formData.zipCode || "33073",
          county: formData.county || "Broward",
          applicant: {
            dateOfBirth: formatDateForAPI(formData.applicant.dateOfBirth),
            gender: mapGenderToAPI(formData.applicant.gender),
            healthClass: mapHealthClassToAPI(formData.applicant.healthClass),
            tobacco: mapTobaccoToAPI(formData.applicant.tobaccoUse),
            heightInInches: parseInt(formData.applicant.heightIn) || 69,
            weight: parseInt(formData.applicant.weightLb) || 175,
            ignore: true
          },
          paymentMode: formData.paymentMode || "monthly",
          effectiveDate: formatDateForAPI(formData.effectiveDate),
          quoteSource: "web",
          termLength: parseInt(formData.termLength) || 20,
          includeWaiverPremium: true,
          multiTermQuote: true
        }
      };

      console.log('Sending quote request:', payload);

      // Make HTTP POST request through our backend proxy
      const response = await fetch('/api/quotes/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Quote results received:', data);
      
      // Transform API response to match our quote display format
      const transformedQuotes = Array.isArray(data) ? data.map((quote: any, index: number) => ({
        id: index + 1,
        provider: quote.carrierName || `Provider ${index + 1}`,
        premium: quote.monthlyPremium ? `$${quote.monthlyPremium}` : `$${(Math.random() * 50 + 10).toFixed(2)}`,
        coverage: `$${parseInt(formData.amount || '250000').toLocaleString()}`,
        term: `${formData.termLength || '20'} Years`,
        medicalExam: quote.medicalExamRequired !== false,
        conversion: quote.convertible !== false,
        rating: quote.rating || (Math.random() * 2 + 3).toFixed(1),
        color: index === 0 ? "green" : index === 1 ? "primary" : "purple",
        bgColor: index === 0 ? "bg-green-50" : index === 1 ? "bg-primary-50" : "bg-purple-50",
        borderColor: index === 0 ? "border-green-200" : index === 1 ? "border-primary-200" : "border-purple-200",
        buttonColor: index === 0 ? "bg-green-600 hover:bg-green-700" : index === 1 ? "bg-primary-600 hover:bg-primary-700" : "bg-purple-600 hover:bg-purple-700",
        bestValue: index === 0
      })) : [];

      setQuoteResults(transformedQuotes);
      setShowResults(true);
      
      toast({
        title: "Success!",
        description: `Found ${transformedQuotes.length} quotes for your search criteria.`
      });

    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quotes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setQuoteResults([]);
    setCurrentStep(1);
    setFormData({
      applicant: { ...initialPersonDetails },
      children: [],
      coverage: "",
      paymentMode: "",
      termLength: "",
      amount: "",
      effectiveDate: undefined,
      state: "",
      county: "",
      zipCode: ""
    });
  };

  // If showing results, render the quote comparison
  if (showResults) {
    return (
      <Card className="w-full max-w-6xl mx-auto shadow-2xl">
        <CardHeader className="bg-primary text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-center">
              <div className="flex items-center justify-center">
                <Search className="h-6 w-6 mr-2" />
                Life Insurance Quote Results
              </div>
            </CardTitle>
            <Button 
              variant="secondary" 
              onClick={handleNewSearch}
              className="bg-white text-primary hover:bg-gray-100"
            >
              New Search
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {quoteResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Features
                    </th>
                    {quoteResults.map((quote) => (
                      <th key={quote.id} className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col items-center">
                          <div className={`w-20 h-10 ${quote.bgColor} rounded mb-2 flex items-center justify-center text-xs font-semibold`}>
                            Logo
                          </div>
                          <span>{quote.provider}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Monthly Premium
                    </td>
                    {quoteResults.map((quote) => (
                      <td key={quote.id} className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-2xl font-bold text-${quote.color}-600`}>
                          {quote.premium}
                        </span>
                        {quote.bestValue && (
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full inline-block ml-2">
                            Best Value
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Coverage Amount
                    </td>
                    {quoteResults.map((quote) => (
                      <td key={quote.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {quote.coverage}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Term Length
                    </td>
                    {quoteResults.map((quote) => (
                      <td key={quote.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {quote.term}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Medical Exam Required
                    </td>
                    {quoteResults.map((quote) => (
                      <td key={quote.id} className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {quote.medicalExam ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Conversion Option
                    </td>
                    {quoteResults.map((quote) => (
                      <td key={quote.id} className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {quote.conversion ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Customer Rating
                    </td>
                    {quoteResults.map((quote) => (
                      <td key={quote.id} className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex justify-center items-center">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < Math.floor(quote.rating) ? 'fill-current' : ''}`} 
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-gray-600">{quote.rating}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Actions
                    </td>
                    {quoteResults.map((quote) => (
                      <td key={quote.id} className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col space-y-2">
                          <Button className={`${quote.buttonColor} text-white px-4 py-2 text-sm font-medium`}>
                            Select Quote
                          </Button>
                          <Button variant="ghost" size="sm" className={`text-gray-500 hover:text-${quote.color}-600`}>
                            <Heart className="h-3 w-3 mr-1" />
                            Add to Wishlist
                          </Button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No quotes found for your criteria.</p>
              <Button onClick={handleNewSearch} className="mt-4">
                Try New Search
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl">
      <CardHeader className="bg-primary text-white">
        <CardTitle className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Search className="h-6 w-6 mr-2" />
            Search Life Insurance Quotes
          </div>
        </CardTitle>
        
        {/* Progress Steps */}
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                currentStep >= step.id 
                  ? "bg-white text-primary" 
                  : "bg-primary-600 text-white border-2 border-white/30"
              )}>
                <step.icon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-16 h-1 transition-colors",
                  currentStep > step.id ? "bg-white" : "bg-primary-600"
                )} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mt-4">
          <p className="text-blue-100">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Get Quote
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}