import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Eye, UserCheck, FileText, Mail, Phone } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import privacyImage from "@assets/generated_images/Insurance_office_privacy_security_ac88aa84.png";

export default function PrivacyPolicy() {
  const dataTypes = [
    {
      category: "Personal Information",
      description: "Name, address, phone number, email, date of birth, Social Security number",
      icon: UserCheck
    },
    {
      category: "Insurance Information",
      description: "Policy details, coverage preferences, claims history, premium payments",
      icon: Shield
    },
    {
      category: "Technical Information",
      description: "IP address, browser type, device information, website usage data",
      icon: Eye
    },
    {
      category: "Financial Information",
      description: "Bank account details, payment methods, credit information (when applicable)",
      icon: Lock
    }
  ];

  const protectionMeasures = [
    "256-bit SSL encryption for all data transmission",
    "Multi-factor authentication for account access",
    "Regular security audits and vulnerability assessments",
    "Secure data centers with 24/7 monitoring",
    "Employee background checks and privacy training",
    "Strict access controls and data minimization policies"
  ];

  const yourRights = [
    {
      right: "Access Your Data",
      description: "Request a copy of all personal information we have about you"
    },
    {
      right: "Correct Inaccuracies",
      description: "Update or correct any incorrect personal information"
    },
    {
      right: "Delete Your Data",
      description: "Request deletion of your personal information (subject to legal requirements)"
    },
    {
      right: "Data Portability",
      description: "Receive your data in a machine-readable format for transfer to another service"
    },
    {
      right: "Opt-Out of Marketing",
      description: "Unsubscribe from marketing communications at any time"
    },
    {
      right: "Object to Processing",
      description: "Object to certain types of data processing for legitimate interests"
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
              <Badge className="mb-4">Privacy Policy</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Your Privacy is Our Priority
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                We are committed to protecting your personal information and being transparent 
                about how we collect, use, and safeguard your data. This policy explains our 
                privacy practices in clear, understandable terms.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button variant="outline" size="lg" className="px-8">
                  <FileText className="mr-2 h-5 w-5" />
                  Download PDF
                </Button>
                <Button variant="outline" size="lg" className="px-8">
                  <Mail className="mr-2 h-5 w-5" />
                  Contact Privacy Team
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <img 
                src={privacyImage} 
                alt="Privacy and security" 
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

        {/* Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Privacy Policy Overview</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-lg mb-4">
                JustAskShel ("we," "our," or "us") respects your privacy and is committed to protecting 
                your personal information. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you visit our website or use our services.
              </p>
              <p className="text-muted-foreground">
                By using our services, you agree to the collection and use of information in accordance 
                with this policy. If you do not agree with our practices, please do not use our services.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Information We Collect */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Information We Collect</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {dataTypes.map((type, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <type.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{type.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">How We Use Your Information</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Primary Uses</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Provide insurance quotes and recommendations</li>
                    <li>• Process insurance applications and policy purchases</li>
                    <li>• Communicate with you about your policies and services</li>
                    <li>• Provide customer support and assistance</li>
                    <li>• Process claims and handle policy changes</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Secondary Uses</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Improve our website and services</li>
                    <li>• Send marketing communications (with your consent)</li>
                    <li>• Conduct research and analytics</li>
                    <li>• Comply with legal and regulatory requirements</li>
                    <li>• Prevent fraud and ensure security</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How We Protect Your Information */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">How We Protect Your Information</h2>
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Security Measures</h3>
                  <div className="space-y-3">
                    {protectionMeasures.map((measure, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{measure}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Our Commitment</h3>
                  <p className="text-muted-foreground mb-4">
                    We implement appropriate technical and organizational measures to protect your 
                    personal information against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                  <p className="text-muted-foreground">
                    While we strive to protect your information, no method of transmission over the 
                    internet or electronic storage is 100% secure. We cannot guarantee absolute security 
                    but continuously work to improve our security measures.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Information Sharing */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">When We Share Your Information</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Partners</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We share your information with insurance companies to provide quotes and process applications. 
                  All partners are required to maintain strict confidentiality and use your information only 
                  for the specified purposes.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Service Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We may share information with third-party service providers who assist us in operating 
                  our business (such as payment processors, technology providers, and customer support). 
                  These providers are bound by confidentiality agreements.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Legal Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We may disclose your information when required by law, regulation, legal process, 
                  or governmental request, or to protect our rights, property, or safety.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Your Privacy Rights</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {yourRights.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.right}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cookies and Tracking */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Cookies and Tracking Technologies</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to enhance your experience on our website. 
                  Cookies help us remember your preferences, understand how you use our site, and 
                  provide personalized content.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Essential Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Required for basic website functionality and security
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Performance Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how visitors interact with our website
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Marketing Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Used to deliver relevant advertisements and track campaign effectiveness
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Children's Privacy */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Children's Privacy</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Our services are not intended for children under the age of 18. We do not knowingly 
                collect personal information from children under 18. If you are a parent or guardian 
                and believe we have collected information about your child, please contact us immediately.
              </p>
              <p className="text-muted-foreground">
                If we discover we have collected information from a child under 18, we will take 
                immediate steps to delete such information from our systems.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact Information */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Questions About Your Privacy?</CardTitle>
              <CardDescription>
                We're here to help you understand how we protect your information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Email Our Privacy Team</h3>
                  <p className="text-muted-foreground">privacy@justaskshel.com</p>
                  <p className="text-sm text-muted-foreground mt-1">We respond within 48 hours</p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Call Our Privacy Hotline</h3>
                  <p className="text-muted-foreground">1-800-PRIVACY-1</p>
                  <p className="text-sm text-muted-foreground mt-1">Monday - Friday, 9 AM - 5 PM EST</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Changes to Policy */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Changes to This Privacy Policy</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, 
                technology, legal requirements, or other factors. When we make material changes, we will:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li>• Post the updated policy on our website with a new effective date</li>
                <li>• Notify you via email if you have an account with us</li>
                <li>• Provide notice on our website highlighting the changes</li>
                <li>• For significant changes, seek your consent where required by law</li>
              </ul>
              <p className="text-muted-foreground">
                We encourage you to review this Privacy Policy periodically to stay informed about 
                how we protect your information.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
    </div>
  );
}