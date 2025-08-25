import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardLayout from "@/components/dashboard-layout";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Building2,
  Globe,
  Users
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface AgentInfo {
  agents: UserType[];
  organization: {
    id: number;
    name: string;
    displayName: string;
    description: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    logoUrl?: string;
  };
}

export default function MyAgentPage() {
  const { data: agentInfo, isLoading } = useQuery({
    queryKey: ["/api/my-agent"],
  }) as { data: AgentInfo | undefined; isLoading: boolean };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">My Agent</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agentInfo) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">My Agent</h1>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Agent Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No agent information is available for your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { agents, organization } = agentInfo;
  const primaryAgent = agents[0]; // For now, show the first agent

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Agent</h1>
          <p className="text-gray-600">Your insurance agent and organization information</p>
        </div>

        {/* Organization Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {organization.logoUrl && (
                <Avatar className="h-16 w-16">
                  <AvatarImage src={organization.logoUrl || undefined} />
                  <AvatarFallback className="text-lg font-semibold">
                    {organization.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{organization.displayName}</h3>
                {organization.description && (
                  <p className="text-gray-600 mt-1">{organization.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {organization.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{organization.phone}</span>
                </div>
              )}
              {organization.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{organization.email}</span>
                </div>
              )}
              {organization.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a 
                    href={organization.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {organization.website}
                  </a>
                </div>
              )}
              {(organization.address || organization.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {[organization.address, organization.city, organization.state, organization.zipCode]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agent Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={primaryAgent.profileImageUrl || undefined} />
                <AvatarFallback className="font-semibold">
                  {`${primaryAgent.firstName?.charAt(0) || ''}${primaryAgent.lastName?.charAt(0) || ''}`}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {primaryAgent.firstName} {primaryAgent.lastName}
                </h3>
                <Badge variant="secondary" className="mt-1">
                  {primaryAgent.role}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{primaryAgent.email}</span>
              </div>
              {primaryAgent.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{primaryAgent.phone}</span>
                </div>
              )}
            </div>

            {primaryAgent.address && (
              <div className="flex items-center gap-2 pt-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {[primaryAgent.address, primaryAgent.city, primaryAgent.state, primaryAgent.zipCode]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Agents */}
        {agents.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Other Agents ({agents.length - 1})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.slice(1).map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={agent.profileImageUrl} />
                      <AvatarFallback>
                        {`${agent.firstName?.charAt(0) || ''}${agent.lastName?.charAt(0) || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{agent.firstName} {agent.lastName}</p>
                      <p className="text-sm text-gray-600">{agent.email}</p>
                    </div>
                    <Badge variant="outline">{agent.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}