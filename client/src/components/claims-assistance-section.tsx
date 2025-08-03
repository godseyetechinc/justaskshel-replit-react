import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  UserCheck, 
  CheckCircle, 
  Phone, 
  MessageCircle, 
  Headphones
} from "lucide-react";

export default function ClaimsAssistanceSection() {
  const claimsSteps = [
    {
      step: 1,
      title: "File Your Claim",
      description: "Submit your claim online or by phone with our simple, step-by-step process. Upload photos and documents directly through your dashboard.",
      icon: FileText,
    },
    {
      step: 2,
      title: "Expert Review", 
      description: "Our claims specialists review your submission and work directly with providers to ensure maximum coverage and fastest processing.",
      icon: UserCheck,
    },
    {
      step: 3,
      title: "Get Results",
      description: "Receive updates in real-time and get your claim resolved quickly. Our team handles all the paperwork and follow-up communications.",
      icon: CheckCircle,
    }
  ];

  const successStories = [
    {
      id: 1,
      text: "InsureScope helped me navigate a complex health claim and got me $12,000 more than I expected!",
      author: "Sarah M., Austin TX",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      id: 2,
      text: "The claims team made the process so easy. Everything was handled professionally and quickly.",
      author: "Michael R., Denver CO", 
      bgColor: "bg-primary-50",
      borderColor: "border-primary-200",
    }
  ];

  return (
    <section className="py-20 bg-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Expert Claims Assistance
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our dedicated claims specialists guide you through every step of the process
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-8">
              {claimsSteps.map((step) => (
                <div key={step.step} className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">{step.step}</span>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                      <step.icon className="h-5 w-5 mr-2" />
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card className="mt-8 border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Headphones className="h-6 w-6 text-primary mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">24/7 Claims Support</h3>
                </div>
                <p className="text-gray-600 mb-4">Get help when you need it most. Our claims specialists are available around the clock.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Support
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Live Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Claims Stats */}
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-8">
                Claims Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-600 mb-2">94%</div>
                  <p className="text-gray-600 font-medium">Claims Approved</p>
                </div>
                
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">3.2</div>
                  <p className="text-gray-600 font-medium">Average Processing Days</p>
                </div>
                
                <div className="text-center">
                  <div className="text-5xl font-bold text-purple-600 mb-2">4.9</div>
                  <p className="text-gray-600 font-medium">Customer Satisfaction Rating</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Recent Success Stories</h4>
                <div className="space-y-4">
                  {successStories.map((story) => (
                    <div key={story.id} className={`${story.bgColor} p-4 rounded-lg border ${story.borderColor}`}>
                      <p className="text-sm text-gray-700">{story.text}</p>
                      <p className="text-xs text-gray-500 mt-2">- {story.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
