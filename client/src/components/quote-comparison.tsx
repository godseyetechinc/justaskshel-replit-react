import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Check, 
  X, 
  Star, 
  Heart,
  ArrowRight
} from "lucide-react";

export default function QuoteComparison() {
  // Mock data for demonstration - in real app this would come from API
  const mockQuotes = [
    {
      id: 1,
      provider: "ABC Life Insurance",
      premium: "$24.50",
      coverage: "$250,000",
      term: "20 Years",
      medicalExam: true,
      conversion: true,
      rating: 4.2,
      color: "primary",
      bgColor: "bg-primary-50",
      borderColor: "border-primary-200",
      buttonColor: "bg-primary-600 hover:bg-primary-700",
    },
    {
      id: 2,
      provider: "XYZ Life Insurance", 
      premium: "$19.25",
      coverage: "$250,000",
      term: "20 Years",
      medicalExam: false,
      conversion: true,
      rating: 4.8,
      bestValue: true,
      color: "green",
      bgColor: "bg-green-50", 
      borderColor: "border-green-200",
      buttonColor: "bg-green-600 hover:bg-green-700",
    },
    {
      id: 3,
      provider: "DEF Life Insurance",
      premium: "$28.75", 
      coverage: "$250,000",
      term: "30 Years",
      medicalExam: true,
      conversion: false,
      rating: 4.1,
      color: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200", 
      buttonColor: "bg-purple-600 hover:bg-purple-700",
    }
  ];

  const selectedQuotes = [
    { id: 2, provider: "XYZ Life Insurance", type: "$250k Term Life - 20 Years", premium: "$19.25" },
    { id: 1, provider: "ABC Life Insurance", type: "$250k Term Life - 20 Years", premium: "$24.50" },
  ];

  const wishlistItems = [
    { id: 1, provider: "Premium Health Plus", type: "Health Insurance", premium: "$89" },
    { id: 2, provider: "Complete Dental Care", type: "Dental Insurance", premium: "$15" },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Compare Up to 5 Insurance Quotes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Side-by-side comparison to help you make the best decision for your insurance needs
          </p>
        </div>

        {/* Quote Comparison Interface */}
        <Card className="mb-8 overflow-hidden">
          <CardHeader className="bg-primary-50 border-b border-primary-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Life Insurance Quotes Comparison
              </CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Comparing 3 of 5 quotes</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quote
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Features
                    </th>
                    {mockQuotes.map((quote) => (
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
                    {mockQuotes.map((quote) => (
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
                    {mockQuotes.map((quote) => (
                      <td key={quote.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {quote.coverage}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Term Length
                    </td>
                    {mockQuotes.map((quote) => (
                      <td key={quote.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {quote.term}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Medical Exam Required
                    </td>
                    {mockQuotes.map((quote) => (
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
                    {mockQuotes.map((quote) => (
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
                    {mockQuotes.map((quote) => (
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
                    {mockQuotes.map((quote) => (
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
          </CardContent>
        </Card>

        {/* Selected Quotes and Wishlist Summary */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  Selected Quotes ({selectedQuotes.length})
                </CardTitle>
                <Button variant="link" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedQuotes.map((quote, index) => (
                  <div 
                    key={quote.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      index === 0 ? 'bg-green-50 border-green-200' : 'bg-primary-50 border-primary-200'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-gray-900">{quote.provider}</span>
                      <div className="text-sm text-gray-600">{quote.type}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${index === 0 ? 'text-green-600' : 'text-primary'}`}>
                        {quote.premium}/mo
                      </div>
                      <Button variant="link" size="sm" className="text-xs text-red-500 hover:text-red-700 p-0 h-auto">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 text-red-500 mr-2" />
                  Wishlist ({wishlistItems.length})
                </CardTitle>
                <Button variant="link" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{item.provider}</span>
                      <div className="text-sm text-gray-600">{item.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-700">{item.premium}/mo</div>
                      <Button variant="link" size="sm" className="text-xs text-primary hover:text-primary/80 p-0 h-auto">
                        Move to Selected
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
