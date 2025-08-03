import { Shield, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  const footerSections = [
    {
      title: "Insurance Types",
      links: [
        "Life Insurance",
        "Health Insurance", 
        "Dental Insurance",
        "Vision Insurance",
        "Hospital Indemnity",
        "Discount Health Plans",
      ]
    },
    {
      title: "Support",
      links: [
        "Claims Assistance",
        "Customer Support",
        "Insurance Advice", 
        "Payment Help",
        "Member Portal",
        "FAQ",
      ]
    },
    {
      title: "Company",
      links: [
        "About Us",
        "Privacy Policy",
        "Terms of Service",
        "Contact",
        "Careers", 
        "Press",
      ]
    }
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

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="text-lg font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2 text-gray-300">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href="#" className="hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
