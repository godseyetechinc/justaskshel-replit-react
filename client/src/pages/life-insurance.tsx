import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Heart, DollarSign, Users, CheckCircle, AlertCircle, FileText, Calculator } from "lucide-react";
import { Link } from "wouter";

export default function LifeInsurance() {
  const termLifeBenefits = [
    "Lower premiums compared to permanent life insurance",
    "Coverage for specific time periods (10, 20, 30 years)",
    "Level premiums during the term period",
    "Conversion options to permanent insurance",
    "Simple application process",
    "Tax-free death benefit to beneficiaries"
  ];

  const wholeLifeBenefits = [
    "Lifetime coverage with guaranteed death benefit",
    "Cash value accumulation that grows tax-deferred",
    "Fixed premiums that never increase",
    "Ability to borrow against cash value",
    "Guaranteed minimum interest rate",
    "Dividend potential with participating policies"
  ];

  const universalLifeBenefits = [
    "Flexible premium payments",
    "Adjustable death benefit amounts",
    "Cash value growth tied to market performance",
    "Tax-deferred accumulation",
    "Partial withdrawal options",
    "Investment control options"
  ];

  const factors = [
    { factor: "Age", impact: "Younger applicants typically receive lower premiums" },
    { factor: "Health", impact: "Medical exams and health questionnaires affect rates" },
    { factor: "Lifestyle", impact: "Smoking, drinking, and risky activities increase costs" },
    { factor: "Coverage Amount", impact: "Higher death benefits result in higher premiums" },
    { factor: "Policy Type", impact: "Term life is cheaper than permanent life insurance" },
    { factor: "Gender", impact: "Women typically pay slightly lower premiums" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Life Insurance Coverage
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Protect your family's financial future with comprehensive life insurance coverage. 
              From term life to whole life and universal life policies, find the right protection 
              for your unique needs and budget.
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
                Download Guide
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Types of Life Insurance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Types of Life Insurance</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Term Life Insurance</CardTitle>
                </div>
                <CardDescription>
                  Affordable coverage for a specific period with level premiums
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="secondary">Most Popular</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Perfect for young families and those with temporary financial obligations like mortgages or children's education costs.
                  </p>
                  <div className="space-y-2">
                    {termLifeBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
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
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Whole Life Insurance</CardTitle>
                </div>
                <CardDescription>
                  Permanent coverage with guaranteed cash value accumulation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="outline">Lifetime Coverage</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ideal for estate planning, business succession, and those wanting guaranteed lifetime coverage with savings component.
                  </p>
                  <div className="space-y-2">
                    {wholeLifeBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
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
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Universal Life Insurance</CardTitle>
                </div>
                <CardDescription>
                  Flexible permanent coverage with investment options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="outline">Flexible Premiums</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Best for those who want permanent coverage with flexibility in premiums and death benefits, plus investment growth potential.
                  </p>
                  <div className="space-y-2">
                    {universalLifeBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Coverage Amounts Guide */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How Much Life Insurance Do You Need?</CardTitle>
              <CardDescription>
                Determining the right coverage amount depends on your financial obligations and goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Common Calculation Methods</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">10x Annual Income Rule</h4>
                      <p className="text-sm text-muted-foreground">
                        Multiply your annual income by 10 for basic coverage estimation
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">DIME Method</h4>
                      <p className="text-sm text-muted-foreground">
                        Debt + Income + Mortgage + Education costs for comprehensive coverage
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Human Life Value</h4>
                      <p className="text-sm text-muted-foreground">
                        Calculate the present value of your future earnings potential
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Factors to Consider</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Outstanding debts and mortgages</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Children's education expenses</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Spouse's income replacement needs</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Final expenses and estate taxes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Existing life insurance coverage</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Emergency fund requirements</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Premium Factors */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Affects Your Premiums?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {factors.map((item, index) => (
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

        {/* Why Choose Life Insurance */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Why Life Insurance Matters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Financial Protection</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Income Replacement</h4>
                        <p className="text-sm text-muted-foreground">
                          Ensures your family can maintain their lifestyle after your passing
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Debt Coverage</h4>
                        <p className="text-sm text-muted-foreground">
                          Pays off mortgages, loans, and credit card debts
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Peace of Mind</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Heart className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Family Security</h4>
                        <p className="text-sm text-muted-foreground">
                          Provides emotional and financial stability during difficult times
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Legacy Planning</h4>
                        <p className="text-sm text-muted-foreground">
                          Creates an inheritance and helps with estate planning goals
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
              <CardTitle className="text-2xl">Ready to Protect Your Family?</CardTitle>
              <CardDescription>
                Get personalized life insurance quotes from top-rated insurers in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/quotes">
                  <Button size="lg" className="px-8">
                    <Calculator className="mr-2 h-5 w-5" />
                    Compare Quotes
                  </Button>
                </Link>
                <Link href="/claims-assistance">
                  <Button variant="outline" size="lg" className="px-8">
                    <Users className="mr-2 h-5 w-5" />
                    Speak with Expert
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}