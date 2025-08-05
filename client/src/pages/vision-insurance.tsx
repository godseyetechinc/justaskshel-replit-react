import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Shield, DollarSign, Users, CheckCircle, AlertCircle, FileText, Calculator, Glasses, Zap } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import visionInsuranceImage from "@assets/generated_images/Vision_insurance_clinic_737bf764.png";

export default function VisionInsurance() {
  const eyeExamBenefits = [
    "Comprehensive eye exams (annual or biennial)",
    "Glaucoma and diabetic eye screenings",
    "Contact lens fittings and evaluations",
    "Prescription updates and consultations",
    "Early detection of eye diseases",
    "Pediatric vision screening"
  ];

  const eyewearBenefits = [
    "Prescription eyeglasses frames",
    "Single vision, bifocal, and progressive lenses",
    "Anti-reflective and scratch-resistant coatings",
    "Contact lenses (daily, weekly, monthly)",
    "Specialty lenses for astigmatism",
    "Safety and computer glasses"
  ];

  const advancedServices = [
    "LASIK and refractive surgery discounts",
    "Retinal imaging and OCT scans",
    "Treatment for eye diseases and conditions",
    "Emergency eye care services",
    "Low vision aids and therapy",
    "Specialized contact lens fittings"
  ];

  const planComparison = [
    {
      feature: "Eye Exam",
      basic: "Every 24 months",
      standard: "Every 12 months", 
      premium: "Every 12 months + additional services"
    },
    {
      feature: "Frame Allowance",
      basic: "$100-150",
      standard: "$150-250",
      premium: "$250-400"
    },
    {
      feature: "Lens Coverage",
      basic: "Basic single vision",
      standard: "All lens types + coatings",
      premium: "All lenses + premium features"
    },
    {
      feature: "Contact Lens Allowance", 
      basic: "$100-150",
      standard: "$150-250",
      premium: "$250-400"
    },
    {
      feature: "Additional Discounts",
      basic: "20% off additional pairs",
      standard: "30% off + LASIK discount",
      premium: "40% off + premium services"
    }
  ];

  const providers = [
    {
      name: "National Chains",
      examples: ["LensCrafters", "Pearle Vision", "Sears Optical"],
      benefits: ["Convenient locations", "Extended hours", "Latest technology"]
    },
    {
      name: "Independent Optometrists",
      examples: ["Local eye doctors", "Specialty practices", "Boutique shops"],
      benefits: ["Personalized care", "Unique frame selection", "Specialized services"]
    },
    {
      name: "Online Retailers",
      examples: ["Warby Parker", "Zenni Optical", "EyeBuyDirect"],
      benefits: ["Lower costs", "Home try-on", "Wide selection"]
    }
  ];

  const savingsExamples = [
    { service: "Eye Exam", withoutInsurance: "$150-300", withInsurance: "$10-25", savings: "Up to 90%" },
    { service: "Designer Frames", withoutInsurance: "$200-500", withInsurance: "$50-150", savings: "Up to 70%" },
    { service: "Progressive Lenses", withoutInsurance: "$300-600", withInsurance: "$75-200", savings: "Up to 75%" },
    { service: "Contact Lenses (Annual)", withoutInsurance: "$300-800", withInsurance: "$100-250", savings: "Up to 70%" },
    { service: "LASIK Surgery", withoutInsurance: "$2,000-4,000", withInsurance: "$1,500-3,000", savings: "15-25%" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Eye className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Vision Insurance Coverage
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Protect your vision and save on eye care with comprehensive vision insurance. 
              From routine eye exams to designer frames and contact lenses, 
              keep your eyes healthy while saving money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quotes">
                <Button size="lg" className="px-8">
                  <Calculator className="mr-2 h-5 w-5" />
                  Get Free Quotes
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8">
                <FileText className="mr-2 h-5 w-5" />
                Vision Guide
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* What's Covered */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Vision Insurance Covers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Eye Exams</CardTitle>
                </div>
                <CardDescription>
                  Comprehensive vision and eye health evaluations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Usually Covered 100%</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Essential for maintaining eye health and detecting problems early.
                  </p>
                  <div className="space-y-2">
                    {eyeExamBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Glasses className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Eyewear</CardTitle>
                </div>
                <CardDescription>
                  Frames, lenses, and contact lenses with allowances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Allowance Based</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Coverage for prescription eyewear with annual or biennial allowances.
                  </p>
                  <div className="space-y-2">
                    {eyewearBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
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
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Advanced Services</CardTitle>
                </div>
                <CardDescription>
                  Specialized treatments and discounted procedures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Discounts & Coverage</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Access to advanced eye care services and surgical procedures.
                  </p>
                  <div className="space-y-2">
                    {advancedServices.map((service, index) => (
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

        {/* Plan Comparison */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Vision Plan Comparison</CardTitle>
              <CardDescription>
                Compare different levels of vision insurance coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Feature</th>
                      <th className="text-left py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Basic Plan</Badge>
                        </div>
                      </th>
                      <th className="text-left py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Standard Plan</Badge>
                        </div>
                      </th>
                      <th className="text-left py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-primary-foreground">Premium Plan</Badge>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {planComparison.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4 font-medium">{item.feature}</td>
                        <td className="py-3 px-4 text-sm">{item.basic}</td>
                        <td className="py-3 px-4 text-sm">{item.standard}</td>
                        <td className="py-3 px-4 text-sm text-primary font-medium">{item.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Provider Networks */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Where You Can Use Your Benefits</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {providers.map((provider, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle>{provider.name}</CardTitle>
                  <CardDescription>
                    {provider.examples.join(", ")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {provider.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cost Savings */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How Much You Can Save</CardTitle>
              <CardDescription>
                Real savings examples with vision insurance coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Service</th>
                        <th className="text-left py-2">Without Insurance</th>
                        <th className="text-left py-2">With Insurance</th>
                        <th className="text-left py-2">Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savingsExamples.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 text-sm font-medium">{item.service}</td>
                          <td className="py-2 text-sm">{item.withoutInsurance}</td>
                          <td className="py-2 text-sm text-primary font-medium">{item.withInsurance}</td>
                          <td className="py-2">
                            <Badge variant="secondary" className="text-xs">{item.savings}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-primary/5 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Annual Savings Example</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Eye exam</span>
                      <span className="text-sm font-medium">$200</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Progressive glasses</span>
                      <span className="text-sm font-medium">$400</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Contact lenses</span>
                      <span className="text-sm font-medium">$300</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Potential annual savings:</span>
                      <span className="text-primary">$900+</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Compared to paying out-of-pocket for the same services
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Why Vision Insurance Matters */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Why Vision Care is Important</CardTitle>
              <CardDescription className="text-center">
                Regular eye care is essential for overall health and quality of life
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Health Benefits</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Early Disease Detection</h4>
                        <p className="text-sm text-muted-foreground">
                          Eye exams can detect diabetes, high blood pressure, and other health conditions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Prevent Vision Loss</h4>
                        <p className="text-sm text-muted-foreground">
                          Regular screenings help catch glaucoma, cataracts, and other eye diseases early
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Children's Development</h4>
                        <p className="text-sm text-muted-foreground">
                          Good vision is crucial for learning and development in school-age children
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quality of Life</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Financial Protection</h4>
                        <p className="text-sm text-muted-foreground">
                          Insurance helps make quality eyewear and eye care affordable
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Work Performance</h4>
                        <p className="text-sm text-muted-foreground">
                          Clear vision improves productivity and reduces eye strain from computer work
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Glasses className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Style and Confidence</h4>
                        <p className="text-sm text-muted-foreground">
                          Access to designer frames and quality lenses boosts self-confidence
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Vision Insurance Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Low Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Vision insurance is typically very affordable, often costing less than $15/month for individuals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  No Waiting Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Most vision plans have no waiting periods - you can use benefits immediately after enrollment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Family Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Family plans provide coverage for spouse and children at discounted rates compared to individual plans.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Additional Discounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Many plans offer discounts on additional pairs, LASIK surgery, and other vision-related services.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">See Clearly, Save Money</CardTitle>
              <CardDescription>
                Get vision insurance that covers eye exams, glasses, and contacts at affordable rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/quotes">
                  <Button size="lg" className="px-8">
                    <Calculator className="mr-2 h-5 w-5" />
                    Compare Vision Plans
                  </Button>
                </Link>
                <Link href="/claims-assistance">
                  <Button variant="outline" size="lg" className="px-8">
                    <Users className="mr-2 h-5 w-5" />
                    Speak with Specialist
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