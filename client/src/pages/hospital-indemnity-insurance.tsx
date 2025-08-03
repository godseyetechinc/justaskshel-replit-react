import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Shield, DollarSign, Users, CheckCircle, AlertCircle, FileText, Calculator, Heart, Zap } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export default function HospitalIndemnityInsurance() {
  const coverageBenefits = [
    "Daily cash benefits for hospital stays",
    "Additional benefits for ICU admissions",
    "Outpatient surgery coverage",
    "Emergency room visit benefits",
    "Ambulance transportation coverage",
    "Rehabilitation and skilled nursing benefits"
  ];

  const benefitStructure = [
    { 
      category: "Daily Hospital Benefit",
      amount: "$100-500/day",
      description: "Fixed daily amount paid for each day of hospital confinement"
    },
    {
      category: "ICU Daily Benefit", 
      amount: "$200-1,000/day",
      description: "Enhanced daily benefit when admitted to intensive care unit"
    },
    {
      category: "Outpatient Surgery",
      amount: "$200-1,500",
      description: "One-time payment for qualifying outpatient surgical procedures"
    },
    {
      category: "Emergency Room",
      amount: "$100-500",
      description: "Fixed benefit for emergency room visits due to covered accidents or illnesses"
    },
    {
      category: "Ambulance Service",
      amount: "$200-800",
      description: "Coverage for ground or air ambulance transportation to hospital"
    },
    {
      category: "Rehabilitation",
      amount: "$50-200/day",
      description: "Daily benefit for inpatient rehabilitation or skilled nursing care"
    }
  ];

  const planOptions = [
    {
      level: "Basic Coverage",
      dailyBenefit: "$100-200",
      features: [
        "Hospital confinement benefits",
        "Basic ICU coverage",
        "Emergency room benefits",
        "Ambulance coverage",
        "Guaranteed renewable"
      ]
    },
    {
      level: "Standard Coverage", 
      dailyBenefit: "$250-400",
      features: [
        "Enhanced daily benefits",
        "Increased ICU coverage",
        "Outpatient surgery benefits",
        "Rehabilitation coverage",
        "Family coverage options"
      ]
    },
    {
      level: "Comprehensive Coverage",
      dailyBenefit: "$500+",
      features: [
        "Maximum daily benefits",
        "Premium ICU coverage",
        "Extended benefit periods",
        "Additional wellness benefits",
        "No lifetime maximum"
      ]
    }
  ];

  const eligibilityFactors = [
    { factor: "Age", details: "Typically available for ages 18-74, some plans up to 80" },
    { factor: "Health Questions", details: "Simplified underwriting with basic health questionnaire" },
    { factor: "Pre-existing Conditions", details: "Usually 12-month waiting period for pre-existing conditions" },
    { factor: "Employment", details: "Available for employed, self-employed, and retired individuals" },
    { factor: "State Availability", details: "Plans vary by state due to insurance regulations" }
  ];

  const realWorldExamples = [
    {
      scenario: "3-Day Hospital Stay",
      withoutInsurance: "Out-of-pocket costs after primary insurance",
      withHospitalIndemnity: "$300-1,500 cash benefit (depending on daily benefit)",
      benefit: "Cash helps cover deductibles, copays, and lost income"
    },
    {
      scenario: "ICU Stay (5 days)",
      withoutInsurance: "High out-of-pocket costs for intensive care",
      withHospitalIndemnity: "$1,000-5,000 cash benefit",
      benefit: "Additional funds for specialized care costs"
    },
    {
      scenario: "Outpatient Surgery",
      withoutInsurance: "Surgery center fees and recovery costs",
      withHospitalIndemnity: "$200-1,500 one-time payment",
      benefit: "Covers costs not covered by primary insurance"
    }
  ];

  const whyConsider = [
    {
      reason: "Rising Healthcare Costs",
      description: "Hospital stays average $2,500+ per day, even with insurance you may owe thousands in deductibles and copays",
      icon: DollarSign
    },
    {
      reason: "High Deductible Plans",
      description: "Many people have high-deductible health plans that require significant out-of-pocket spending before coverage kicks in",
      icon: Shield
    },
    {
      reason: "Lost Income",
      description: "Hospital stays often result in time off work, and indemnity benefits can help replace lost wages during recovery",
      icon: Heart
    },
    {
      reason: "Additional Expenses",
      description: "Hospital stays create extra costs like parking, meals for family, childcare, and transportation that insurance doesn't cover",
      icon: Building2
    }
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
                <Building2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Hospital Indemnity Insurance
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Get cash benefits to help with hospital-related expenses that your primary 
              health insurance doesn't cover. Receive direct payments for hospital stays, 
              ICU admissions, and outpatient procedures.
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
        {/* How It Works */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl text-center">How Hospital Indemnity Insurance Works</CardTitle>
              <CardDescription className="text-center">
                Simple cash benefits paid directly to you for covered hospital services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Hospital Admission</h3>
                  <p className="text-sm text-muted-foreground">
                    You're admitted to the hospital for a covered condition
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">File Claim</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit simple claim form with hospital documentation
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Quick Approval</h3>
                  <p className="text-sm text-muted-foreground">
                    Claims are processed quickly with straightforward benefits
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Receive Cash</h3>
                  <p className="text-sm text-muted-foreground">
                    Get direct cash payment to use however you need
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Coverage Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What's Covered</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverageBenefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefit Structure */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Benefit Amounts & Structure</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefitStructure.map((benefit, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{benefit.category}</CardTitle>
                  <CardDescription>
                    <span className="text-xl font-bold text-primary">{benefit.amount}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Plan Options */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Coverage Levels</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {planOptions.map((plan, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle>{plan.level}</CardTitle>
                  <CardDescription>
                    Daily Benefit: <span className="text-primary font-semibold">{plan.dailyBenefit}</span>
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

        {/* Real-World Examples */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Real-World Benefit Examples</CardTitle>
              <CardDescription>
                See how hospital indemnity insurance provides cash benefits in common scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {realWorldExamples.map((example, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-3 text-primary">{example.scenario}</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Typical Out-of-Pocket:</h4>
                        <p className="text-sm text-muted-foreground">{example.withoutInsurance}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Indemnity Benefit:</h4>
                        <p className="text-sm text-primary font-medium">{example.withHospitalIndemnity}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">How It Helps:</h4>
                        <p className="text-sm text-muted-foreground">{example.benefit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Why Consider Hospital Indemnity */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Consider Hospital Indemnity Insurance?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {whyConsider.map((item, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    {item.reason}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Eligibility & Application */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Eligibility & Application Process</CardTitle>
              <CardDescription>
                Understanding who qualifies and how to apply for coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Eligibility Requirements</h3>
                  <div className="space-y-3">
                    {eligibilityFactors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm">{factor.factor}</h4>
                          <p className="text-xs text-muted-foreground">{factor.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-primary/5 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Application Process</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <span className="text-sm">Complete simple health questionnaire</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <span className="text-sm">Choose your daily benefit amount</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <span className="text-sm">Submit application and first payment</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      <span className="text-sm">Receive policy documents and ID card</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Important Notes */}
        <section className="mb-16">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-5 w-5" />
                Important Considerations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-amber-800 dark:text-amber-200">Waiting Periods</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-amber-700 dark:text-amber-300">• Accidents: Usually covered immediately</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">• Illness: Typically 30-day waiting period</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">• Pre-existing conditions: 12-month waiting period</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-amber-800 dark:text-amber-200">Policy Limitations</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-amber-700 dark:text-amber-300">• Benefits are paid per occurrence, not lifetime</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">• Maximum benefit periods may apply (365 days)</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">• Some treatments may be excluded</p>
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
              <CardTitle className="text-2xl">Protect Against Hospital Costs</CardTitle>
              <CardDescription>
                Get cash benefits to help with hospital expenses that your health insurance doesn't cover
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/quotes">
                  <Button size="lg" className="px-8">
                    <Calculator className="mr-2 h-5 w-5" />
                    Get Hospital Indemnity Quotes
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