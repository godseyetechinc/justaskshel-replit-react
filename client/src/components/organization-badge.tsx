import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface OrganizationBadgeProps {
  organization: {
    id: number;
    name: string;
    displayName: string;
  };
  variant?: "default" | "outline" | "secondary";
  showIcon?: boolean;
}

const organizationColors: Record<number, string> = {
  0: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  2: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  3: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  4: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function OrganizationBadge({ 
  organization, 
  variant = "outline", 
  showIcon = true 
}: OrganizationBadgeProps) {
  const colorClass = organizationColors[organization.id] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  
  return (
    <Badge 
      variant={variant} 
      className={variant === "outline" ? colorClass : ""}
      data-testid={`org-badge-${organization.id}`}
    >
      {showIcon && <Building2 className="h-3 w-3 mr-1" />}
      {organization.displayName || organization.name}
    </Badge>
  );
}
