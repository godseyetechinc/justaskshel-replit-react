import { useState } from "react";
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
import { Search, Heart, Check, Star } from "lucide-react";

export default function Quotes() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [searchFilters, setSearchFilters] = useState({
    typeId: "",
    ageRange: "",
    zipCode: "",
    coverageAmount: "",
  });

  const { data: insuranceTypes } = useQuery({
    queryKey: ["/api/insurance-types"],
  });

  const { data: quotes, isLoading: quotesLoading, refetch: refetchQuotes } = useQuery({
    queryKey: ["/api/quotes/search", searchFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await fetch(`/api/quotes/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch quotes');
      return response.json();
    },
    enabled: false, // Only fetch when search is triggered
  });

  const { data: selectedQuotes } = useQuery({
    queryKey: ["/api/selected-quotes"],
    enabled: isAuthenticated,
  });

  const { data: wishlist } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });

  const addToSelectedMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      await apiRequest("POST", "/api/selected-quotes", { quoteId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/selected-quotes"] });
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
        description: "Failed to add quote to selected quotes",
        variant: "destructive",
      });
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      await apiRequest("POST", "/api/wishlist", { quoteId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
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

  const handleSearch = () => {
    refetchQuotes();
  };

  const isQuoteSelected = (quoteId: number) => {
    return selectedQuotes?.some(sq => sq.quoteId === quoteId);
  };

  const isQuoteInWishlist = (quoteId: number) => {
    return wishlist?.some(w => w.quoteId === quoteId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Compare Insurance Quotes</h1>
          <p className="text-lg text-gray-600">Find the perfect insurance coverage for your needs</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search for Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="insuranceType">Insurance Type</Label>
                <Select value={searchFilters.typeId} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, typeId: value }))}>
                  <SelectTrigger>
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
                <Label htmlFor="age">Age Range</Label>
                <Select value={searchFilters.ageRange} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, ageRange: value }))}>
                  <SelectTrigger>
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
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="Enter ZIP"
                  value={searchFilters.zipCode}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="coverageAmount">Coverage Amount</Label>
                <Select value={searchFilters.coverageAmount} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, coverageAmount: value }))}>
                  <SelectTrigger>
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
            
            <Button onClick={handleSearch} className="w-full" size="lg">
              <Search className="h-5 w-5 mr-2" />
              Find My Quotes
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        {quotes && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Found {quotes.length} Quote{quotes.length !== 1 ? 's' : ''}
            </h2>
            
            {quotesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : quotes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quotes.map((quote) => (
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
                            disabled={isQuoteSelected(quote.id) || !isAuthenticated || addToSelectedMutation.isPending}
                            className="w-full"
                          >
                            {isQuoteSelected(quote.id) ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Selected
                              </>
                            ) : (
                              'Select Quote'
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => addToWishlistMutation.mutate(quote.id)}
                            disabled={isQuoteInWishlist(quote.id) || !isAuthenticated || addToWishlistMutation.isPending}
                            className="w-full"
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

        {/* Selected Quotes and Wishlist Summary */}
        {isAuthenticated && (selectedQuotes || wishlist) && (
          <div className="grid md:grid-cols-2 gap-8">
            {selectedQuotes && selectedQuotes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    Selected Quotes ({selectedQuotes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedQuotes.map((selected) => (
                      <div key={selected.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <div className="font-medium">{selected.quote.provider.name}</div>
                          <div className="text-sm text-muted-foreground">{selected.quote.type.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">${selected.quote.monthlyPremium}/mo</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {wishlist && wishlist.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 text-red-500 mr-2" />
                    Wishlist ({wishlist.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {wishlist.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{item.quote.provider.name}</div>
                          <div className="text-sm text-muted-foreground">{item.quote.type.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${item.quote.monthlyPremium}/mo</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs"
                            onClick={() => addToSelectedMutation.mutate(item.quote.id)}
                            disabled={isQuoteSelected(item.quote.id)}
                          >
                            {isQuoteSelected(item.quote.id) ? 'Selected' : 'Move to Selected'}
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
    </div>
  );
}
