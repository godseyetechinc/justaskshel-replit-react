import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Shield, DollarSign, Users, CheckCircle, AlertCircle, FileText, Calculator, Stethoscope, Pill, Activity } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export default function HealthInsurance() {
  const hmoFeatures = [
    "Lower monthly premiums and out-of-pocket costs",
    "Primary care physician coordination",
    "Referrals required for specialist care",
    "Network-based coverage with limited out-of-network benefits",
    "Emphasis on preventive care and wellness",
    "Lower deductibles and copayments"
  ];

  const ppoFeatures = [
    "Greater flexibility in choosing healthcare providers",
    "No referrals needed for specialist visits",
    "Out-of-network coverage available at higher cost",
    "Higher monthly premiums but more choice",
    "Direct access to specialists nationwide",
    "Larger provider networks"
  ];

  const hdhpFeatures = [
    "Lower monthly premiums with higher deductibles",
    "HSA eligibility for tax-advantaged savings",
    "Coverage for preventive care before deductible",
    "Consumer-driven healthcare approach",
    "Catastrophic coverage protection",
    "Triple tax advantage with HSA contributions"
  ];

  const essentialBenefits = [
    { benefit: "Ambulatory Patient Services", description: "Outpatient care without hospital admission" },
    { benefit: "Emergency Services", description: "Emergency room visits and urgent care" },
    { benefit: "Hospitalization", description: "Inpatient hospital stays and surgeries" },
    { benefit: "Maternity & Newborn Care", description: "Pregnancy, childbirth, and newborn care" },
    { benefit: "Mental Health Services", description: "Behavioral health and substance abuse treatment" },
    { benefit: "Prescription Drugs", description: "Coverage for medications and pharmacy benefits" },
    { benefit: "Rehabilitative Services", description: "Physical therapy and occupational therapy" },
    { benefit: "Laboratory Services", description: "Blood tests, X-rays, and diagnostic imaging" },
    { benefit: "Preventive Services", description: "Annual checkups, screenings, and immunizations" },
    { benefit: "Pediatric Services", description: "Children's healthcare including dental and vision" }
  ];

  const costFactors = [
    { factor: "Age", impact: "Older individuals typically pay higher premiums" },
    { factor: "Location", impact: "Healthcare costs vary significantly by geographic region" },
    { factor: "Tobacco Use", impact: "Smokers pay up to 50% more in premiums" },
    { factor: "Plan Category", impact: "Bronze, Silver, Gold, and Platinum tiers affect costs" },
    { factor: "Family Size", impact: "Additional coverage for spouses and dependents" },
    { factor: "Income Level", impact: "Subsidies available based on household income" }
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
                <Heart className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Health Insurance Coverage
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Secure comprehensive healthcare coverage for you and your family. 
              Compare plans from leading insurers with coverage for medical services, 
              prescription drugs, preventive care, and emergency treatment.
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
                Coverage Guide
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Types of Health Plans */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Types of Health Insurance Plans</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>HMO Plans</CardTitle>
                </div>
                <CardDescription>
                  Health Maintenance Organization with coordinated care approach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="secondary">Lower Cost</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Best for those who want lower costs and don't mind having a primary care physician coordinate their care.
                  </p>
                  <div className="space-y-2">
                    {hmoFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>PPO Plans</CardTitle>
                </div>
                <CardDescription>
                  Preferred Provider Organization with maximum flexibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="outline">Maximum Flexibility</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ideal for those who want choice in providers and direct access to specialists without referrals.
                  </p>
                  <div className="space-y-2">
                    {ppoFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>HDHP Plans</CardTitle>
                </div>
                <CardDescription>
                  High Deductible Health Plans with HSA benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="outline">HSA Eligible</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Perfect for healthy individuals who want lower premiums and tax-advantaged health savings accounts.
                  </p>
                  <div className="space-y-2">
                    {hdhpFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Essential Health Benefits */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Essential Health Benefits</CardTitle>
              <CardDescription>
                All qualified health plans must cover these 10 essential health benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {essentialBenefits.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Stethoscope className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{item.benefit}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Plan Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Health Plan Metal Tiers</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <div className="text-center">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full w-fit mx-auto mb-3">
                    <Shield className="h-6 w-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-amber-600">Bronze</CardTitle>
                  <CardDescription>60% Coverage</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Lowest premiums</p>
                  <p className="text-sm font-medium">Highest deductibles</p>
                  <p className="text-sm text-muted-foreground">
                    Good for healthy individuals who want catastrophic protection
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-center">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-3">
                    <Shield className="h-6 w-6 text-gray-600" />
                  </div>
                  <CardTitle className="text-gray-600">Silver</CardTitle>
                  <CardDescription>70% Coverage</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Moderate premiums</p>
                  <p className="text-sm font-medium">Moderate deductibles</p>
                  <p className="text-sm text-muted-foreground">
                    Most popular choice with balanced costs and benefits
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full w-fit mx-auto mb-3">
                    <Shield className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-yellow-600">Gold</CardTitle>
                  <CardDescription>80% Coverage</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Higher premiums</p>
                  <p className="text-sm font-medium">Lower deductibles</p>
                  <p className="text-sm text-muted-foreground">
                    Great for those who use healthcare services regularly
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-center">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-3">
                    <Shield className="h-6 w-6 text-slate-600" />
                  </div>
                  <CardTitle className="text-slate-600">Platinum</CardTitle>
                  <CardDescription>90% Coverage</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Highest premiums</p>
                  <p className="text-sm font-medium">Lowest deductibles</p>
                  <p className="text-sm text-muted-foreground">
                    Best for those with chronic conditions or high medical needs
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cost Factors */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Affects Your Health Insurance Costs?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {costFactors.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    {item.factor}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.impact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Preventive Care Benefits */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Preventive Care at No Extra Cost</CardTitle>
              <CardDescription className="text-center">
                All health plans cover these preventive services without deductibles or copayments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Screenings & Tests
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Annual wellness visits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Cancer screenings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Blood pressure checks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Cholesterol screening</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Immunizations
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Flu shots</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Routine vaccinations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Travel immunizations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">HPV vaccines</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Counseling Services
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Tobacco cessation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Weight management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Alcohol screening</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Depression screening</span>
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
              <CardTitle className="text-2xl">Find Your Perfect Health Plan</CardTitle>
              <CardDescription>
                Compare comprehensive health insurance plans and find coverage that fits your needs and budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/quotes">
                  <Button size="lg" className="px-8">
                    <Calculator className="mr-2 h-5 w-5" />
                    Compare Plans
                  </Button>
                </Link>
                <Link href="/claims-assistance">
                  <Button variant="outline" size="lg" className="px-8">
                    <Users className="mr-2 h-5 w-5" />
                    Get Expert Help
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