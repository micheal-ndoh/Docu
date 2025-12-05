"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { federatedLogout } from "@/lib/federated-logout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  PlusCircle,
  Copy,
  Download,
  Eye,
  Send,
  Search,
  Filter,
  User,
  Calendar,
  LayoutGrid,
  Menu,
  LogOut,
  Check,
  PenTool,
  FileEdit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionsSkeleton } from "@/components/loading-skeletons";

interface CreateSubmissionForm {
  template_id: number;
  send_email: boolean;
  submitters: {
    email: string;
    name?: string;
    role?: string;
  }[];
}

export default function SubmissionsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<DocuSeal.Submission[]>([]);
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Signing link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);

  const { register, handleSubmit, reset, control, setValue, watch } =
    useForm<CreateSubmissionForm>({
      defaultValues: {
        submitters: [],
        send_email: true, // Send email to recipients
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "submitters",
  });

  // Watch template_id for changes
  const selectedTemplateId = watch("template_id");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/docuseal/submissions?status=${filterStatus === "ALL" ? "" : filterStatus
        }`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }
      const raw = await response.json();
      // Accept multiple shapes: { data: [...] }, { items: [...] }, or direct array
      let payload: DocuSeal.Submission[] = [];
      if (Array.isArray(raw)) payload = raw as DocuSeal.Submission[];
      else if (Array.isArray(raw?.data))
        payload = raw.data as DocuSeal.Submission[];
      else if (Array.isArray(raw?.items))
        payload = raw.items as DocuSeal.Submission[];
      else payload = [];
      setSubmissions(payload);
    } catch (error: unknown) {
      toast.error("Error fetching submissions", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchTemplatesForForm = useCallback(async () => {
    try {
      const response = await fetch("/api/docuseal/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates for form");
      }
      const data: DocuSeal.PaginatedResponse<DocuSeal.Template> =
        await response.json();
      setTemplates(data.data.map((t) => ({ id: t.id, name: t.name })));
    } catch (error: unknown) {
      toast.error("Error fetching templates for form", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
    fetchTemplatesForForm();
  }, [fetchSubmissions, fetchTemplatesForForm]);

  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState<any>(null);
  const [fetchingTemplate, setFetchingTemplate] = useState(false);

  // Reset form when dialog closes
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      reset();
      setSelectedTemplateDetails(null);
      setValue("submitters", []);
    }
  };

  const handleMobileDialogClose = (open: boolean) => {
    setIsMobileDialogOpen(open);
    if (!open) {
      reset();
      setSelectedTemplateDetails(null);
      setValue("submitters", []);
    }
  };

  // Fetch template details when selected
  useEffect(() => {
    const fetchTemplateDetails = async () => {
      const templateId = control._formValues.template_id;
      if (!templateId) {
        setSelectedTemplateDetails(null);
        setValue("submitters", []);
        return;
      }

      setFetchingTemplate(true);
      try {
        const response = await fetch(`/api/docuseal/templates/${templateId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Template details:', data);
          setSelectedTemplateDetails(data);

          // Reset submitters array based on required parties
          const requiredParties = data.submitters?.length || 2;
          console.log(`Template requires ${requiredParties} parties`);

          // If more than 2 parties, we need to collect info for Party 3+
          // Parties 1 (Admin) and 2 (Student) are auto-handled
          if (requiredParties > 2) {
            const extraPartiesCount = requiredParties - 2;
            console.log(`Need ${extraPartiesCount} additional party inputs`);
            // Clear and add needed slots
            setValue("submitters", Array(extraPartiesCount).fill({ email: "", name: "", role: "" }));
          } else {
            // No extra parties needed - clear the array
            console.log('No additional parties needed, clearing submitters array');
            setValue("submitters", []);
          }
        } else {
          console.error('Failed to fetch template:', response.status);
          toast.error("Failed to load template details");
        }
      } catch (error) {
        console.error("Error fetching template details:", error);
        toast.error("Failed to load template details");
      } finally {
        setFetchingTemplate(false);
      }
    };

    fetchTemplateDetails();
  }, [control._formValues.template_id, setValue]);

  const onCreateSubmission = async (data: CreateSubmissionForm) => {
    setCreating(true);
    try {
      console.log("Submitting data:", data);

      // Prepare payload based on smart party logic
      const payload: any = {
        template_id: data.template_id,
        send_email: data.send_email,
      };

      // If we have extra parties (Party 3+), send them as additional_parties
      if (data.submitters && data.submitters.length > 0) {
        payload.additional_parties = data.submitters;
      }

      console.log("Payload to send:", payload);

      const response = await fetch("/api/docuseal/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.message || errorData.error || "Failed to create submission");
      }

      const responseData = await response.json();

      toast.success("Submission created successfully!", {
        description: "Document sent to all parties.",
      });

      // Close dialog and reset form
      setIsDialogOpen(false);
      setIsMobileDialogOpen(false);
      reset();
      setSelectedTemplateDetails(null);
      setValue("submitters", []);

      // Small delay to ensure database has been updated
      setTimeout(async () => {
        await fetchSubmissions();
      }, 1000);

    } catch (error: unknown) {
      console.error("Submission error:", error);
      toast.error("Error creating submission", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setCreating(false);
    }
  };

  const onDeleteSubmission = async (id: number) => {
    const originalSubmissions = submissions;
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    toast.loading("Deleting submission...", { id: "delete-submission" });

    try {
      const response = await fetch(`/api/docuseal/submissions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete submission");
      }

      toast.success("Submission deleted successfully!", {
        id: "delete-submission",
      });
    } catch (error: unknown) {
      toast.error("Error deleting submission", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        id: "delete-submission",
      });
      setSubmissions(originalSubmissions);
    }
  };

  const onResendInvite = async (submitterId: number) => {
    toast.loading("Resending invite...", { id: `resend-${submitterId}` });
    try {
      const response = await fetch(`/api/docuseal/submitters/${submitterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ send_email: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend invite");
      }

      toast.success("Invite resent", { id: `resend-${submitterId}` });
    } catch (err: unknown) {
      toast.error("Error resending invite", {
        id: `resend-${submitterId}`,
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "SENT":
      case "PENDING": // From dev branch
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400";
      case "DECLINED":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400";
      case "OPENED":
      case "EXPIRED": // From dev branch
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      submission.template.name.toLowerCase().includes(searchLower) ||
      submission.submitters.some(
        (s) =>
          s.email.toLowerCase().includes(searchLower) ||
          (s.name && s.name.toLowerCase().includes(searchLower))
      );
    const matchesStatus =
      filterStatus === "ALL" ||
      submission.status.toUpperCase() === filterStatus ||
      (filterStatus === "SENT" &&
        submission.status.toUpperCase() === "PENDING");
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <SubmissionsSkeleton />;
  }
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold text-[#1e0836]">
                  Submissions
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage document submissions
                </p>
              </div>

              {/* User Menu */}
              {session && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-11 w-11 rounded-full"
                    >
                      <Avatar className="h-11 w-11 border-2 border-purple-200">
                        <AvatarImage
                          src={session.user?.image || "/avatars/01.png"}
                          alt={session.user?.name || "User"}
                        />
                        <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                          {session.user?.name
                            ? session.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium">
                        {session.user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.user?.email}
                      </p>
                    </div>
                    <DropdownMenuItem
                      onClick={() => federatedLogout()}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-2 py-2">
          {/* Search for larger screens */}
          <div className="mb-6 hidden md:block">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-gray-300 focus:border-purple-700 focus:ring-purple-700"
              />
            </div>
          </div>

          {/* Header with Create Button */}
          <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Filter Section with Decoration */}
            <div className="flex w-full items-center gap-4 md:w-auto hidden md:block">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-semibold text-purple-900">
                      Filter by:
                    </Label>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-[180px] border-2 border-purple-300 bg-white focus:border-purple-600 focus:ring-purple-600 font-medium">
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL" className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            All Status
                          </div>
                        </SelectItem>
                        <SelectItem value="SENT" className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Sent
                          </div>
                        </SelectItem>
                        <SelectItem value="COMPLETED" className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="DECLINED" className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Declined
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Submission Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="hidden md:flex bg-[#3b0764] hover:bg-[#1e0836] text-white font-semibold">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Submission
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Submission</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleSubmit(onCreateSubmission)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="template_id">Template</Label>
                    <Select
                      onValueChange={(value) => {
                        console.log('Template selected:', value);
                        setValue("template_id", Number(value));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem
                            key={template.id}
                            value={String(template.id)}
                          >
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="hidden"
                      {...register("template_id", { valueAsNumber: true })}
                    />
                  </div>

                  {/* Loading state */}
                  {fetchingTemplate && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading template details...</span>
                    </div>
                  )}

                  {/* Template Party Info */}
                  {selectedTemplateDetails && !fetchingTemplate && (
                    <div className="rounded-md bg-purple-50 p-4 border border-purple-100">
                      <h4 className="font-medium text-purple-900 mb-2">Submission Parties (Sequential Signing)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-700">
                          <span className="font-semibold w-24">Party 1:</span>
                          <span>{selectedTemplateDetails.submitters?.[0]?.name || "Student"} (You) - Signs First</span>
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Auto-filled</Badge>
                        </div>

                        {/* List additional required parties */}
                        {selectedTemplateDetails.submitters?.slice(1, -1).map((submitter: any, idx: number) => (
                          <div key={idx} className="flex items-center text-gray-700">
                            <span className="font-semibold w-24">Party {idx + 2}:</span>
                            <span>{submitter.name || "Additional Party"}</span>
                            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">Requires Input</Badge>
                          </div>
                        ))}

                        <div className="flex items-center text-gray-700">
                          <span className="font-semibold w-24">Last Party:</span>
                          <span>{selectedTemplateDetails.submitters?.[selectedTemplateDetails.submitters.length - 1]?.name || "Admin"} (School Administrator) - Signs Last</span>
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Auto-filled</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields for Party 3+ - Only show if template requires more than 2 parties */}
                  {fields.length > 0 && fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-2 rounded-md border p-4 bg-white"
                    >
                      <h4 className="font-medium">
                        {selectedTemplateDetails?.submitters?.[index + 1]?.name || `Party ${index + 2}`} Details
                      </h4>
                      <div>
                        <Label htmlFor={`submitters.${index}.email`}>
                          Email
                        </Label>
                        <Input
                          id={`submitters.${index}.email`}
                          type="email"
                          placeholder="recipient@example.com"
                          {...register(`submitters.${index}.email`, {
                            required: true,
                          })}
                          disabled={creating}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`submitters.${index}.name`}>
                          Name (Optional)
                        </Label>
                        <Input
                          id={`submitters.${index}.name`}
                          placeholder="John Doe"
                          {...register(`submitters.${index}.name`)}
                          disabled={creating}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                      disabled={creating}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating || !selectedTemplateDetails}
                      className="bg-[#3b0764] hover:bg-[#1e0836] flex-1"
                    >
                      {creating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Submission
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Floating Action Button for Create Submission on Mobile */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-40">
            <Dialog open={isMobileDialogOpen} onOpenChange={handleMobileDialogClose}>
              <DialogTrigger asChild>
                <Button
                  className="h-14 w-14 rounded-full bg-[#3b0764] hover:bg-[#1e0836] text-white shadow-lg transition-transform active:scale-95"
                  size="icon"
                >
                  <img
                    src="https://img.icons8.com/?size=48&id=59864&format=png&color=ffffff"
                    alt="plus"
                    className="h-6 w-6"
                  />
                  <span className="sr-only">Create Submission</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Submission</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleSubmit(onCreateSubmission)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="template_id">Template</Label>
                    <Select
                      onValueChange={(value) => {
                        console.log('Template selected (mobile):', value);
                        setValue("template_id", Number(value));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem
                            key={template.id}
                            value={String(template.id)}
                          >
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="hidden"
                      {...register("template_id", { valueAsNumber: true })}
                    />
                  </div>

                  {/* Loading state */}
                  {fetchingTemplate && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading template details...</span>
                    </div>
                  )}

                  {/* Template Party Info */}
                  {selectedTemplateDetails && !fetchingTemplate && (
                    <div className="rounded-md bg-purple-50 p-4 border border-purple-100">
                      <h4 className="font-medium text-purple-900 mb-2">Submission Parties (Sequential Signing)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-700">
                          <span className="font-semibold w-24">Party 1:</span>
                          <span>{selectedTemplateDetails.submitters?.[0]?.name || "Student"} (You) - Signs First</span>
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Auto-filled</Badge>
                        </div>

                        {/* List additional required parties */}
                        {selectedTemplateDetails.submitters?.slice(1, -1).map((submitter: any, idx: number) => (
                          <div key={idx} className="flex items-center text-gray-700">
                            <span className="font-semibold w-24">Party {idx + 2}:</span>
                            <span>{submitter.name || "Additional Party"}</span>
                            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">Requires Input</Badge>
                          </div>
                        ))}

                        <div className="flex items-center text-gray-700">
                          <span className="font-semibold w-24">Last Party:</span>
                          <span>{selectedTemplateDetails.submitters?.[selectedTemplateDetails.submitters.length - 1]?.name || "Admin"} (School Administrator) - Signs Last</span>
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Auto-filled</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields for Party 3+ - Only show if template requires more than 2 parties */}
                  {fields.length > 0 && fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-2 rounded-md border p-4 bg-white"
                    >
                      <h4 className="font-medium">
                        {selectedTemplateDetails?.submitters?.[index + 1]?.name || `Party ${index + 2}`} Details
                      </h4>
                      <div>
                        <Label htmlFor={`submitters.${index}.email`}>
                          Email
                        </Label>
                        <Input
                          id={`submitters.${index}.email`}
                          type="email"
                          placeholder="recipient@example.com"
                          {...register(`submitters.${index}.email`, {
                            required: true,
                          })}
                          disabled={creating}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`submitters.${index}.name`}>
                          Name (Optional)
                        </Label>
                        <Input
                          id={`submitters.${index}.name`}
                          placeholder="John Doe"
                          {...register(`submitters.${index}.name`)}
                          disabled={creating}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleMobileDialogClose(false)}
                      disabled={creating}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating || !selectedTemplateDetails}
                      className="bg-[#3b0764] hover:bg-[#1e0836] flex-1"
                    >
                      {creating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Submission
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile Search and Filter Bar */}
          <div className="sticky top-24 z-30 mb-2 md:hidden">
            <div className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-white/10">
              <div className="relative flex flex-1 items-center">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <Input
                  className="h-10 w-full rounded-md border-transparent bg-slate-100 py-2 pl-10 pr-4 text-slate-900 placeholder:text-slate-500 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-700/50 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-purple-700 dark:focus:ring-purple-700/50"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] border-transparent bg-slate-100 focus:border-purple-700 focus:ring-purple-700 dark:bg-slate-700 dark:border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        All Status
                      </div>
                    </SelectItem>
                    <SelectItem value="SENT" className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Sent
                      </div>
                    </SelectItem>
                    <SelectItem value="COMPLETED" className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Completed
                      </div>
                    </SelectItem>
                    <SelectItem value="DECLINED" className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Declined
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
              <Send className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1e0836] mb-2">
                No submissions found
              </h3>
              <p className="text-gray-600">
                {submissions.length === 0
                  ? "Get started by creating your first submission."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Template</TableHead>
                      <TableHead className="w-[15%]">Overall Status</TableHead>
                      <TableHead className="w-[40%]">Parties Status</TableHead>
                      <TableHead className="w-[15%]">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow
                        key={submission.id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                              {submission.template?.name || "Unnamed Template"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {submission.id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${getStatusBadgeVariant(
                              submission.status
                            )} border-0`}
                          >
                            {submission.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {submission.submitter_status && submission.submitter_status.length > 0 ? (
                              submission.submitter_status.map((status, index) => (
                                <div key={status.id} className="flex items-start gap-4 text-sm py-1">
                                  <div className="flex items-center gap-3 flex-1">
                                    {/* Conditionally render email unless it's the last party (admin) */}
                                    {index !== submission.submitter_status.length - 1 ? (
                                      <span className="text-gray-700 font-medium truncate max-w-[200px]" title={status.email}>{status.email}</span>
                                    ) : (
                                      <span className="text-gray-700 font-medium">{status.role || 'Administrator'}</span>
                                    )}
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getStatusBadgeVariant(status.status)}`}
                                    >
                                      {status.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center">
                                    {/* Action Buttons */}
                                    {status.embedSrc && status.status !== 'completed' && (
                                      <>
                                        {/* First Party (Student) - Show Sign Now */}
                                        {index === 0 ? (
                                          <Button
                                            variant="default"
                                            size="sm"
                                            className="h-6 w-28 text-xs px-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
                                            onClick={() => window.open(status.embedSrc!, '_blank')}
                                          >
                                            <FileEdit className="h-3 w-3 mr-1" />
                                            Sign Now
                                          </Button>
                                        ) : (
                                          /* Other Parties - Show Copy Link */
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 w-28 text-xs px-2 rounded-full border-gray-300 hover:bg-gray-100"
                                            onClick={() => copyToClipboard(status.embedSrc!, status.id)}
                                          >
                                            {copiedId === status.id ? (
                                              <>
                                                <Check className="h-3 w-3 mr-1 text-green-600" />
                                                <span className="text-green-600">Copied</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="h-3 w-3 mr-1 text-gray-600" />
                                                <span className="text-gray-600">Copy Link</span>
                                              </>
                                            )}
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">
                                {submission.submitters.map(s => s.email).join(", ")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
                            {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="grid gap-4 md:hidden">
                {filteredSubmissions.map((submission) => (
                  <Card key={submission.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <div className="font-bold text-gray-900 dark:text-gray-100">
                            {submission.template?.name || "Unnamed Template"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {submission.id}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${getStatusBadgeVariant(
                            submission.status
                          )} border-0`}
                        >
                          {submission.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm">
                          <span className="font-medium text-gray-500 block mb-1">Parties Status:</span>
                          <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                            {submission.submitter_status && submission.submitter_status.length > 0 ? (
                              submission.submitter_status.map((status) => (
                                <div key={status.id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">{status.role || "Party"}:</span>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getStatusBadgeVariant(status.status)}`}
                                  >
                                    {status.status.toUpperCase()}
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">
                                {submission.submitters.map(s => s.email).join(", ")}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground pt-2 border-t">
                          <Calendar className="mr-2 h-4 w-4" />
                          Created: {new Date(submission.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )
          }
        </div >
      </div >
    </>
  );
}
