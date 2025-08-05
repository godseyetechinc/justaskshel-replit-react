import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Shield, DollarSign, Users, CheckCircle, AlertCircle, FileText, Calculator, CreditCard, Percent } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import discountHealthImage from "@assets/generated_images/Discount_health_plans_d5cbd36e.png";

export default function DiscountHealthInsurance() {
  const discountFeatures = [
    "Immediate savings on medical services",
    "No deductibles, copays, or claim forms",
    "Access to discounted prescription medications",
    "Dental and vision care discounts included",
    "Alternative medicine and wellness services",
    "24/7 telemedicine consultations"
  ];

  const coveredServices = [
    { category: "Medical Services", discount: "10-60%", services: ["Doctor visits", "Specialist consultations", "Diagnostic tests", "Laboratory work"] },
    { category: "Prescription Drugs", discount: "10-85%", services: ["Generic medications", "Brand name drugs", "Specialty medications", "Over-the-counter items"] },
    { category: "Dental Care", discount: "10-50%", services: ["Cleanings", "Fillings", "Crowns", "Orthodontics"] },
    { category: "Vision Care", discount: "10-40%", services: ["Eye exams", "Glasses", "Contact lenses", "LASIK surgery"] },
    { category: "Alternative Care", discount: "10-30%", services: ["Chiropractic", "Massage therapy", "Acupuncture", "Nutritional counseling"] },
    { category: "Wellness Services", discount: "10-25%", services: ["Gym memberships", "Weight loss programs", "Smoking cessation", "Mental health counseling"] }
  ];

  const planLevels = [
    {
      level: "Individual Plan",
      monthlyFee: "$19.95-29.95",
      features: [
        "Individual member discounts",
        "Access to provider network",
        "Prescription drug savings",
        "Dental and vision discounts",
        "24/7 telemedicine access"
      ]
    },
    {
      level: "Family Plan",
      monthlyFee: "$29.95-49.95",
      features: [
        "Coverage for entire household",
        "All individual plan benefits",
        "Pediatric care discounts",
        "Maternity care savings",
        "Family wellness programs"
      ]
    },
    {
      level: "Plus Plan",
      monthlyFee: "$39.95-69.95",
      features: [
        "Enhanced discount percentages",
        "Expanded provider network",
        "Additional wellness benefits",
        "Priority customer support",
        "Extended telemedicine hours"
      ]
    }
  ];

  const vsTraditionalInsurance = [
    { feature: "Monthly Cost", discount: "$20-70/month", traditional: "$200-600/month" },
    { feature: "Enrollment Process", discount: "Instant approval", traditional: "Medical underwriting" },
    { feature: "Pre-existing Conditions", discount: "No restrictions", traditional: "May be excluded" },
    { feature: "Annual Limits", discount: "No limits", traditional: "May have caps" },
    { feature: "Claim Forms", discount: "None required", traditional: "Required for reimbursement" },
    { feature: "Provider Choice", discount: "Any participating provider", traditional: "Network restrictions" }
  ];

  const limitations = [
    "Not regulated as insurance - no guarantee of coverage",
    "Savings depend on provider participation and negotiated rates",
    "No coverage for major medical emergencies or hospitalizations",
    "Does not meet ACA minimum essential coverage requirements",
    "Limited to participating providers in your area",
    "Cannot be used with traditional health insurance for same service"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Percent className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Discount Health Plans
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Save money on healthcare services with discount health plans. 
                Get immediate savings on medical care, prescriptions, dental, vision, 
                and wellness services without deductibles or claim forms.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/quotes">
                  <Button size="lg" className="px-8">
                    <Calculator className="mr-2 h-5 w-5" />
                    Get Free Quotes
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8">
                  <FileText className="mr-2 h-5 w-5" />
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <img 
                src={discountHealthImage} 
                alt="Discount health savings" 
                className="rounded-2xl shadow-xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* How It Works */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl text-center">How Discount Health Plans Work</CardTitle>
              <CardDescription className="text-center">
                Simple, immediate savings on healthcare services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Join</h3>
                  <p className="text-sm text-muted-foreground">
                    Pay a low monthly membership fee to access the discount network
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Find Providers</h3>
                  <p className="text-sm text-muted-foreground">
                    Search the network directory for participating healthcare providers
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Show Card</h3>
                  <p className="text-sm text-muted-foreground">
                    Present your membership card at the time of service
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">4. Save Money</h3>
                  <p className="text-sm text-muted-foreground">
                    Pay the discounted rate directly to the provider
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Discount Plan Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discountFeatures.map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Covered Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Services & Savings</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coveredServices.map((category, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category.category}</span>
                    <Badge variant="secondary">{category.discount} off</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.services.map((service, serviceIndex) => (
                      <div key={serviceIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Plan Options */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Membership Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {planLevels.map((plan, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle>{plan.level}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-primary">{plan.monthlyFee}</span>/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-6">
                    Select Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison with Traditional Insurance */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Discount Plans vs Traditional Insurance</CardTitle>
              <CardDescription>
                Understanding the differences between discount plans and traditional health insurance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Feature</th>
                      <th className="text-left py-3 px-4">
                        <Badge className="bg-primary text-primary-foreground">Discount Plans</Badge>
                      </th>
                      <th className="text-left py-3 px-4">
                        <Badge variant="outline">Traditional Insurance</Badge>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vsTraditionalInsurance.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4 font-medium">{item.feature}</td>
                        <td className="py-3 px-4 text-sm text-primary font-medium">{item.discount}</td>
                        <td className="py-3 px-4 text-sm">{item.traditional}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Important Considerations */}
        <section className="mb-16">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-5 w-5" />
                Important: What Discount Plans Are NOT
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                Understanding the limitations of discount health plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-amber-800 dark:text-amber-200">{limitation}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Recommendation: Discount plans work best as a supplement to traditional insurance or for those who cannot qualify for traditional coverage.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Who Should Consider */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Who Should Consider Discount Plans?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-200">Good For</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm text-green-800 dark:text-green-200">People without traditional health insurance</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm text-green-800 dark:text-green-200">Those with high-deductible health plans</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm text-green-800 dark:text-green-200">Individuals seeking dental and vision savings</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm text-green-800 dark:text-green-200">Healthy people with occasional medical needs</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm text-green-800 dark:text-green-200">Those wanting prescription drug savings</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-800 dark:text-red-200">Not Suitable For</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span className="text-sm text-red-800 dark:text-red-200">People with chronic medical conditions</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span className="text-sm text-red-800 dark:text-red-200">Those needing major medical coverage</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span className="text-sm text-red-800 dark:text-red-200">Individuals requiring hospitalization coverage</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span className="text-sm text-red-800 dark:text-red-200">Those in areas with limited provider networks</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span className="text-sm text-red-800 dark:text-red-200">People needing ACA-compliant coverage</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Start Saving on Healthcare Today</CardTitle>
              <CardDescription>
                Join thousands of members saving money on medical, dental, vision, and prescription costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/quotes">
                  <Button size="lg" className="px-8">
                    <Calculator className="mr-2 h-5 w-5" />
                    View Discount Plans
                  </Button>
                </Link>
                <Link href="/claims-assistance">
                  <Button variant="outline" size="lg" className="px-8">
                    <Users className="mr-2 h-5 w-5" />
                    Ask Questions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer />
    </div>
  );
}