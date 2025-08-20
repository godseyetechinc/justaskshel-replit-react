import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Settings,
  Heart,
  FileText,
  Filter,
  Download,
  MoreVertical
} from "lucide-react";
import type { Member } from "@shared/schema";
import { format } from "date-fns";

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/members/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive",
      });
    },
  });

  const filteredMembers = members?.filter((member: Member) => {
    const matchesSearch = `${member.firstName || ""} ${member.lastName || ""} ${member.email || ""} ${member.memberNumber || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || member.membershipStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default">Active</Badge>;
      case "Inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "Suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAvatarDisplay = (member: Member) => {
    if (member.avatarType === "image" && member.profileImageUrl) {
      return (
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.profileImageUrl} alt={`${member.firstName} ${member.lastName}`} />
          <AvatarFallback style={{ backgroundColor: member.avatarColor || "#0EA5E9" }}>
            {member.firstName?.[0] || "U"}{member.lastName?.[0] || ""}
          </AvatarFallback>
        </Avatar>
      );
    } else {
      return (
        <div 
          className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: member.avatarColor || "#0EA5E9" }}
        >
          {member.firstName?.[0] || "U"}{member.lastName?.[0] || ""}
        </div>
      );
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not provided";
    return format(new Date(date), "MMM dd, yyyy");
  };

  return (
    <DashboardLayout title="Member Profile Management" requiredRoles={["Admin"]}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Member Profile Management</h1>
              <p className="text-sm text-gray-600">
                Manage all member profiles and accounts ({filteredMembers?.length || 0} of {members?.length || 0} members)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or member number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                >
                  {viewMode === "table" ? "Grid View" : "Table View"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading member profiles...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && (!members || members.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Found</h3>
              <p className="text-gray-600 mb-4">
                There are no member profiles in the system yet.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Members Table View */}
        {!isLoading && viewMode === "table" && filteredMembers && filteredMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Member Profiles</CardTitle>
              <CardDescription>
                Comprehensive list of all member profiles with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 font-medium text-gray-900">Member</th>
                      <th className="text-left p-4 font-medium text-gray-900">Contact Info</th>
                      <th className="text-left p-4 font-medium text-gray-900">Member #</th>
                      <th className="text-left p-4 font-medium text-gray-900">Status</th>
                      <th className="text-left p-4 font-medium text-gray-900">Member Since</th>
                      <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {getAvatarDisplay(member)}
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.firstName || "No"} {member.lastName || "Name"}
                              </p>
                              {member.bio && (
                                <p className="text-sm text-gray-600 truncate max-w-48">
                                  {member.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            {member.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-1" />
                                {member.email}
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-3 w-3 mr-1" />
                                {member.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {member.memberNumber}
                          </code>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(member.membershipStatus || "Active")}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(member.membershipDate)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedMember(member)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    {getAvatarDisplay(member)}
                                    {member.firstName} {member.lastName} - Profile Details
                                  </DialogTitle>
                                  <DialogDescription>
                                    Comprehensive member profile information and activity
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedMember && (
                                  <Tabs defaultValue="profile" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                      <TabsTrigger value="profile">Profile</TabsTrigger>
                                      <TabsTrigger value="contact">Contact</TabsTrigger>
                                      <TabsTrigger value="preferences">Preferences</TabsTrigger>
                                      <TabsTrigger value="activity">Activity</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="profile" className="space-y-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                                            <UserCheck className="h-5 w-5" />
                                            Personal Information
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">First Name</label>
                                              <p className="text-gray-900">{selectedMember.firstName || "Not provided"}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Last Name</label>
                                              <p className="text-gray-900">{selectedMember.lastName || "Not provided"}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                                              <p className="text-gray-900">{formatDate(selectedMember.dateOfBirth)}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Member Number</label>
                                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                {selectedMember.memberNumber}
                                              </code>
                                            </div>
                                          </div>
                                          
                                          {selectedMember.bio && (
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Bio</label>
                                              <p className="text-gray-900 mt-1">{selectedMember.bio}</p>
                                            </div>
                                          )}
                                          
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Membership Status</label>
                                              <div className="mt-1">
                                                {getStatusBadge(selectedMember.membershipStatus || "Active")}
                                              </div>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Member Since</label>
                                              <p className="text-gray-900">{formatDate(selectedMember.membershipDate)}</p>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                    
                                    <TabsContent value="contact" className="space-y-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                                            <Mail className="h-5 w-5" />
                                            Contact Information
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Email</label>
                                              <p className="text-gray-900">{selectedMember.email || "Not provided"}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Phone</label>
                                              <p className="text-gray-900">{selectedMember.phone || "Not provided"}</p>
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <label className="text-sm font-medium text-gray-600">Address</label>
                                            <div className="mt-1 space-y-1">
                                              {selectedMember.address && (
                                                <p className="text-gray-900">{selectedMember.address}</p>
                                              )}
                                              {(selectedMember.city || selectedMember.state || selectedMember.zipCode) && (
                                                <p className="text-gray-900">
                                                  {selectedMember.city && `${selectedMember.city}, `}
                                                  {selectedMember.state && `${selectedMember.state} `}
                                                  {selectedMember.zipCode}
                                                </p>
                                              )}
                                              {!selectedMember.address && !selectedMember.city && (
                                                <p className="text-gray-500">Address not provided</p>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {selectedMember.emergencyContact && (
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                                              <p className="text-gray-900 mt-1">{selectedMember.emergencyContact}</p>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                    
                                    <TabsContent value="preferences" className="space-y-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                                            <Settings className="h-5 w-5" />
                                            Avatar & Preferences
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="flex items-center space-x-4">
                                            <div className="text-center">
                                              {selectedMember.avatarType === "image" && selectedMember.profileImageUrl ? (
                                                <Avatar className="h-16 w-16">
                                                  <AvatarImage src={selectedMember.profileImageUrl} />
                                                  <AvatarFallback style={{ backgroundColor: selectedMember.avatarColor || "#0EA5E9" }}>
                                                    {selectedMember.firstName?.[0]}{selectedMember.lastName?.[0]}
                                                  </AvatarFallback>
                                                </Avatar>
                                              ) : (
                                                <div 
                                                  className="h-16 w-16 rounded-full flex items-center justify-center text-white text-lg font-bold"
                                                  style={{ backgroundColor: selectedMember.avatarColor || "#0EA5E9" }}
                                                >
                                                  {selectedMember.firstName?.[0] || "U"}
                                                  {selectedMember.lastName?.[0] || ""}
                                                </div>
                                              )}
                                              <p className="text-sm text-gray-600 mt-2">Current Avatar</p>
                                            </div>
                                            
                                            <div className="flex-1 space-y-2">
                                              <div>
                                                <label className="text-sm font-medium text-gray-600">Avatar Type</label>
                                                <p className="text-gray-900 capitalize">{selectedMember.avatarType || "initials"}</p>
                                              </div>
                                              <div>
                                                <label className="text-sm font-medium text-gray-600">Avatar Color</label>
                                                <div className="flex items-center space-x-2">
                                                  <div 
                                                    className="w-6 h-6 rounded-full border border-gray-300"
                                                    style={{ backgroundColor: selectedMember.avatarColor || "#0EA5E9" }}
                                                  ></div>
                                                  <span className="text-gray-900">{selectedMember.avatarColor || "#0EA5E9"}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {selectedMember.preferences && (
                                            <div>
                                              <label className="text-sm font-medium text-gray-600">Member Preferences</label>
                                              <pre className="text-sm bg-gray-100 p-3 rounded mt-1 overflow-auto">
                                                {JSON.stringify(selectedMember.preferences, null, 2)}
                                              </pre>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                    
                                    <TabsContent value="activity" className="space-y-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Member Activity
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-3">
                                            <div className="text-sm text-gray-600">
                                              <strong>Profile Created:</strong> {formatDate(selectedMember.createdAt)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              <strong>Last Updated:</strong> {formatDate(selectedMember.updatedAt)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              <strong>User ID:</strong> <code className="bg-gray-100 px-1 rounded">{selectedMember.userId}</code>
                                            </div>
                                            
                                            <div className="pt-4 border-t">
                                              <p className="text-sm text-gray-500">
                                                Additional activity data like policies, claims, and applications would be displayed here.
                                              </p>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                  </Tabs>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteMutation.mutate(member.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members Grid View */}
        {!isLoading && viewMode === "grid" && filteredMembers && filteredMembers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getAvatarDisplay(member)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {member.firstName || "No"} {member.lastName || "Name"}
                        </h3>
                        <p className="text-sm text-gray-600">{member.memberNumber}</p>
                      </div>
                    </div>
                    {getStatusBadge(member.membershipStatus || "Active")}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {member.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-2" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {member.phone}
                      </div>
                    )}
                    {(member.city || member.state) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-2" />
                        {member.city && `${member.city}, `}{member.state}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-2" />
                      Member since {formatDate(member.membershipDate)}
                    </div>
                  </div>
                  
                  {member.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{member.bio}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteMutation.mutate(member.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredMembers && filteredMembers.length === 0 && members && members.length > 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Members</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filter criteria to find members.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Members Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMembers && filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member: Member) => (
              <Card key={member.id} className="card-material hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {member.firstName} {member.lastName}
                      </CardTitle>
                      <CardDescription>
                        Member #{member.memberNumber}
                      </CardDescription>
                    </div>
                    {getStatusBadge(member.membershipStatus || "Active")}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {member.email && (
                      <p className="text-gray-600">
                        <span className="font-medium">Email:</span> {member.email}
                      </p>
                    )}
                    {member.phone && (
                      <p className="text-gray-600">
                        <span className="font-medium">Phone:</span> {member.phone}
                      </p>
                    )}
                    {member.city && member.state && (
                      <p className="text-gray-600">
                        <span className="font-medium">Location:</span> {member.city}, {member.state}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <span className="font-medium">Joined:</span>{" "}
                      {member.membershipDate 
                        ? new Date(member.membershipDate).toLocaleDateString()
                        : "N/A"
                      }
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => member.id && deleteMutation.mutate(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-material">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Members Found
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {searchTerm 
                  ? "No members match your search criteria." 
                  : "Get started by adding your first member."
                }
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}