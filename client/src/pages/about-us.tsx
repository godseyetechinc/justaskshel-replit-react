import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Heart, Users, Award, CheckCircle, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import aboutUsImage from "@assets/generated_images/Insurance_agency_team_meeting_e804d62c.png";

export default function AboutUs() {
  const values = [
    {
      icon: Shield,
      title: "Trust & Integrity",
      description: "We build lasting relationships through honest communication and reliable service."
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "Your needs and satisfaction are at the center of everything we do."
    },
    {
      icon: Users,
      title: "Expert Guidance",
      description: "Our experienced team provides personalized advice tailored to your unique situation."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for the highest standards in service quality and professional expertise."
    }
  ];

  const teamMembers = [
    {
      name: "Sarah Johnson",
      title: "Founder & CEO",
      experience: "15+ years",
      specialization: "Life & Health Insurance"
    },
    {
      name: "Michael Chen",
      title: "Senior Insurance Advisor",
      experience: "12+ years",
      specialization: "Commercial & Business Insurance"
    },
    {
      name: "Emily Rodriguez",
      title: "Customer Success Manager",
      experience: "8+ years",
      specialization: "Claims & Customer Support"
    },
    {
      name: "David Thompson",
      title: "Insurance Consultant",
      experience: "10+ years",
      specialization: "Auto & Property Insurance"
    }
  ];

  const milestones = [
    {
      year: "2015",
      achievement: "JustAskShel founded with a mission to simplify insurance shopping"
    },
    {
      year: "2017",
      achievement: "Expanded to serve customers across multiple states"
    },
    {
      year: "2020",
      achievement: "Launched digital platform for seamless online insurance comparison"
    },
    {
      year: "2022",
      achievement: "Achieved 50,000+ satisfied customers milestone"
    },
    {
      year: "2024",
      achievement: "Introduced AI-powered recommendation engine for personalized quotes"
    }
  ];

  const statistics = [
    { number: "50,000+", label: "Happy Customers" },
    { number: "200+", label: "Insurance Partners" },
    { number: "98%", label: "Customer Satisfaction" },
    { number: "24/7", label: "Customer Support" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-4">About JustAskShel</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Your Trusted Insurance Partner Since 2015
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                We're committed to helping individuals and families find the right insurance coverage 
                at the best prices. Our team of experienced professionals makes insurance simple, 
                transparent, and accessible for everyone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/quotes">
                  <Button size="lg" className="px-8">
                    Get Started Today
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8">
                  <Phone className="mr-2 h-5 w-5" />
                  Contact Us
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <img 
                src={aboutUsImage} 
                alt="JustAskShel insurance team" 
                className="rounded-2xl shadow-xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Statistics Section */}
        <section className="mb-16">
          <div className="grid md:grid-cols-4 gap-8">
            {statistics.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                  <p className="text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Mission */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              To democratize insurance by making it simple for everyone to understand, compare, 
              and purchase the right coverage for their needs and budget.
            </p>
          </div>
          
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Why Choose JustAskShel?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">Unbiased Recommendations</h4>
                        <p className="text-muted-foreground">We work with hundreds of insurance companies to find you the best coverage and rates.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">Expert Support</h4>
                        <p className="text-muted-foreground">Our licensed insurance professionals guide you through every step of the process.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">Technology-Driven</h4>
                        <p className="text-muted-foreground">Our platform uses advanced algorithms to match you with the most suitable insurance options.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Our Commitment</h3>
                  <p className="text-muted-foreground mb-4">
                    We believe insurance should protect what matters most to you. That's why we're committed to:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Providing transparent, easy-to-understand information</li>
                    <li>• Offering competitive rates from trusted insurers</li>
                    <li>• Delivering exceptional customer service</li>
                    <li>• Supporting you throughout your insurance journey</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Our Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="h-full text-center">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Team */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Expert Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Experience:</span> {member.experience}
                    </div>
                    <div>
                      <span className="font-semibold">Specialization:</span> {member.specialization}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Company Timeline */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">{milestone.year}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg">{milestone.achievement}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get in Touch</CardTitle>
              <CardDescription>
                Ready to find the perfect insurance coverage? We're here to help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Call Us</h3>
                    <p className="text-muted-foreground">1-800-JUST-ASK</p>
                    <p className="text-sm text-muted-foreground">Monday - Friday, 8 AM - 6 PM</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email Us</h3>
                    <p className="text-muted-foreground">support@justaskshel.com</p>
                    <p className="text-sm text-muted-foreground">We respond within 24 hours</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Online Support</h3>
                    <p className="text-muted-foreground">24/7 Live Chat</p>
                    <p className="text-sm text-muted-foreground">Instant assistance available</p>
                  </div>
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