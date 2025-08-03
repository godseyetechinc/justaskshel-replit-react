import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Trash2, 
  Heart, 
  ShoppingCart,
  DollarSign,
  Building2,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { format } from "date-fns";

export default function WishlistPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = useRoleAuth();
  const queryClient = useQueryClient();

  // Check permissions
  const canDelete = hasPermission("delete");

  // Fetch wishlist
  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ["/api/wishlist"],
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/wishlist/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Success", description: "Item removed from wishlist" });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove item from wishlist", variant: "destructive" });
    },
  });

  // Add to selected quotes mutation
  const addToSelectedQuotesMutation = useMutation({
    mutationFn: async (quoteId: number) => apiRequest("/api/selected-quotes", "POST", { quoteId }),
    onSuccess: () => {
      toast({ title: "Success", description: "Quote added to selected quotes" });
      queryClient.invalidateQueries({ queryKey: ["/api/selected-quotes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add quote to selection", variant: "destructive" });
    },
  });

  const handleRemove = (id: number) => {
    if (confirm("Are you sure you want to remove this item from your wishlist?")) {
      removeFromWishlistMutation.mutate(id);
    }
  };

  const handleAddToQuotes = (quoteId: number) => {
    addToSelectedQuotesMutation.mutate(quoteId);
  };

  const filteredItems = wishlistItems.filter((item: any) => {
    const quote = item.quote || {};
    const type = quote.type || {};
    const provider = quote.provider || {};
    
    return (
      type.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600">Insurance quotes you've saved for later consideration</p>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-lg font-semibold">{filteredItems.length} items</span>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search wishlist items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Wishlist Items */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Quotes ({filteredItems.length})</CardTitle>
            <CardDescription>
              Review and compare your saved insurance quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading wishlist...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                <p className="text-sm mb-4">
                  {searchTerm ? "No items match your search" : "Start browsing quotes to add items to your wishlist"}
                </p>
                {!searchTerm && (
                  <Button asChild>
                    <a href="/quotes">Browse Quotes</a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insurance Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item: any) => {
                      const quote = item.quote || {};
                      const type = quote.type || {};
                      const provider = quote.provider || {};
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                style={{ backgroundColor: type.color || '#6B7280' }}
                              >
                                {type.name?.charAt(0) || 'I'}
                              </div>
                              <div>
                                <div className="font-medium">{type.name || 'Insurance'}</div>
                                <div className="text-sm text-gray-500">Quote #{quote.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{provider.name || 'Unknown Provider'}</div>
                                {provider.rating && (
                                  <div className="text-sm text-gray-500">
                                    Rating: {provider.rating}/5
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              ${quote.coverageAmount?.toLocaleString() || '0'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">${quote.monthlyPremium?.toLocaleString() || '0'}/month</div>
                              {quote.deductible && (
                                <div className="text-sm text-gray-500">
                                  Deductible: ${quote.deductible?.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {quote.medicalExamRequired && (
                                <Badge variant="outline" className="text-xs">Medical Exam</Badge>
                              )}
                              {quote.conversionOption && (
                                <Badge variant="outline" className="text-xs">Conversion Option</Badge>
                              )}
                              {quote.termLength && (
                                <Badge variant="outline" className="text-xs">{quote.termLength} Year Term</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddToQuotes(quote.id)}
                                disabled={addToSelectedQuotesMutation.isPending}
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemove(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                  disabled={removeFromWishlistMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {filteredItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Wishlist Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">{filteredItems.length}</h3>
                  <p className="text-sm text-gray-600">Total Items</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">
                    ${Math.round(filteredItems.reduce((sum: number, item: any) => 
                      sum + (item.quote?.monthlyPremium || 0), 0)).toLocaleString()}
                  </h3>
                  <p className="text-sm text-gray-600">Total Monthly Premium</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">
                    ${Math.round(filteredItems.reduce((sum: number, item: any) => 
                      sum + (item.quote?.coverageAmount || 0), 0) / 1000)}K
                  </h3>
                  <p className="text-sm text-gray-600">Total Coverage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}