import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  DollarSign, 
  Shield, 
  Heart, 
  Eye, 
  Smile, 
  Home,
  Car,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  ArrowRight
} from "lucide-react";

const needsAnalysisSchema = z.object({
  // Personal Information
  age: z.number().min(18).max(100),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]),
  dependents: z.number().min(0).max(20),
  dependentAges: z.array(z.number()).optional(),
  
  // Financial Information
  annualIncome: z.number().min(0),
  monthlyExpenses: z.number().min(0),
  existingDebts: z.number().min(0),
  existingSavings: z.number().min(0),
  retirementSavings: z.number().min(0),
  
  // Life Insurance Factors
  desiredRetirementAge: z.number().min(50).max(80),
  spouseIncome: z.number().min(0).optional(),
  mortgageBalance: z.number().min(0),
  educationGoals: z.boolean(),
  estimatedEducationCosts: z.number().min(0).optional(),
  
  // Health Information
  healthStatus: z.enum(["excellent", "good", "fair", "poor"]),
  chronicConditions: z.boolean(),
  familyMedicalHistory: z.boolean(),
  prescriptionMedications: z.boolean(),
  
  // Lifestyle Factors
  smoker: z.boolean(),
  occupation: z.string(),
  hobbies: z.array(z.string()),
  travelFrequency: z.enum(["none", "domestic", "international", "frequent"]),
  
  // Existing Coverage
  existingLifeInsurance: z.number().min(0),
  existingHealthInsurance: z.boolean(),
  existingDisabilityInsurance: z.boolean(),
  existingVisionInsurance: z.boolean(),
  existingDentalInsurance: z.boolean()
});

type NeedsAnalysisForm = z.infer<typeof needsAnalysisSchema>;

interface InsuranceRecommendation {
  type: string;
  recommendedAmount: number;
  priority: "high" | "medium" | "low";
  reasoning: string;
  estimatedCost: number;
  coverageGap?: number;
}

interface AnalysisResults {
  lifeInsurance: InsuranceRecommendation;
  healthInsurance: InsuranceRecommendation;
  disabilityInsurance: InsuranceRecommendation;
  dentalInsurance: InsuranceRecommendation;
  visionInsurance: InsuranceRecommendation;
  totalMonthlyPremium: number;
  riskScore: number;
  recommendations: string[];
}

export default function NeedsAnalysisPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<NeedsAnalysisForm>({
    resolver: zodResolver(needsAnalysisSchema),
    defaultValues: {
      age: 35,
      maritalStatus: "single",
      dependents: 0,
      annualIncome: 60000,
      monthlyExpenses: 3000,
      existingDebts: 10000,
      existingSavings: 5000,
      retirementSavings: 20000,
      desiredRetirementAge: 65,
      spouseIncome: 0,
      mortgageBalance: 0,
      educationGoals: false,
      estimatedEducationCosts: 0,
      healthStatus: "good",
      chronicConditions: false,
      familyMedicalHistory: false,
      prescriptionMedications: false,
      smoker: false,
      occupation: "",
      hobbies: [],
      travelFrequency: "domestic",
      existingLifeInsurance: 0,
      existingHealthInsurance: false,
      existingDisabilityInsurance: false,
      existingVisionInsurance: false,
      existingDentalInsurance: false
    }
  });

  const calculateInsuranceNeeds = (data: NeedsAnalysisForm): AnalysisResults => {
    // Life Insurance Calculation (using DIME method + Human Life Value)
    const yearsToRetirement = data.desiredRetirementAge - data.age;
    const incomeReplacement = data.annualIncome * 10; // 10x annual income rule
    const debtCoverage = data.existingDebts + data.mortgageBalance;
    const educationCosts = data.educationGoals ? (data.estimatedEducationCosts || 100000) : 0;
    const finalExpenses = 15000; // Average funeral/estate costs
    
    const lifeInsuranceNeed = incomeReplacement + debtCoverage + educationCosts + finalExpenses;
    const lifeInsuranceGap = Math.max(0, lifeInsuranceNeed - data.existingLifeInsurance);

    // Health factors for premium calculation
    const healthMultiplier = {
      excellent: 0.8,
      good: 1.0,
      fair: 1.3,
      poor: 1.8
    }[data.healthStatus];

    const smokerMultiplier = data.smoker ? 2.0 : 1.0;
    const ageMultiplier = 1 + (data.age - 25) * 0.02;

    // Risk assessment
    let riskScore = 0;
    if (data.smoker) riskScore += 25;
    if (data.chronicConditions) riskScore += 20;
    if (data.familyMedicalHistory) riskScore += 15;
    if (data.healthStatus === "poor") riskScore += 25;
    if (data.healthStatus === "fair") riskScore += 15;
    if (data.dependents > 0) riskScore += 10;
    if (data.existingDebts > data.annualIncome) riskScore += 20;

    // Premium calculations (estimated annual costs)
    const lifeInsurancePremium = (lifeInsuranceGap / 1000) * 1.5 * healthMultiplier * smokerMultiplier * ageMultiplier;
    const healthInsurancePremium = data.existingHealthInsurance ? 0 : 400 * 12; // $400/month average
    const disabilityPremium = data.existingDisabilityInsurance ? 0 : (data.annualIncome * 0.02);
    const dentalPremium = data.existingDentalInsurance ? 0 : 50 * 12;
    const visionPremium = data.existingVisionInsurance ? 0 : 20 * 12;

    const totalMonthlyPremium = (lifeInsurancePremium + healthInsurancePremium + disabilityPremium + dentalPremium + visionPremium) / 12;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (lifeInsuranceGap > 0) {
      recommendations.push("Consider increasing life insurance coverage to protect your dependents");
    }
    if (!data.existingHealthInsurance) {
      recommendations.push("Health insurance is essential - consider comprehensive coverage");
    }
    if (!data.existingDisabilityInsurance && data.annualIncome > 30000) {
      recommendations.push("Disability insurance protects your income if you cannot work");
    }
    if (data.smoker) {
      recommendations.push("Quitting smoking can significantly reduce insurance premiums");
    }
    if (riskScore > 50) {
      recommendations.push("Consider regular health checkups to manage risk factors");
    }

    return {
      lifeInsurance: {
        type: "Life Insurance",
        recommendedAmount: lifeInsuranceNeed,
        priority: lifeInsuranceGap > 100000 ? "high" : lifeInsuranceGap > 0 ? "medium" : "low",
        reasoning: `Based on 10x income rule plus debts, education goals, and final expenses`,
        estimatedCost: lifeInsurancePremium / 12,
        coverageGap: lifeInsuranceGap
      },
      healthInsurance: {
        type: "Health Insurance",
        recommendedAmount: 0,
        priority: !data.existingHealthInsurance ? "high" : "low",
        reasoning: "Essential for medical expense protection",
        estimatedCost: healthInsurancePremium / 12
      },
      disabilityInsurance: {
        type: "Disability Insurance",
        recommendedAmount: data.annualIncome * 0.6,
        priority: !data.existingDisabilityInsurance && data.annualIncome > 30000 ? "high" : "medium",
        reasoning: "Replaces 60% of income if unable to work",
        estimatedCost: disabilityPremium / 12
      },
      dentalInsurance: {
        type: "Dental Insurance",
        recommendedAmount: 0,
        priority: !data.existingDentalInsurance ? "medium" : "low",
        reasoning: "Covers routine dental care and procedures",
        estimatedCost: dentalPremium / 12
      },
      visionInsurance: {
        type: "Vision Insurance",
        recommendedAmount: 0,
        priority: !data.existingVisionInsurance ? "low" : "low",
        reasoning: "Covers eye exams and corrective lenses",
        estimatedCost: visionPremium / 12
      },
      totalMonthlyPremium,
      riskScore: Math.min(100, riskScore),
      recommendations
    };
  };

  const onSubmit = (data: NeedsAnalysisForm) => {
    setIsCalculating(true);
    
    // Simulate calculation time
    setTimeout(() => {
      const results = calculateInsuranceNeeds(data);
      setAnalysisResults(results);
      setIsCalculating(false);
      setCurrentStep(5);
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <Info className="h-4 w-4" />;
      case "low": return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const steps = [
    { id: 1, title: "Personal Info", icon: Users },
    { id: 2, title: "Financial Details", icon: DollarSign },
    { id: 3, title: "Health & Lifestyle", icon: Heart },
    { id: 4, title: "Current Coverage", icon: Shield },
    { id: 5, title: "Results", icon: Calculator }
  ];

  if (isCalculating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="py-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-8"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Analyzing Your Insurance Needs
            </h2>
            <p className="text-gray-600 mb-8">
              We're calculating personalized recommendations based on your information...
            </p>
            <Progress value={75} className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Insurance Needs Analysis Calculator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get personalized insurance recommendations based on your unique situation and financial goals
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    currentStep >= step.id 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-primary' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-gray-400 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {analysisResults ? (
            /* Results Display */
            <div className="space-y-8">
              {/* Overall Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Your Insurance Analysis Summary
                  </CardTitle>
                  <CardDescription>
                    Based on your personal and financial information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {formatCurrency(analysisResults.totalMonthlyPremium)}
                      </div>
                      <p className="text-gray-600">Estimated Monthly Premium</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {analysisResults.riskScore}%
                      </div>
                      <p className="text-gray-600">Risk Assessment Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {analysisResults.recommendations.length}
                      </div>
                      <p className="text-gray-600">Key Recommendations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(analysisResults).filter(([key]) => 
                  ['lifeInsurance', 'healthInsurance', 'disabilityInsurance', 'dentalInsurance', 'visionInsurance'].includes(key)
                ).map(([key, recommendation]) => (
                  <Card key={key}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {key === 'lifeInsurance' && <Heart className="h-5 w-5" />}
                          {key === 'healthInsurance' && <Shield className="h-5 w-5" />}
                          {key === 'disabilityInsurance' && <Users className="h-5 w-5" />}
                          {key === 'dentalInsurance' && <Smile className="h-5 w-5" />}
                          {key === 'visionInsurance' && <Eye className="h-5 w-5" />}
                          {recommendation.type}
                        </CardTitle>
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {getPriorityIcon(recommendation.priority)}
                          <span className="ml-1 capitalize">{recommendation.priority}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recommendation.recommendedAmount > 0 && (
                          <div>
                            <p className="text-sm text-gray-600">Recommended Coverage</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(recommendation.recommendedAmount)}
                            </p>
                          </div>
                        )}
                        
                        {recommendation.coverageGap && recommendation.coverageGap > 0 && (
                          <div>
                            <p className="text-sm text-gray-600">Coverage Gap</p>
                            <p className="text-lg font-semibold text-red-600">
                              {formatCurrency(recommendation.coverageGap)}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-gray-600">Estimated Monthly Cost</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(recommendation.estimatedCost)}
                          </p>
                        </div>

                        <p className="text-sm text-gray-700">
                          {recommendation.reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Key Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Key Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResults.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <p className="text-blue-900">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <Button onClick={() => {
                  setAnalysisResults(null);
                  setCurrentStep(1);
                  form.reset();
                }}>
                  Start New Analysis
                </Button>
                <Button variant="outline">
                  Download Report
                </Button>
                <Button className="flex items-center gap-2">
                  Get Quotes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Form Steps */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Tell us about yourself and your family situation
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maritalStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marital Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="single">Single</SelectItem>
                                  <SelectItem value="married">Married</SelectItem>
                                  <SelectItem value="divorced">Divorced</SelectItem>
                                  <SelectItem value="widowed">Widowed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dependents"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Dependents</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="occupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Occupation</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Software Engineer, Teacher" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Financial Information */}
                {currentStep === 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Financial Information
                      </CardTitle>
                      <CardDescription>
                        Your income, expenses, and financial obligations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="annualIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Income</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  placeholder="$60,000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="monthlyExpenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Expenses</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  placeholder="$3,000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="existingDebts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Existing Debts</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  placeholder="$10,000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="existingSavings"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Savings</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  placeholder="$5,000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="mortgageBalance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mortgage Balance</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  placeholder="$200,000"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="desiredRetirementAge"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Desired Retirement Age</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 65)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="educationGoals"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I plan to pay for children's education
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        {form.watch("educationGoals") && (
                          <FormField
                            control={form.control}
                            name="estimatedEducationCosts"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estimated Education Costs</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    placeholder="$100,000"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Health & Lifestyle */}
                {currentStep === 3 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Health & Lifestyle
                      </CardTitle>
                      <CardDescription>
                        Information about your health and lifestyle factors
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="healthStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Overall Health Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="excellent">Excellent</SelectItem>
                                  <SelectItem value="good">Good</SelectItem>
                                  <SelectItem value="fair">Fair</SelectItem>
                                  <SelectItem value="poor">Poor</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="travelFrequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Travel Frequency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Rarely Travel</SelectItem>
                                  <SelectItem value="domestic">Domestic Travel</SelectItem>
                                  <SelectItem value="international">International Travel</SelectItem>
                                  <SelectItem value="frequent">Frequent Traveler</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="smoker"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>I am a smoker</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="chronicConditions"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>I have chronic health conditions</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="familyMedicalHistory"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Family history of serious medical conditions</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="prescriptionMedications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>I take prescription medications regularly</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Current Coverage */}
                {currentStep === 4 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Current Insurance Coverage
                      </CardTitle>
                      <CardDescription>
                        Tell us about your existing insurance policies
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="existingLifeInsurance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Existing Life Insurance Coverage Amount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                placeholder="$100,000"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="existingHealthInsurance"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>I have health insurance</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="existingDisabilityInsurance"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>I have disability insurance</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="existingDentalInsurance"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>I have dental insurance</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="existingVisionInsurance"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>I have vision insurance</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(currentStep + 1)}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button type="submit">
                      Calculate My Needs
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}