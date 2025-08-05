import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Scale, FileText, AlertTriangle, CheckCircle, Shield, Users, Mail, Phone } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import termsImage from "@assets/generated_images/Legal_documents_contracts_desk_311a905e.png";

export default function TermsOfService() {
  const keyTerms = [
    {
      term: "Services",
      definition: "Insurance comparison, quoting, application assistance, and related services provided through our platform"
    },
    {
      term: "User",
      definition: "Any individual who accesses or uses our website, platform, or services"
    },
    {
      term: "Account",
      definition: "Your registered profile on our platform, including personal information and preferences"
    },
    {
      term: "Insurance Partners",
      definition: "Licensed insurance companies and carriers we work with to provide quotes and coverage options"
    }
  ];

  const userResponsibilities = [
    "Provide accurate and complete information when requesting quotes or applying for insurance",
    "Maintain the confidentiality of your account login credentials",
    "Promptly update your information when changes occur",
    "Use our services only for lawful purposes and in accordance with these terms",
    "Respect the intellectual property rights of JustAskShel and third parties",
    "Not attempt to disrupt or compromise the security of our platform"
  ];

  const prohibitedActivities = [
    "Providing false, misleading, or fraudulent information",
    "Using automated systems or bots to access our services",
    "Attempting to reverse engineer or copy our platform",
    "Interfering with other users' access to our services",
    "Transmitting viruses, malware, or other harmful code",
    "Using our services to violate any applicable laws or regulations"
  ];

  const limitations = [
    {
      title: "Service Availability",
      description: "We strive to maintain 24/7 availability but cannot guarantee uninterrupted service due to maintenance, technical issues, or other factors beyond our control."
    },
    {
      title: "Quote Accuracy",
      description: "While we work to provide accurate quotes, final rates and terms are determined by insurance carriers and may differ from initial estimates."
    },
    {
      title: "Insurance Advice",
      description: "We provide information and assistance but do not offer personalized insurance advice. Consult with licensed professionals for specific recommendations."
    },
    {
      title: "Third-Party Content",
      description: "We are not responsible for the accuracy or availability of content from third-party websites or services linked from our platform."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-4">Terms of Service</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Terms of Service Agreement
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                These terms govern your use of JustAskShel's insurance comparison platform and services. 
                Please read these terms carefully before using our services, as they constitute a 
                legally binding agreement between you and JustAskShel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button variant="outline" size="lg" className="px-8">
                  <FileText className="mr-2 h-5 w-5" />
                  Download PDF
                </Button>
                <Button variant="outline" size="lg" className="px-8">
                  <Mail className="mr-2 h-5 w-5" />
                  Legal Questions
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <img 
                src={termsImage} 
                alt="Legal documents and contracts" 
                className="rounded-2xl shadow-xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Last Updated */}
        <div className="mb-8 p-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Last Updated:</strong> January 1, 2024 | <strong>Effective Date:</strong> January 1, 2024
          </p>
        </div>

        {/* Agreement Notice */}
        <section className="mb-16">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Important Legal Agreement</h3>
                  <p className="text-muted-foreground mb-4">
                    By accessing or using JustAskShel's website, platform, or services, you agree to be bound 
                    by these Terms of Service and our Privacy Policy. If you do not agree to these terms, 
                    please do not use our services.
                  </p>
                  <p className="text-muted-foreground">
                    These terms include important provisions such as limitation of liability, dispute resolution, 
                    and other legal rights that affect your relationship with JustAskShel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Acceptance of Terms */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">1. Acceptance of Terms</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  These Terms of Service ("Terms") constitute a legal agreement between you ("User," "you," or "your") 
                  and JustAskShel, LLC ("JustAskShel," "we," "us," or "our") regarding your use of our website, 
                  platform, and services.
                </p>
                <p className="text-muted-foreground">
                  By creating an account, submitting information, or otherwise using our services, you acknowledge 
                  that you have read, understood, and agree to be bound by these Terms and our Privacy Policy, 
                  which is incorporated herein by reference.
                </p>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Note:</strong> If you are using our services on behalf of an organization, you represent 
                    that you have the authority to bind that organization to these Terms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Key Definitions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">2. Definitions</h2>
          <div className="space-y-4">
            {keyTerms.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="font-semibold text-primary min-w-fit">"{item.term}"</div>
                    <div className="text-muted-foreground">{item.definition}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Description of Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">3. Description of Services</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">What We Provide</h3>
                <p className="text-muted-foreground">
                  JustAskShel operates an online platform that helps users compare insurance products, 
                  obtain quotes, and connect with licensed insurance carriers. Our services include:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Core Services</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Insurance comparison tools</li>
                      <li>• Quote generation and comparison</li>
                      <li>• Application assistance</li>
                      <li>• Customer support</li>
                      <li>• Educational resources</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Additional Features</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Policy management tools</li>
                      <li>• Claims assistance</li>
                      <li>• Account dashboard</li>
                      <li>• Mobile application access</li>
                      <li>• Email and phone support</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Important:</strong> JustAskShel is not an insurance company. We are a platform that 
                    connects users with licensed insurance carriers. All insurance policies are issued by 
                    third-party insurance companies.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* User Responsibilities */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">4. User Responsibilities</h2>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Your Obligations</h3>
              <div className="space-y-3">
                {userResponsibilities.map((responsibility, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{responsibility}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Prohibited Activities */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">5. Prohibited Activities</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <div className="space-y-3">
                {prohibitedActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{activity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Violation of these terms may result in immediate suspension or termination of your account 
                  and may expose you to legal liability.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Account Security */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">6. Account Security</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Your Responsibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Keep your login credentials confidential</li>
                  <li>• Use a strong, unique password</li>
                  <li>• Enable two-factor authentication when available</li>
                  <li>• Notify us immediately of any unauthorized access</li>
                  <li>• Log out of shared or public computers</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Our Commitment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Implement industry-standard security measures</li>
                  <li>• Monitor for suspicious account activity</li>
                  <li>• Provide security alerts and notifications</li>
                  <li>• Regularly update our security protocols</li>
                  <li>• Offer account recovery options</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Disclaimers and Limitations */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">7. Disclaimers and Limitations</h2>
          <div className="space-y-6">
            {limitations.map((limitation, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{limitation.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{limitation.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">8. Limitation of Liability</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, JUSTASKSHEL SHALL NOT BE LIABLE FOR ANY 
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT 
                  NOT LIMITED TO:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-6">
                  <li>• Loss of profits, data, or business opportunities</li>
                  <li>• Interruption of business or service delays</li>
                  <li>• Third-party actions or omissions</li>
                  <li>• Technical failures or security breaches</li>
                  <li>• Decisions made based on information provided through our platform</li>
                </ul>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Maximum Liability:</strong> In no event shall our total liability to you for all 
                    damages exceed the amount you have paid to JustAskShel in the twelve (12) months 
                    preceding the claim.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Indemnification */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">9. Indemnification</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                You agree to indemnify, defend, and hold harmless JustAskShel, its officers, directors, 
                employees, agents, and affiliates from and against any claims, liabilities, damages, 
                losses, costs, or expenses arising out of or relating to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Your use of our services or violation of these Terms</li>
                <li>• Your violation of any applicable laws or regulations</li>
                <li>• Information or content you provide through our platform</li>
                <li>• Your negligent or wrongful conduct</li>
                <li>• Any third-party claims arising from your actions</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Termination */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">10. Termination</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Termination by You</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  You may terminate your account at any time by:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Contacting our customer support</li>
                  <li>• Using account closure options in your dashboard</li>
                  <li>• Sending a written request to our legal team</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Termination by Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  We may terminate your access if you:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Violate these Terms of Service</li>
                  <li>• Engage in fraudulent activities</li>
                  <li>• Fail to pay applicable fees</li>
                  <li>• Create security or legal risks</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Governing Law */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">11. Governing Law and Dispute Resolution</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Governing Law</h3>
                  <p className="text-muted-foreground">
                    These Terms shall be governed by and construed in accordance with the laws of the 
                    State of Delaware, without regard to its conflict of law provisions.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Dispute Resolution</h3>
                  <p className="text-muted-foreground mb-3">
                    In the event of a dispute, the parties agree to the following resolution process:
                  </p>
                  <ol className="space-y-2 text-muted-foreground">
                    <li>1. <strong>Direct Negotiation:</strong> First attempt to resolve through direct communication</li>
                    <li>2. <strong>Mediation:</strong> If direct negotiation fails, participate in mediation</li>
                    <li>3. <strong>Binding Arbitration:</strong> Final disputes resolved through binding arbitration</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Changes to Terms */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">12. Changes to These Terms</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these Terms at any time. When we make material changes, 
                we will notify you by:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li>• Posting an updated version on our website</li>
                <li>• Sending an email notification to registered users</li>
                <li>• Displaying a prominent notice on our platform</li>
                <li>• Requiring acceptance for continued use (for significant changes)</li>
              </ul>
              <p className="text-muted-foreground">
                Your continued use of our services after the effective date of any changes constitutes 
                acceptance of the updated Terms.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact Information */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Questions About These Terms?</CardTitle>
              <CardDescription>
                Our legal team is available to help clarify any aspects of these Terms of Service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Email Legal Team</h3>
                  <p className="text-muted-foreground">legal@justaskshel.com</p>
                  <p className="text-sm text-muted-foreground mt-1">Business inquiries and legal questions</p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Call Legal Department</h3>
                  <p className="text-muted-foreground">1-800-LEGAL-01</p>
                  <p className="text-sm text-muted-foreground mt-1">Monday - Friday, 9 AM - 5 PM EST</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
    </div>
  );
}