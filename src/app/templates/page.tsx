"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Loader2,
  Edit,
  Trash2,
  PlusCircle,
  FileText,
  ExternalLink,
  Search,
  Filter,
  LayoutGrid,
  Menu,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TemplatesSkeleton } from "@/components/loading-skeletons";

interface Template {
  id: string;
  name: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

interface CreateTemplateForm {
  name: string;
  file: FileList;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published"
  >("all");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTemplateForm>();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/docuseal/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data.data);
    } catch (error: any) {
      toast.error("Error fetching templates", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const onCreateTemplate = async (data: CreateTemplateForm) => {
    if (!data.file || data.file.length === 0) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("file", data.file[0]);
    setCreating(true);
    try {
      const response = await fetch("/api/docuseal/templates", {
        method: "POST",
        headers: {
          // Content-Type is set automatically by the browser for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create template");
      }

      const newTemplate = await response.json();
      // Assuming the API returns the created template object
      setTemplates((prev) => [newTemplate, ...prev]);
      toast.success("Template created successfully!");
      reset();
    } catch (error: any) {
      toast.error("Error creating template", { description: error.message });
    } finally {
      setCreating(false);
    }
  };

  const onDeleteTemplate = async (id: string) => {
    // Optimistic update
    const originalTemplates = templates;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.loading("Deleting template...", { id: "delete-template" });

    try {
      const response = await fetch(`/api/docuseal/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      toast.success("Template deleted successfully!", {
        id: "delete-template",
      });
    } catch (error: any) {
      toast.error("Error deleting template", {
        description: error.message,
        id: "delete-template",
      });
      setTemplates(originalTemplates); // Rollback on error
    }
  };

  // Filter templates based on search and status
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || template.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <TemplatesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation and Header */}
      <div className="sticky top-16 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Navigation Boxes */}
              <div className="flex items-center space-x-1">
                {/* Document Templates Box */}
                <Link href="/">
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                </Link>

                {/* Submissions Box */}
                <Link href="/submissions">
                  <div className="flex items-center space-x-2 rounded-lg px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <Menu className="h-4 w-4" />
                  </div>
                </Link>

                {/* Templates Box (Active) */}
                <div className="flex items-center space-x-2 rounded-lg px-3 py-2 bg-black text-white dark:bg-white dark:text-black">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {filteredTemplates.length}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold">Templates</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
              <p className="text-muted-foreground">
                Create and manage document templates for your organization.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleSubmit(onCreateTemplate)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      {...register("name", {
                        required: "Template name is required.",
                      })}
                      disabled={creating}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="file">Document</Label>
                    <Input
                      id="file"
                      type="file"
                      {...register("file", { required: "A file is required." })}
                      disabled={creating}
                      accept=".pdf,.docx,.xlsx,.jpeg,.png,.zip,.html"
                    />
                    {errors.file && (
                      <p className="text-red-500 text-sm">
                        {errors.file.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={creating}>
                    {creating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "draft" | "published"
                    )
                  }
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {templates.length === 0
                  ? "Get started by creating your first template."
                  : "Try adjusting your search or filter criteria."}
              </p>
              {/* This button is redundant as it's in the header */}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[20%]">Created</TableHead>
                    <TableHead className="w-[25%] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {template.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            template.status === "published"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            template.status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }
                        >
                          {template.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(template.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/templates/${template.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit template</span>
                            </Button>
                          </Link>
                          <Link href={`/templates/${template.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">View template</span>
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete template</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete your template and remove
                                  all associated data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeleteTemplate(template.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
