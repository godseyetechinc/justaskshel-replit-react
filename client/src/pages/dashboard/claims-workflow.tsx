import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClaimSchema, insertClaimCommunicationSchema } from "@shared/schema";
import { z } from "zod";
import { 
  FileText, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Upload,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  DollarSign,
  Activity,
  MoreHorizontal,
  Edit,
  Trash2,
  Paperclip,
  Download,
  FileIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const statusColors = {
  draft: "bg-gray-500",
  submitted: "bg-blue-500",
  under_review: "bg-yellow-500",
  approved: "bg-green-500",
  denied: "bg-red-500",
  paid: "bg-purple-500",
  closed: "bg-gray-700"
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

const claimFormSchema = insertClaimSchema.extend({
  incidentDate: z.string().min(1, "Incident date is required"),
  estimatedAmount: z.coerce.number().min(0, "Amount must be positive").optional(),
  policyNumber: z.string().optional(),
  providerName: z.string().optional(),
  providerAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  additionalNotes: z.string().optional(),
});

const communicationFormSchema = insertClaimCommunicationSchema.omit({
  claimId: true,
  userId: true,
  createdAt: true,
});

export default function ClaimsWorkflow() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{fileName: string, uploadURL: string, fileType: string, fileSize: number}>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // File upload handling
  const handleFileUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!selectedClaim || result.successful.length === 0) return;

    try {
      // Process each uploaded file
      for (const file of result.successful) {
        const uploadedFileURL = file.uploadURL;
        const fileName = file.name;
        const fileType = file.type || 'application/octet-stream';
        const fileSize = file.size || 0;

        // Determine document type based on file type
        let documentType = 'other';
        if (fileType.includes('pdf')) documentType = 'receipt';
        else if (fileType.includes('image')) documentType = 'photo';
        else if (fileType.includes('word') || fileType.includes('doc')) documentType = 'medical_record';

        // Attach file to claim
        await apiRequest(`/api/claims/${selectedClaim.id}/documents`, {
          fileName,
          fileType,
          fileSize,
          documentType,
          uploadedFileURL,
        });
      }

      // Refresh documents list
      queryClient.invalidateQueries({
        queryKey: ["/api/claims", selectedClaim.id, "documents"],
      });

      toast({
        title: "Success",
        description: `${result.successful.length} document(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error("Error attaching documents:", error);
      toast({
        title: "Error",
        description: "Failed to attach some documents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (document: any) => {
    try {
      // Create object path from document info
      const objectPath = `/objects/uploads/${document.fileName.split('-')[0]}`;
      
      // Open download in new window/tab
      window.open(objectPath, '_blank');
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch all claims
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["/api/claims"],
  });

  // Fetch selected claim details
  const { data: claimDetails } = useQuery({
    queryKey: ["/api/claims", selectedClaim?.id],
    enabled: !!selectedClaim?.id,
  });

  // Fetch claim workflow steps
  const { data: workflowSteps = [] } = useQuery({
    queryKey: ["/api/claims", selectedClaim?.id, "workflow"],
    enabled: !!selectedClaim?.id,
  });

  // Fetch claim communications
  const { data: communications = [] } = useQuery({
    queryKey: ["/api/claims", selectedClaim?.id, "communications"],
    enabled: !!selectedClaim?.id,
  });

  // Fetch claim documents
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/claims", selectedClaim?.id, "documents"],
    enabled: !!selectedClaim?.id,
  });

  // Filtering and pagination logic for claims
  const claimsData = (claims as any[]) || [];
  const filteredClaimsData = claimsData.filter((claim: any) =>
    claim.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.claimType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClaims = filteredClaimsData.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalClaims);
  const paginatedClaims = filteredClaimsData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalClaims / pageSize);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  // Create new claim mutation
  const createClaimMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/claims", { 
        method: "POST", 
        body: JSON.stringify(data) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create claim", variant: "destructive" });
    },
  });

  // Delete claim mutation
  const deleteClaim = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/claims/${id}`, { method: "DELETE" }),
    onSuccess: (_, deletedId) => {
      toast({ title: "Success", description: "Claim deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      if (selectedClaim?.id === deletedId) setSelectedClaim(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete claim", variant: "destructive" });
    },
  });

  // Add communication mutation
  const addCommunicationMutation = useMutation({
    mutationFn: async (data: any) => 
      apiRequest(`/api/claims/${selectedClaim?.id}/communications`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast({ title: "Success", description: "Communication added successfully" });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/claims", selectedClaim?.id, "communications"] 
      });
      setIsCommunicationOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add communication", variant: "destructive" });
    },
  });

  // Update workflow step mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ stepId, data }: { stepId: number; data: any }) => 
      apiRequest(`/api/workflow-steps/${stepId}`, "PUT", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Workflow step updated successfully" });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/claims", selectedClaim.id, "workflow"] 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update workflow step", variant: "destructive" });
    },
  });

  const newClaimForm = useForm({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      title: "",
      description: "",
      claimType: "",
      incidentDate: "",
      estimatedAmount: "",
      priority: "normal",
      policyNumber: "",
      providerName: "",
      providerAddress: "",
      contactPhone: "",
      emergencyContact: "",
      emergencyPhone: "",
      additionalNotes: "",
    },
  });

  const communicationForm = useForm({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      subject: "",
      message: "",
      messageType: "message",
      isInternal: false,
    },
  });

  // File upload handler for new claim form
  const handleNewClaimFileUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length === 0) return;

    const newFiles = result.successful.map(file => ({
      fileName: file.name,
      uploadURL: file.uploadURL || '',
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size || 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Success",
      description: `${result.successful.length} file(s) uploaded successfully.`,
    });
  };

  const onCreateClaim = async (data: any) => {
    try {
      const claimData = {
        ...data,
        incidentDate: new Date(data.incidentDate).toISOString(),
        estimatedAmount: data.estimatedAmount ? parseFloat(data.estimatedAmount) : null,
      };
      
      // Create claim first
      const newClaim = await createClaimMutation.mutateAsync(claimData);
      
      // If files were uploaded, attach them to the newly created claim
      if (uploadedFiles.length > 0 && newClaim?.id) {
        for (const file of uploadedFiles) {
          const documentType = file.fileType.includes('pdf') ? 'receipt' : 
                             file.fileType.includes('image') ? 'photo' : 
                             file.fileType.includes('word') || file.fileType.includes('doc') ? 'medical_record' : 'other';
          
          await apiRequest(`/api/claims/${newClaim.id}/documents`, {
            method: "POST",
            body: JSON.stringify({
              fileName: file.fileName,
              fileType: file.fileType,
              fileSize: file.fileSize,
              documentType,
              uploadedFileURL: file.uploadURL,
            }),
          });
        }
      }
      
      // Reset form and state
      newClaimForm.reset();
      setUploadedFiles([]);
      setIsNewClaimOpen(false);
      
      toast({
        title: "Success",
        description: "Claim created successfully" + (uploadedFiles.length > 0 ? ` with ${uploadedFiles.length} attached document(s)` : ""),
      });
    } catch (error) {
      console.error("Error creating claim:", error);
      toast({
        title: "Error",
        description: "Failed to create claim. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onAddCommunication = (data: any) => {
    addCommunicationMutation.mutate(data);
  };


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Claims Workflow</h1>
            <p className="text-gray-600">Manage insurance claims with advanced workflow tracking</p>
          </div>
          <Dialog open={isNewClaimOpen} onOpenChange={setIsNewClaimOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Claim
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Claim</DialogTitle>
                <DialogDescription>
                  Submit a new insurance claim with all required details
                </DialogDescription>
              </DialogHeader>
              <Form {...newClaimForm}>
                <form onSubmit={newClaimForm.handleSubmit(onCreateClaim)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newClaimForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Claim Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of claim" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newClaimForm.control}
                      name="claimType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Claim Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select claim type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="medical">Medical</SelectItem>
                              <SelectItem value="dental">Dental</SelectItem>
                              <SelectItem value="vision">Vision</SelectItem>
                              <SelectItem value="life">Life Insurance</SelectItem>
                              <SelectItem value="disability">Disability</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newClaimForm.control}
                      name="incidentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Incident Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newClaimForm.control}
                      name="estimatedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={newClaimForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newClaimForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed description of the claim..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Additional Important Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newClaimForm.control}
                      name="policyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter policy number" {...field} data-testid="input-policy-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newClaimForm.control}
                      name="providerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Healthcare Provider/Hospital</FormLabel>
                          <FormControl>
                            <Input placeholder="Provider or hospital name" {...field} data-testid="input-provider-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={newClaimForm.control}
                    name="providerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Full address of provider/hospital" {...field} data-testid="input-provider-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newClaimForm.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Your phone number" type="tel" {...field} data-testid="input-contact-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newClaimForm.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Emergency contact name" {...field} data-testid="input-emergency-contact" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={newClaimForm.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact phone number" type="tel" {...field} data-testid="input-emergency-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={newClaimForm.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional information or special circumstances..." 
                            className="min-h-[80px]"
                            {...field} 
                            data-testid="textarea-additional-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* File Attachments Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium leading-none">Supporting Documents</label>
                      <p className="text-sm text-muted-foreground">Upload receipts, medical reports, photos, or other supporting documents</p>
                    </div>
                    
                    <ObjectUploader
                      maxNumberOfFiles={10}
                      onGetUploadParameters={async () => {
                        const response = await apiRequest('/api/claims/upload-url', { method: 'POST' });
                        return {
                          method: 'PUT' as const,
                          url: response.uploadURL,
                        };
                      }}
                      onComplete={handleNewClaimFileUpload}
                      buttonClassName="w-full"
                      data-testid="button-upload-documents"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Supporting Documents (Max 10 files)
                    </ObjectUploader>
                    
                    {/* Show uploaded files */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
                        <div className="space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-gray-400" />
                                <span>{file.fileName}</span>
                                <span className="text-gray-500">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                                data-testid={`button-remove-file-${index}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsNewClaimOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createClaimMutation.isPending}>
                      {createClaimMutation.isPending ? "Creating..." : "Create Claim"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Claims Management
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search claims..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70px]">Actions</TableHead>
                    <TableHead>Claim #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Incident Date</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Loading claims...
                      </TableCell>
                    </TableRow>
                  ) : paginatedClaims.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No claims found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClaims.map((claim: any) => (
                      <TableRow key={claim.id}>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-actions-${claim.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedClaim(claim)} data-testid={`action-view-${claim.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem data-testid={`action-edit-${claim.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Claim
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteClaim.mutate(claim.id)}
                                className="text-destructive focus:text-destructive"
                                data-testid={`action-delete-${claim.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Claim
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Button 
                            variant="link" 
                            className="p-0 h-auto font-medium"
                            onClick={() => setSelectedClaim(claim)}
                          >
                            {claim.claimNumber}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={claim.title}>
                            {claim.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {claim.claimType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs text-white ${statusColors[claim.status as keyof typeof statusColors]}`}>
                            {claim.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${priorityColors[claim.priority as keyof typeof priorityColors]}`}>
                            {claim.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {claim.incidentDate ? format(new Date(claim.incidentDate), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell>
                          {claim.estimatedAmount ? `$${parseFloat(claim.estimatedAmount).toLocaleString()}` : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalClaims > pageSize && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalClaims)} of {totalClaims} claims
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (hasPrev) setCurrentPage(currentPage - 1);
                          }}
                          className={!hasPrev ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (hasNext) setCurrentPage(currentPage + 1);
                          }}
                          className={!hasNext ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Claim Details */}
        <div className="grid grid-cols-1 gap-6">
            {selectedClaim ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="workflow">Workflow</TabsTrigger>
                  <TabsTrigger value="communications">Communications</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Claim Details
                          </CardTitle>
                          <CardDescription>{selectedClaim.claimNumber}</CardDescription>
                        </div>
                        <Badge className={`${statusColors[selectedClaim.status as keyof typeof statusColors]} text-white`}>
                          {selectedClaim.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Title</label>
                            <p className="text-sm text-gray-900">{selectedClaim.title}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Claim Type</label>
                            <p className="text-sm text-gray-900 capitalize">{selectedClaim.claimType}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Priority</label>
                            <Badge className={`${priorityColors[selectedClaim.priority as keyof typeof priorityColors]} text-xs`}>
                              {selectedClaim.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Incident Date</label>
                            <p className="text-sm text-gray-900">
                              {selectedClaim.incidentDate ? format(new Date(selectedClaim.incidentDate), 'MMM dd, yyyy') : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Estimated Amount</label>
                            <p className="text-sm text-gray-900">
                              {selectedClaim.estimatedAmount ? `$${parseFloat(selectedClaim.estimatedAmount).toFixed(2)}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Created</label>
                            <p className="text-sm text-gray-900">
                              {format(new Date(selectedClaim.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedClaim.description || 'No description provided'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="workflow">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Workflow Progress
                      </CardTitle>
                      <CardDescription>Track the progress of your claim through each step</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {workflowSteps.map((step: any, index: number) => (
                          <div key={step.id} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                step.status === 'completed' ? 'bg-green-500' :
                                step.status === 'in_progress' ? 'bg-blue-500' :
                                step.status === 'pending' ? 'bg-gray-400' : 'bg-gray-300'
                              }`}>
                                {step.status === 'completed' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : step.status === 'in_progress' ? (
                                  <Clock className="h-4 w-4" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              {index < workflowSteps.length - 1 && (
                                <div className="w-0.5 h-12 bg-gray-300 mt-2"></div>
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900">{step.stepName}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {step.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{step.stepDescription}</p>
                              {step.completedAt && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Completed {format(new Date(step.completedAt), 'MMM dd, yyyy HH:mm')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="communications">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Communications
                          </CardTitle>
                          <CardDescription>Messages and updates for this claim</CardDescription>
                        </div>
                        <Dialog open={isCommunicationOpen} onOpenChange={setIsCommunicationOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Message
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Communication</DialogTitle>
                              <DialogDescription>
                                Add a message or note to this claim
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...communicationForm}>
                              <form onSubmit={communicationForm.handleSubmit(onAddCommunication)} className="space-y-4">
                                <FormField
                                  control={communicationForm.control}
                                  name="subject"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Subject</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Message subject" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={communicationForm.control}
                                  name="messageType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Type</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="message">Message</SelectItem>
                                          <SelectItem value="note">Note</SelectItem>
                                          <SelectItem value="system_update">System Update</SelectItem>
                                          <SelectItem value="status_change">Status Change</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={communicationForm.control}
                                  name="message"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Message</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Your message..." 
                                          className="min-h-[100px]"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setIsCommunicationOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={addCommunicationMutation.isPending}>
                                    {addCommunicationMutation.isPending ? "Adding..." : "Add Message"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {communications.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No communications yet</p>
                        ) : (
                          communications.map((comm: any) => (
                            <div key={comm.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium text-sm">System User</span>
                                  <Badge variant="outline" className="text-xs">
                                    {comm.messageType.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(comm.createdAt), 'MMM dd, yyyy HH:mm')}
                                </span>
                              </div>
                              {comm.subject && (
                                <h4 className="font-medium text-sm mb-2">{comm.subject}</h4>
                              )}
                              <p className="text-sm text-gray-700">{comm.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documents
                          </CardTitle>
                          <CardDescription>Upload and manage claim documents</CardDescription>
                        </div>
                        <ObjectUploader
                          maxNumberOfFiles={10}
                          onGetUploadParameters={async () => {
                            const response = await apiRequest('/api/claims/upload-url', { method: 'POST' });
                            return {
                              method: 'PUT' as const,
                              url: response.uploadURL,
                            };
                          }}
                          onComplete={(result) => {
                            handleFileUploadComplete(result);
                          }}
                          buttonClassName="h-8"
                          disabled={!selectedClaim}
                          data-testid="button-upload-document"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Documents
                        </ObjectUploader>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {documents.length === 0 ? (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No documents uploaded yet</p>
                            <ObjectUploader
                              maxNumberOfFiles={10}
                              onGetUploadParameters={async () => {
                                const response = await apiRequest('/api/claims/upload-url', { method: 'POST' });
                                return {
                                  method: 'PUT' as const,
                                  url: response.uploadURL,
                                };
                              }}
                              onComplete={(result) => {
                                handleFileUploadComplete(result);
                              }}
                              buttonClassName="mt-4"
                              disabled={!selectedClaim}
                              data-testid="button-upload-first-document"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload First Document
                            </ObjectUploader>
                          </div>
                        ) : (
                          documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-sm">{doc.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    {doc.documentType.replace('_', ' ')} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${
                                  doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {doc.status}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadDocument(doc)}
                                  data-testid={`button-download-document-${doc.id}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a claim to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}