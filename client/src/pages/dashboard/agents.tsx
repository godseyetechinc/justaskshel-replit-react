import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Star, 
  Users, 
  Award, 
  Mail, 
  Phone, 
  MapPin,
  Clock,
  CheckCircle,
  Filter,
  UserCheck,
  LayoutGrid,
  List
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useAuth } from "@/hooks/useAuth";
import { OrganizationBadge } from "@/components/organization-badge";

interface AgentProfile {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  organization?: {
    id: number;
    name: string;
    displayName: string;
  };
  profile?: {
    id: number;
    specializations: string[];
    bio: string;
    yearsExperience: number;
    languagesSpoken: string[];
    certifications: string[];
    contactPreferences: any;
    availabilitySchedule: any;
    clientCapacity: number;
    currentClientCount: number;
    isAcceptingNewClients: boolean;
    performanceRating: number;
    lastActiveAt: string;
  };
}

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [groupByOrganization, setGroupByOrganization] = useState(false);
  const { hasMinimumPrivilegeLevel } = useRoleAuth();
  const { user } = useAuth();

  // Fetch agents with scope awareness - SuperAdmin sees all orgs, others see their org
  // Phase 1-4: SuperAdmin Cross-Organization Access with Pagination
  const { data: agentsResponse, isLoading } = useQuery({
    queryKey: ["/api/agents"],
    enabled: hasMinimumPrivilegeLevel(2),
  }) as { data: { data: AgentProfile[]; pagination: any } | undefined; isLoading: boolean };

  const agents = agentsResponse?.data;

  const filteredAgents = agents?.filter(agent => {
    const searchMatch = agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       agent.profile?.specializations?.some(spec => 
                         spec.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       false;
    
    const specializationMatch = specializationFilter === "all" || 
                               agent.profile?.specializations?.includes(specializationFilter) ||
                               false;
    
    const availabilityMatch = availabilityFilter === "all" || 
                             (availabilityFilter === "available" && agent.profile?.isAcceptingNewClients) ||
                             (availabilityFilter === "unavailable" && !agent.profile?.isAcceptingNewClients);
    
    const experienceMatch = experienceFilter === "all" ||
                           (experienceFilter === "junior" && (agent.profile?.yearsExperience || 0) < 3) ||
                           (experienceFilter === "mid" && (agent.profile?.yearsExperience || 0) >= 3 && (agent.profile?.yearsExperience || 0) < 8) ||
                           (experienceFilter === "senior" && (agent.profile?.yearsExperience || 0) >= 8);
    
    const organizationMatch = organizationFilter === "all" || 
                             agent.organization?.id.toString() === organizationFilter;

    return searchMatch && specializationMatch && availabilityMatch && experienceMatch && organizationMatch;
  }) || [];

  // Get unique organizations for filter dropdown
  const organizations = Array.from(
    new Map(
      agents?.map(agent => agent.organization).filter(Boolean).map(org => [org!.id, org])
    ).values()
  ).sort((a, b) => (a?.id ?? 0) - (b?.id ?? 0));

  // Group agents by organization if enabled
  const groupedAgents = groupByOrganization
    ? filteredAgents.reduce((acc, agent) => {
        const orgKey = agent.organization?.id.toString() || 'unknown';
        if (!acc[orgKey]) {
          acc[orgKey] = {
            organization: agent.organization,
            agents: []
          };
        }
        acc[orgKey].agents.push(agent);
        return acc;
      }, {} as Record<string, { organization: AgentProfile['organization']; agents: AgentProfile[] }>)
    : null;

  const getExperienceLevel = (years: number) => {
    if (years < 3) return "Junior";
    if (years < 8) return "Mid-Level";
    return "Senior";
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Agent Directory" requiredRoles={["Agent", "TenantAdmin", "SuperAdmin"]}>
        <div className="space-y-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agent Directory" requiredRoles={["Agent", "TenantAdmin", "SuperAdmin"]}>
      <div className="space-y-6" data-testid="agents-page">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
              Agent Directory
            </h1>
            <p className="text-muted-foreground">
              {user?.privilegeLevel === 0 ? "Find and connect with agents across all organizations" : "Find and connect with agents in your organization"}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Agents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="search-agents"
                />
              </div>
              <div>
                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                  <SelectTrigger data-testid="filter-specialization">
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                    <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                    <SelectItem value="Business Insurance">Business Insurance</SelectItem>
                    <SelectItem value="Auto Insurance">Auto Insurance</SelectItem>
                    <SelectItem value="Digital Insurance">Digital Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger data-testid="filter-availability">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="available">Accepting Clients</SelectItem>
                    <SelectItem value="unavailable">Not Accepting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger data-testid="filter-experience">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Experience</SelectItem>
                    <SelectItem value="junior">Junior (&lt;3 years)</SelectItem>
                    <SelectItem value="mid">Mid-Level (3-8 years)</SelectItem>
                    <SelectItem value="senior">Senior (8+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* SuperAdmin Organization Filter and Grouping - Phase 3 */}
            {user?.privilegeLevel === 0 && organizations.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                      <SelectTrigger data-testid="filter-organization">
                        <SelectValue placeholder="Organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Organizations</SelectItem>
                        {organizations.map((org) => org && (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            {org.displayName || org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="group-by-org"
                      checked={groupByOrganization}
                      onCheckedChange={setGroupByOrganization}
                      data-testid="toggle-grouping"
                    />
                    <Label htmlFor="group-by-org" className="flex items-center gap-2 cursor-pointer">
                      {groupByOrganization ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                      Group by Organization
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agents Grid - Flat or Grouped */}
        {!groupByOrganization ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="agents-grid">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow" data-testid={`agent-card-${agent.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={""} alt={agent.email} />
                    <AvatarFallback className="text-lg font-semibold">
                      {getInitials(agent.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg" data-testid={`agent-email-${agent.id}`}>
                      {agent.email}
                    </CardTitle>
                    {/* Organization Badge - Phase 3: Enhanced UI */}
                    {agent.organization && user?.privilegeLevel === 0 && (
                      <div className="mt-1">
                        <OrganizationBadge organization={agent.organization} showIcon={false} />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={agent.profile?.isAcceptingNewClients ? "default" : "secondary"}>
                        {agent.profile?.isAcceptingNewClients ? "Available" : "Busy"}
                      </Badge>
                      <Badge variant="outline">
                        {getExperienceLevel(agent.profile?.yearsExperience || 0)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Performance Rating */}
                {agent.profile?.performanceRating && (
                  <div data-testid={`agent-rating-${agent.id}`}>
                    {renderStarRating(agent.profile.performanceRating)}
                  </div>
                )}

                {/* Specializations */}
                {agent.profile?.specializations && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Specializations:</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.profile.specializations.slice(0, 3).map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {agent.profile.specializations.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.profile.specializations.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {agent.profile?.yearsExperience || 0} years
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {agent.profile?.currentClientCount || 0}/{agent.profile?.clientCapacity || 0}
                  </div>
                </div>

                {/* Bio */}
                {agent.profile?.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.profile.bio}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" data-testid={`contact-agent-${agent.id}`}>
                    <Mail className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                  <Button size="sm" variant="outline" data-testid={`view-profile-${agent.id}`}>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedAgents || {}).map(([orgKey, { organization, agents: orgAgents }]) => (
              <div key={orgKey}>
                <div className="mb-4">
                  {organization ? (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{organization.displayName || organization.name}</h2>
                      <Badge variant="outline">{orgAgents.length} agents</Badge>
                    </div>
                  ) : (
                    <h2 className="text-2xl font-bold">Unknown Organization</h2>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid={`agents-grid-org-${orgKey}`}>
                  {orgAgents.map((agent) => (
                    <Card key={agent.id} className="hover:shadow-lg transition-shadow" data-testid={`agent-card-${agent.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={""} alt={agent.email} />
                            <AvatarFallback className="text-lg font-semibold">
                              {getInitials(agent.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg" data-testid={`agent-email-${agent.id}`}>
                              {agent.email}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={agent.profile?.isAcceptingNewClients ? "default" : "secondary"}>
                                {agent.profile?.isAcceptingNewClients ? "Available" : "Busy"}
                              </Badge>
                              <Badge variant="outline">
                                {getExperienceLevel(agent.profile?.yearsExperience || 0)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {agent.profile?.performanceRating && (
                          <div data-testid={`agent-rating-${agent.id}`}>
                            {renderStarRating(agent.profile.performanceRating)}
                          </div>
                        )}

                        {agent.profile?.specializations && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Specializations:</p>
                            <div className="flex flex-wrap gap-1">
                              {agent.profile.specializations.slice(0, 3).map((spec) => (
                                <Badge key={spec} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                              {agent.profile.specializations.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{agent.profile.specializations.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {agent.profile?.yearsExperience || 0} years
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {agent.profile?.currentClientCount || 0}/{agent.profile?.clientCapacity || 0}
                          </div>
                        </div>

                        {agent.profile?.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {agent.profile.bio}
                          </p>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1" data-testid={`contact-agent-${agent.id}`}>
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`view-profile-${agent.id}`}>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredAgents.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSpecializationFilter("all");
                  setAvailabilityFilter("all");
                  setExperienceFilter("all");
                  setOrganizationFilter("all");
                  setGroupByOrganization(false);
                }}
                data-testid="clear-filters"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}