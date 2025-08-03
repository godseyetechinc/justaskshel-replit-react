import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  UserCheck, 
  CheckCircle, 
  Phone, 
  MessageCircle, 
  Clock, 
  Shield, 
  Star,
  ArrowRight,
  Upload,
  Search,
  DollarSign
} from "lucide-react";

export default function ClaimsAssistance() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Expert Claims Assistance
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our dedicated claims specialists guide you through every step of the process to ensure you get the maximum coverage you deserve
          </p>
        </div>

        {/* Claims Process */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Simple 3-Step Claims Process
            </h2>
            
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">1</span>
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    File Your Claim
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Submit your claim online or by phone with our simple, step-by-step process. Upload photos and documents directly through your dashboard.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      <Upload className="h-3 w-3 mr-1" />
                      Online Filing
                    </Badge>
                    <Badge variant="secondary">
                      <Phone className="h-3 w-3 mr-1" />
                      Phone Support
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      24/7 Available
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">2</span>
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2" />
                    Expert Review
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Our claims specialists review your submission and work directly with providers to ensure maximum coverage and fastest processing.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      <Search className="h-3 w-3 mr-1" />
                      Thorough Review
                    </Badge>
                    <Badge variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      Provider Advocacy
                    </Badge>
                    <Badge variant="secondary">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Maximize Benefits
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">3</span>
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Get Results
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Receive updates in real-time and get your claim resolved quickly. Our team handles all the paperwork and follow-up communications.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Real-time Updates
                    </Badge>
                    <Badge variant="secondary">
                      <FileText className="h-3 w-3 mr-1" />
                      Paperwork Handled
                    </Badge>
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Fast Resolution
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Claims Performance Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Claims Performance
            </h3>
            
            <div className="space-y-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">94%</div>
                <p className="text-gray-600 font-medium">Claims Approved</p>
                <p className="text-sm text-gray-500 mt-1">Industry average: 87%</p>
              </div>
              
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">3.2</div>
                <p className="text-gray-600 font-medium">Average Processing Days</p>
                <p className="text-sm text-gray-500 mt-1">Industry average: 7-10 days</p>
              </div>
              
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">4.9</div>
                <p className="text-gray-600 font-medium">Customer Satisfaction Rating</p>
                <div className="flex justify-center mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Recent Success Stories</h4>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-700">
                    "InsureScope helped me navigate a complex health claim and got me $12,000 more than I expected!"
                  </p>
                  <p className="text-xs text-gray-500 mt-2">- Sarah M., Austin TX</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    "The claims team made the process so easy. Everything was handled professionally and quickly."
                  </p>
                  <p className="text-xs text-gray-500 mt-2">- Michael R., Denver CO</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>24/7 Phone Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Speak directly with a claims specialist anytime, day or night. Get immediate assistance when you need it most.
              </p>
              <Button className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Call Now: 1-800-CLAIMS
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Get instant answers through our live chat system. Connect with a specialist in under 30 seconds.
              </p>
              <Button variant="outline" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Live Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>Online Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                File claims, upload documents, and track progress through your secure online dashboard.
              </p>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Access Portal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Claims Types We Handle */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Claims Types We Handle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Health Insurance", items: ["Medical procedures", "Hospital stays", "Prescription drugs", "Preventive care"] },
                { title: "Life Insurance", items: ["Death benefits", "Terminal illness", "Disability riders", "Policy loans"] },
                { title: "Dental Insurance", items: ["Routine cleanings", "Fillings & crowns", "Orthodontics", "Oral surgery"] },
                { title: "Vision Insurance", items: ["Eye exams", "Glasses & contacts", "LASIK surgery", "Eye disease treatment"] },
              ].map((category, index) => (
                <div key={index} className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-3">{category.title}</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Need Help with a Claim?
            </h2>
            <p className="text-xl mb-6 text-blue-100">
              Don't navigate the claims process alone. Our experts are here to help you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="min-w-[200px]">
                <Phone className="h-5 w-5 mr-2" />
                File a Claim Now
              </Button>
              <Button size="lg" variant="outline" className="min-w-[200px] border-white text-white hover:bg-white hover:text-primary">
                <MessageCircle className="h-5 w-5 mr-2" />
                Chat with Expert
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
