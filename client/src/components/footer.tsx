import { Shield, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const insuranceTypes = [
    { name: "Life Insurance", href: "/life-insurance" },
    { name: "Health Insurance", href: "/health-insurance" },
    { name: "Dental Insurance", href: "/dental-insurance" },
    { name: "Vision Insurance", href: "/vision-insurance" },
    { name: "Hospital Indemnity", href: "/hospital-indemnity-insurance" },
    { name: "Discount Health Plans", href: "/discount-health-insurance" },
  ];

  const supportLinks = [
    { name: "Claims Assistance", href: "/claims-assistance" },
    { name: "Compare Quotes", href: "/quotes" },
    { name: "All Insurance Types", href: "/insurance-types" },
    { name: "Customer Support", href: "#" },
    { name: "Payment Help", href: "#" },
    { name: "FAQ", href: "#" },
  ];

  const companyLinks = [
    { name: "About Us", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Contact", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-primary" />
              InsureScope
            </h3>
            <p className="text-gray-300 mb-6">
              Your trusted partner for affordable, comprehensive insurance coverage with expert guidance every step of the way.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Insurance Types */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Insurance Types</h4>
            <ul className="space-y-2 text-gray-300">
              {insuranceTypes.map((type) => (
                <li key={type.name}>
                  <Link href={type.href}>
                    <a className="hover:text-white transition-colors">
                      {type.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith("#") ? (
                    <a href={link.href} className="hover:text-white transition-colors">
                      {link.name}
                    </a>
                  ) : (
                    <Link href={link.href}>
                      <a className="hover:text-white transition-colors">
                        {link.name}
                      </a>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-300">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2023 InsureScope. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0 text-gray-400">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-400" />
                <span className="text-sm">SSL Secured</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">Licensed & Regulated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
