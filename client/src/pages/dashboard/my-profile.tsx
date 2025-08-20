import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Camera, 
  Palette, 
  Save, 
  Upload,
  Calendar,
  Phone,
  MapPin,
  Mail,
  FileText,
  Shield,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const memberProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bio: z.string().optional(),
  emergencyContact: z.string().optional(),
  avatarType: z.enum(["initials", "image", "generated"]).optional(),
  avatarColor: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

const avatarColors = [
  "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"
];

export default function MyProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAvatarColor, setSelectedAvatarColor] = useState("#0EA5E9");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch member profile
  const { data: memberProfile, isLoading } = useQuery({
    queryKey: ["/api/member-profile"],
  });

  // Update member profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/member-profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Profile updated successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/member-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update profile", 
        variant: "destructive" 
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(memberProfileSchema),
    defaultValues: {
      firstName: memberProfile?.firstName || user?.firstName || "",
      lastName: memberProfile?.lastName || user?.lastName || "",
      email: memberProfile?.email || user?.email || "",
      phone: memberProfile?.phone || user?.phone || "",
      address: memberProfile?.address || user?.address || "",
      city: memberProfile?.city || user?.city || "",
      state: memberProfile?.state || user?.state || "",
      zipCode: memberProfile?.zipCode || user?.zipCode || "",
      dateOfBirth: memberProfile?.dateOfBirth ? format(new Date(memberProfile.dateOfBirth), 'yyyy-MM-dd') : (user?.dateOfBirth ? format(new Date(user.dateOfBirth), 'yyyy-MM-dd') : ""),
      bio: memberProfile?.bio || "",
      emergencyContact: memberProfile?.emergencyContact || "",
      avatarType: memberProfile?.avatarType || "initials",
      avatarColor: memberProfile?.avatarColor || "#0EA5E9",
      profileImageUrl: memberProfile?.profileImageUrl || user?.profileImageUrl || "",
    },
  });

  // Update form when memberProfile loads
  useState(() => {
    if (memberProfile) {
      form.reset({
        firstName: memberProfile.firstName || user?.firstName || "",
        lastName: memberProfile.lastName || user?.lastName || "",
        email: memberProfile.email || user?.email || "",
        phone: memberProfile.phone || user?.phone || "",
        address: memberProfile.address || user?.address || "",
        city: memberProfile.city || user?.city || "",
        state: memberProfile.state || user?.state || "",
        zipCode: memberProfile.zipCode || user?.zipCode || "",
        dateOfBirth: memberProfile.dateOfBirth ? format(new Date(memberProfile.dateOfBirth), 'yyyy-MM-dd') : (user?.dateOfBirth ? format(new Date(user.dateOfBirth), 'yyyy-MM-dd') : ""),
        bio: memberProfile.bio || "",
        emergencyContact: memberProfile.emergencyContact || "",
        avatarType: memberProfile.avatarType || "initials",
        avatarColor: memberProfile.avatarColor || "#0EA5E9",
        profileImageUrl: memberProfile.profileImageUrl || user?.profileImageUrl || "",
      });
      setSelectedAvatarColor(memberProfile.avatarColor || "#0EA5E9");
    }
  });

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate({
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
      avatarColor: selectedAvatarColor,
    });
  };

  const avatarType = form.watch("avatarType");
  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");

  const getAvatarDisplay = () => {
    const currentAvatarType = avatarType || memberProfile?.avatarType || "initials";
    const profileImageUrl = form.watch("profileImageUrl") || memberProfile?.profileImageUrl || user?.profileImageUrl;
    
    if (currentAvatarType === "image" && profileImageUrl) {
      return (
        <Avatar className="h-24 w-24">
          <AvatarImage src={profileImageUrl} alt="Profile" />
          <AvatarFallback style={{ backgroundColor: selectedAvatarColor }}>
            {firstName?.[0] || user?.firstName?.[0] || "U"}
            {lastName?.[0] || user?.lastName?.[0] || ""}
          </AvatarFallback>
        </Avatar>
      );
    } else {
      return (
        <div 
          className="h-24 w-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: selectedAvatarColor }}
        >
          {firstName?.[0] || user?.firstName?.[0] || "U"}
          {lastName?.[0] || user?.lastName?.[0] || ""}
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="My Profile" requiredRoles={["Member"]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile" requiredRoles={["Member"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              Member #{memberProfile?.memberNumber || "Pending"}
            </Badge>
            <Badge variant={memberProfile?.membershipStatus === "Active" ? "default" : "secondary"}>
              {memberProfile?.membershipStatus || "Active"}
            </Badge>
          </div>
        </div>

        {/* Avatar and Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Picture & Avatar
            </CardTitle>
            <CardDescription>
              Choose how you want to be displayed across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              {/* Avatar Preview */}
              <div className="text-center space-y-2">
                {getAvatarDisplay()}
                <p className="text-sm text-gray-600">Preview</p>
              </div>

              {/* Avatar Options */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium">Avatar Type</label>
                  <Select 
                    value={avatarType} 
                    onValueChange={(value) => form.setValue("avatarType", value as "initials" | "image" | "generated")}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initials">Initials</SelectItem>
                      <SelectItem value="image">Custom Image</SelectItem>
                      <SelectItem value="generated">Generated Avatar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {avatarType === "image" && (
                  <div>
                    <label className="text-sm font-medium">Profile Image URL</label>
                    <div className="flex space-x-2">
                      <Input
                        {...form.register("profileImageUrl")}
                        placeholder="https://example.com/avatar.jpg"
                        disabled={!isEditing}
                      />
                      <Button variant="outline" disabled={!isEditing}>
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Avatar Color</label>
                  <div className="flex space-x-2 mt-2">
                    {avatarColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 ${selectedAvatarColor === color ? 'border-gray-900' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedAvatarColor(color)}
                        disabled={!isEditing}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic contact information and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} className="pl-10" disabled={!isEditing} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} className="pl-10" disabled={!isEditing} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} type="date" className="pl-10" disabled={!isEditing} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} className="pl-10" disabled={!isEditing} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Tell us a little about yourself..."
                          disabled={!isEditing}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Heart className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            className="pl-10"
                            placeholder="Name and phone number"
                            disabled={!isEditing}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <div>
                    {!isEditing ? (
                      <Button 
                        type="button" 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="space-x-2">
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    {memberProfile?.membershipDate && (
                      <p>Member since {format(new Date(memberProfile.membershipDate), 'MMMM yyyy')}</p>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}