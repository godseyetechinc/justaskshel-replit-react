import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Heart, Check, Star, ChevronLeft, ChevronRight, ArrowLeftRight, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import quoteComparisonImage from "@assets/generated_images/Quote_comparison_dashboard_94f4b5f2.png";

// Browser storage utilities for visitor wishlist and selected quotes
const VISITOR_WISHLIST_KEY = 'visitor-wishlist';
const VISITOR_SELECTED_KEY = 'visitor-selected-quotes';

const getVisitorWishlist = (): number[] => {
  try {
    const stored = localStorage.getItem(VISITOR_WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getVisitorSelectedQuotes = (): number[] => {
  try {
    const stored = localStorage.getItem(VISITOR_SELECTED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setVisitorWishlist = (quoteIds: number[]) => {
  localStorage.setItem(VISITOR_WISHLIST_KEY, JSON.stringify(quoteIds));
};

const setVisitorSelectedQuotes = (quoteIds: number[]) => {
  localStorage.setItem(VISITOR_SELECTED_KEY, JSON.stringify(quoteIds));
};

export default function Quotes() {
  const { isAuthenticated } = useAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [searchFilters, setSearchFilters] = useState(() => {
    // Initialize from URL params
    const urlParams = new URLSearchParams(window.location.search);
    
    // Parse children from URL parameters
    const children = [];
    let childIndex = 0;
    while (urlParams.get(`child_${childIndex}_age`)) {
      children.push({
        id: `child_${childIndex}`,
        age: urlParams.get(`child_${childIndex}_age`) || ""
      });
      childIndex++;
    }

    return {
      typeId: urlParams.get('typeId') || "",
      ageRange: urlParams.get('ageRange') || "",
      zipCode: urlParams.get('zipCode') || "",
      coverageAmount: urlParams.get('coverageAmount') || "",
      paymentCycle: urlParams.get('paymentCycle') || "",
      termLength: urlParams.get('termLength') || "",
      effectiveDate: urlParams.get('effectiveDate') || "",
      hasSpouse: urlParams.get('hasSpouse') === 'true',
      spouseAge: urlParams.get('spouseAge') || "",
      children: children,
    };
  });

  const [visitorWishlist, setVisitorWishlistState] = useState<number[]>([]);
  const [visitorSelectedQuotes, setVisitorSelectedQuotesState] = useState<number[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDependents, setShowDependents] = useState(false);

  // Initialize visitor storage on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setVisitorWishlistState(getVisitorWishlist());
      setVisitorSelectedQuotesState(getVisitorSelectedQuotes());
    }
  }, [isAuthenticated]);

  // Auto-expand advanced sections if they contain data from URL and trigger search
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasSearchParams = urlParams.has('typeId') || urlParams.has('ageRange') || 
                           urlParams.has('zipCode') || urlParams.has('coverageAmount');
    const hasAdvancedParams = urlParams.has('paymentCycle') || urlParams.has('termLength') || 
                             urlParams.has('effectiveDate') || urlParams.has('hasSpouse');
    const hasChildrenParams = Array.from(urlParams.keys()).some(key => key.startsWith('child_'));
    
    if (hasAdvancedParams || hasChildrenParams) {
      setShowAdvanced(true);
    }
    if (hasChildrenParams || urlParams.has('hasSpouse')) {
      setShowDependents(true);
    }
    
    if (hasSearchParams) {
      // Trigger search automatically when coming from home page
      setShouldSearch(true);
    }
  }, []);

  // Sync visitor data after login
  useEffect(() => {
    if (isAuthenticated && user) {
      syncVisitorDataAfterLogin();
    }
  }, [isAuthenticated, user]);

  const syncVisitorDataAfterLogin = async () => {
    const wishlistItems = getVisitorWishlist();
    const selectedItems = getVisitorSelectedQuotes();

    if (wishlistItems.length > 0) {
      try {
        for (const quoteId of wishlistItems) {
          await apiRequest("/api/wishlist", "POST", { quoteId });
        }
        localStorage.removeItem(VISITOR_WISHLIST_KEY);
        queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
        toast({
          title: "Wishlist Synced",
          description: `${wishlistItems.length} items added to your account`,
        });
      } catch (error) {
        console.error("Failed to sync wishlist:", error);
      }
    }

    if (selectedItems.length > 0) {
      try {
        for (const quoteId of selectedItems) {
          await apiRequest("/api/selected-quotes", "POST", { quoteId });
        }
        localStorage.removeItem(VISITOR_SELECTED_KEY);
        queryClient.invalidateQueries({ queryKey: ["/api/selected-quotes"] });
        toast({
          title: "Selected Quotes Synced",
          description: `${selectedItems.length} quotes added to your account`,
        });
      } catch (error) {
        console.error("Failed to sync selected quotes:", error);
      }
    }
  };

  const { data: insuranceTypes } = useQuery({
    queryKey: ["/api/insurance-types"],
  });

  // State to control when to search
  const [shouldSearch, setShouldSearch] = useState(false);

  const { data: allQuotes, isLoading: quotesLoading, refetch: refetchQuotes } = useQuery({
    queryKey: ["/api/quotes/search", searchFilters],
    queryFn: async () => {
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
      const response = await fetch(`/api/quotes/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch quotes');
      return response.json();
    },
    enabled: shouldSearch,
  });

  const { data: selectedQuotes } = useQuery({
    queryKey: ["/api/selected-quotes"],
    enabled: isAuthenticated,
  });

  const { data: wishlist } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const quotes = allQuotes?.slice(startIndex, endIndex) || [];
  const totalPages = allQuotes ? Math.ceil(allQuotes.length / itemsPerPage) : 0;

  // Get current selected quotes for comparison
  const getCurrentSelectedQuotes = () => {
    if (isAuthenticated) {
      return selectedQuotes?.map((sq: any) => sq.quoteId) || [];
    }
    return visitorSelectedQuotes;
  };

  const getCurrentWishlist = () => {
    if (isAuthenticated) {
      return wishlist?.map((w: any) => w.quoteId) || [];
    }
    return visitorWishlist;
  };

  const currentlySelected = getCurrentSelectedQuotes();
  const currentWishlistIds = getCurrentWishlist();

  const addToSelectedMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      if (isAuthenticated) {
        await apiRequest("/api/selected-quotes", "POST", { quoteId });
      } else {
        // Visitor functionality - store in browser
        const currentSelected = getVisitorSelectedQuotes();
        if (currentSelected.length >= 5) {
          throw new Error("You can select up to 5 quotes for comparison");
        }
        if (!currentSelected.includes(quoteId)) {
          const updatedSelected = [...currentSelected, quoteId];
          setVisitorSelectedQuotes(updatedSelected);
          setVisitorSelectedQuotesState(updatedSelected);
        }
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/selected-quotes"] });
      }
      toast({
        title: "Success",
        description: "Quote added to selected quotes",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add quote to selected quotes",
        variant: "destructive",
      });
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      if (isAuthenticated) {
        await apiRequest("/api/wishlist", "POST", { quoteId });
      } else {
        // Visitor functionality - store in browser
        const currentWishlist = getVisitorWishlist();
        if (!currentWishlist.includes(quoteId)) {
          const updatedWishlist = [...currentWishlist, quoteId];
          setVisitorWishlist(updatedWishlist);
          setVisitorWishlistState(updatedWishlist);
        }
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      }
      toast({
        title: "Success",
        description: "Quote added to wishlist",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add quote to wishlist",
        variant: "destructive",
      });
    },
  });

  const removeFromSelectedMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      if (isAuthenticated) {
        await apiRequest(`/api/selected-quotes/${quoteId}`, "DELETE");
      } else {
        const currentSelected = getVisitorSelectedQuotes();
        const updatedSelected = currentSelected.filter(id => id !== quoteId);
        setVisitorSelectedQuotes(updatedSelected);
        setVisitorSelectedQuotesState(updatedSelected);
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/selected-quotes"] });
      }
      toast({
        title: "Success",
        description: "Quote removed from selected quotes",
      });
    },
  });

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
    setShouldSearch(true);
  };

  const isQuoteSelected = (quoteId: number) => {
    return currentlySelected.includes(quoteId);
  };

  const isQuoteInWishlist = (quoteId: number) => {
    return currentWishlistIds.includes(quoteId);
  };

  const canSelectMore = () => {
    return currentlySelected.length < 5;
  };

  // Children management functions
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

  // Get comparison data
  const getComparisonQuotes = () => {
    if (!allQuotes) return [];
    return allQuotes.filter((quote: any) => currentlySelected.includes(quote.id));
  };

  const ComparisonModal = () => {
    const comparisonQuotes = getComparisonQuotes();
    
    return (
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Selected Quotes ({comparisonQuotes.length})</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonQuotes.map((quote: any) => (
              <Card key={quote.id} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => removeFromSelectedMutation.mutate(quote.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between pr-8">
                    <div>
                      <h3 className="font-semibold">{quote.provider.name}</h3>
                      <p className="text-sm text-muted-foreground">{quote.type.name}</p>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm">{quote.provider.rating || '4.5'}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">${quote.monthlyPremium}</div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Coverage:</span>
                        <span className="font-medium">${quote.coverageAmount}</span>
                      </div>
                      {quote.termLength && (
                        <div className="flex justify-between">
                          <span>Term:</span>
                          <span className="font-medium">{quote.termLength} years</span>
                        </div>
                      )}
                      {quote.deductible && (
                        <div className="flex justify-between">
                          <span>Deductible:</span>
                          <span className="font-medium">${quote.deductible}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {quote.medicalExamRequired ? (
                        <Badge variant="outline">Medical Exam Required</Badge>
                      ) : (
                        <Badge variant="secondary">No Medical Exam</Badge>
                      )}
                      {quote.conversionOption && (
                        <Badge variant="outline">Conversion Option</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Compare Coverage Quotes</h1>
            <p className="text-gray-600">Find the perfect coverage for your needs</p>
            {!isAuthenticated && (currentlySelected.length > 0 || currentWishlistIds.length > 0) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Sign in to sync your selections:</strong> You have {currentlySelected.length} selected quotes and {currentWishlistIds.length} wishlist items stored locally.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        {currentlySelected.length > 0 && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">
                    {currentlySelected.length} of 5 quotes selected for comparison
                  </span>
                </div>
                <Button 
                  onClick={() => setShowComparison(true)}
                  disabled={currentlySelected.length < 2}
                  data-testid="button-compare-quotes"
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Compare Selected
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search for Quotes</CardTitle>
          </CardHeader>
          <CardContent>
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
                    {insuranceTypes?.map((type: any) => (
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
                  data-testid="input-zip-code"
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
              data-testid="button-search-quotes"
            >
              <Search className="h-5 w-5 mr-2" />
              Find My Quotes
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        {allQuotes && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Found {allQuotes.length} Quote{allQuotes.length !== 1 ? 's' : ''}
              </h2>
              
              {/* Pagination Info */}
              {totalPages > 1 && (
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, allQuotes.length)} of {allQuotes.length}
                </div>
              )}
            </div>
            
            {quotesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : quotes.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {quotes.map((quote: any) => (
                    <Card key={quote.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{quote.provider.name}</h3>
                            <p className="text-sm text-muted-foreground">{quote.type.name}</p>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm">{quote.provider.rating || '4.5'}</span>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-primary">${quote.monthlyPremium}</div>
                            <div className="text-sm text-muted-foreground">per month</div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Coverage:</span>
                              <span className="font-medium">${quote.coverageAmount}</span>
                            </div>
                            {quote.termLength && (
                              <div className="flex justify-between">
                                <span>Term:</span>
                                <span className="font-medium">{quote.termLength} years</span>
                              </div>
                            )}
                            {quote.deductible && (
                              <div className="flex justify-between">
                                <span>Deductible:</span>
                                <span className="font-medium">${quote.deductible}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {quote.medicalExamRequired ? (
                              <Badge variant="outline">Medical Exam Required</Badge>
                            ) : (
                              <Badge variant="secondary">No Medical Exam</Badge>
                            )}
                            {quote.conversionOption && (
                              <Badge variant="outline">Conversion Option</Badge>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 pt-4">
                            <Button
                              onClick={() => addToSelectedMutation.mutate(quote.id)}
                              disabled={isQuoteSelected(quote.id) || !canSelectMore() || addToSelectedMutation.isPending}
                              className="w-full"
                              data-testid={`button-select-quote-${quote.id}`}
                            >
                              {isQuoteSelected(quote.id) ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Selected
                                </>
                              ) : !canSelectMore() ? (
                                'Max 5 Selected'
                              ) : (
                                'Select Quote'
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              onClick={() => addToWishlistMutation.mutate(quote.id)}
                              disabled={isQuoteInWishlist(quote.id) || addToWishlistMutation.isPending}
                              className="w-full"
                              data-testid={`button-wishlist-quote-${quote.id}`}
                            >
                              <Heart className={`h-4 w-4 mr-2 ${isQuoteInWishlist(quote.id) ? 'fill-current text-red-500' : ''}`} />
                              {isQuoteInWishlist(quote.id) ? 'In Wishlist' : 'Add to Wishlist'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex space-x-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                            data-testid={`button-page-${pageNum}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria to find more options.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Summary Cards for Selected/Wishlist */}
        {(currentlySelected.length > 0 || currentWishlistIds.length > 0) && (
          <div className="grid md:grid-cols-2 gap-8">
            {currentlySelected.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      Selected Quotes ({currentlySelected.length})
                    </div>
                    {currentlySelected.length >= 2 && (
                      <Button 
                        size="sm" 
                        onClick={() => setShowComparison(true)}
                        data-testid="button-compare-selected"
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-1" />
                        Compare
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getComparisonQuotes().map((quote: any) => (
                      <div key={quote.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <div className="font-medium">{quote.provider.name}</div>
                          <div className="text-sm text-muted-foreground">{quote.type.name}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="font-semibold text-green-600">${quote.monthlyPremium}/mo</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromSelectedMutation.mutate(quote.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentWishlistIds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 text-red-500 mr-2" />
                    Wishlist ({currentWishlistIds.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allQuotes?.filter((quote: any) => currentWishlistIds.includes(quote.id)).map((quote: any) => (
                      <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{quote.provider.name}</div>
                          <div className="text-sm text-muted-foreground">{quote.type.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${quote.monthlyPremium}/mo</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs"
                            onClick={() => addToSelectedMutation.mutate(quote.id)}
                            disabled={isQuoteSelected(quote.id) || !canSelectMore()}
                          >
                            {isQuoteSelected(quote.id) ? 'Selected' : canSelectMore() ? 'Move to Selected' : 'Max Selected'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <ComparisonModal />
    </div>
  );
}
