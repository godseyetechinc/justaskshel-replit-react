import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Smile, Shield, DollarSign, Users, CheckCircle, AlertCircle, FileText, Calculator, Crown, Zap, Heart } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import dentalInsuranceImage from "@assets/generated_images/Dental_insurance_office_7270ce5f.png";

export default function DentalInsurance() {
  const preventiveServices = [
    "Routine cleanings (2-4 times per year)",
    "Oral exams and consultations",
    "X-rays and diagnostic imaging",
    "Fluoride treatments",
    "Sealants for children",
    "Oral cancer screenings"
  ];

  const basicServices = [
    "Fillings for cavities",
    "Simple tooth extractions",
    "Root canal treatments",
    "Periodontal (gum) treatment",
    "Emergency dental care",
    "Oral surgery consultations"
  ];

  const majorServices = [
    "Crowns and bridges",
    "Dentures and partials",
    "Dental implants",
    "Complex oral surgery",
    "Orthodontic treatment",
    "Cosmetic procedures"
  ];

  const planTypes = [
    {
      type: "Dental HMO (DHMO)",
      coverage: "80-100%",
      features: [
        "Lower monthly premiums",
        "Assigned primary dentist",
        "Referrals required for specialists",
        "Limited network of providers",
        "Copayments for services",
        "No annual deductibles"
      ]
    },
    {
      type: "Dental PPO (DPPO)",
      coverage: "50-80%",
      features: [
        "Higher monthly premiums",
        "Choose any dentist",
        "No referrals needed",
        "Large network of providers",
        "Percentage-based coverage",
        "Annual deductibles apply"
      ]
    },
    {
      type: "Dental Indemnity",
      coverage: "50-80%",
      features: [
        "Maximum flexibility",
        "Visit any licensed dentist",
        "Reimbursement-based model",
        "Higher out-of-pocket costs",
        "Annual benefit maximums",
        "Claim submission required"
      ]
    }
  ];

  const costBreakdown = [
    { service: "Routine Cleaning", typical: "$75-150", withInsurance: "$0-30" },
    { service: "Basic Filling", typical: "$150-300", withInsurance: "$30-90" },
    { service: "Root Canal", typical: "$800-1,500", withInsurance: "$240-750" },
    { service: "Crown", typical: "$800-1,200", withInsurance: "$400-600" },
    { service: "Dental Implant", typical: "$3,000-5,000", withInsurance: "$1,500-2,500" },
    { service: "Orthodontics", typical: "$3,000-7,000", withInsurance: "$1,500-3,500" }
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
                  <Smile className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Dental Insurance Coverage
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Maintain your oral health with comprehensive dental insurance. 
                From routine cleanings to major procedures, find affordable coverage 
                that keeps your smile healthy and bright.
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
                  Benefits Guide
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <img 
                src={dentalInsuranceImage} 
                alt="Dental insurance office" 
                className="rounded-2xl shadow-xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Coverage Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Dental Insurance Covers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Preventive Care</CardTitle>
                </div>
                <CardDescription>
                  Usually covered at 100% with no deductible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Class I Services</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Essential services to prevent dental problems and maintain oral health.
                  </p>
                  <div className="space-y-2">
                    {preventiveServices.map((service, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Basic Services</CardTitle>
                </div>
                <CardDescription>
                  Typically covered at 70-80% after deductible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Class II Services</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Necessary treatments to restore teeth and address dental problems.
                  </p>
                  <div className="space-y-2">
                    {basicServices.map((service, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Major Services</CardTitle>
                </div>
                <CardDescription>
                  Usually covered at 50% after deductible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Class III Services</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complex procedures to restore function and improve oral health.
                  </p>
                  <div className="space-y-2">
                    {majorServices.map((service, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Plan Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Types of Dental Plans</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {planTypes.map((plan, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle>{plan.type}</CardTitle>
                  <CardDescription>
                    Average coverage: {plan.coverage}
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
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cost Comparison */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Cost Savings with Dental Insurance</CardTitle>
              <CardDescription>
                See how much you can save on common dental procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Service</th>
                      <th className="text-left py-3 px-4">Typical Cost</th>
                      <th className="text-left py-3 px-4">With Insurance</th>
                      <th className="text-left py-3 px-4">Potential Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costBreakdown.map((item, index) => {
                      const typicalLow = parseInt(item.typical.split('-')[0].replace(/[^0-9]/g, ''));
                      const withInsuranceLow = parseInt(item.withInsurance.split('-')[0].replace(/[^0-9]/g, ''));
                      const savings = ((typicalLow - withInsuranceLow) / typicalLow * 100).toFixed(0);
                      
                      return (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4 font-medium">{item.service}</td>
                          <td className="py-3 px-4">{item.typical}</td>
                          <td className="py-3 px-4 text-primary font-medium">{item.withInsurance}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">Up to {savings}% off</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Understanding Your Dental Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Annual Maximum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Most plans have a yearly limit (typically $1,000-$2,000) on benefits paid out.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Deductible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Amount you pay before insurance kicks in, usually $25-$100 per person or family.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Waiting Periods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Time before coverage begins for basic (6 months) and major services (12 months).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Pre-existing Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dental problems that exist before coverage starts may have limited or no coverage.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Dental Insurance Matters */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Why Dental Health Matters</CardTitle>
              <CardDescription className="text-center">
                Oral health is connected to your overall health and wellbeing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Health Benefits</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Heart className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Heart Health</h4>
                        <p className="text-sm text-muted-foreground">
                          Good oral hygiene reduces risk of heart disease and stroke
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Diabetes Management</h4>
                        <p className="text-sm text-muted-foreground">
                          Dental care helps control blood sugar levels in diabetics
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Pregnancy Health</h4>
                        <p className="text-sm text-muted-foreground">
                          Dental health affects pregnancy outcomes and baby's health
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Financial Benefits</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Preventive Savings</h4>
                        <p className="text-sm text-muted-foreground">
                          Regular cleanings prevent costly major procedures
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Early Detection</h4>
                        <p className="text-sm text-muted-foreground">
                          Catch problems early when treatment is less expensive
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Smile className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Quality of Life</h4>
                        <p className="text-sm text-muted-foreground">
                          Maintain confidence with a healthy, attractive smile
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Protect Your Smile Today</CardTitle>
              <CardDescription>
                Find affordable dental insurance that covers the care you need
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/quotes">
                  <Button size="lg" className="px-8">
                    <Calculator className="mr-2 h-5 w-5" />
                    Compare Dental Plans
                  </Button>
                </Link>
                <Link href="/claims-assistance">
                  <Button variant="outline" size="lg" className="px-8">
                    <Users className="mr-2 h-5 w-5" />
                    Get Expert Advice
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