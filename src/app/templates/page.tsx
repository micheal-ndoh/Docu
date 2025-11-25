"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSession, signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  FileText,
  Search,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  FolderOpen,
  Plus,
  LogOut,
  User,
} from "lucide-react";
import { TemplatesSkeleton } from "@/components/loading-skeletons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Template {
  id: string;
  name: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setTemplates(data.data || []);
    } catch (error: any) {
      toast.error("Error fetching templates", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("name", file.name.replace(/\.[^/.]+$/, ""));
    formData.append("file", file);

    setIsUploading(true);
    try {
      const response = await fetch("/api/docuseal/templates", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload template");
      }

      const newTemplate = await response.json();
      setTemplates((prev) => [newTemplate, ...prev]);
      toast.success("Template uploaded successfully!");

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error("Error uploading template", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const onDeleteTemplate = async (id: string) => {
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
      setTemplates(originalTemplates);
    }
    setDeleteId(null);
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <TemplatesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <svg className="h-10 w-10 text-[#3b0764]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 3L21 7L9 19L5 20L6 16L17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d="M15 5L19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 21C3 21 5 19 7 19C9 19 9 21 11 21C13 21 13 19 15 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-bold text-xl text-[#3b0764]">DocuSeal</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-[#1e0836]">Templates</h1>
                <p className="text-gray-600 mt-1">
                  Manage your document templates
                </p>
              </div>
            </div>

            {/* Search, Submissions Button, and User Menu */}
            <div className="flex items-center gap-4">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-purple-700 focus:ring-purple-700"
                />
              </div>
              <Link href="/submissions">
                <Button className="bg-[#3b0764] hover:bg-[#1e0836] text-white font-semibold px-6 h-11">
                  Submissions
                </Button>
              </Link>

              {/* User Menu */}
              {session && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-11 w-11 rounded-full">
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
                      onClick={() => signOut()}
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
      </div>

      <div className="container mx-auto px-4 py-12">

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Upload Card - Smaller */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-2xl border-4 border-dashed border-gray-300 hover:border-purple-500 bg-white hover:bg-purple-50 transition-all duration-300 cursor-pointer overflow-hidden max-w-[240px] mx-auto sm:mx-0"
            style={{ aspectRatio: '3/4' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.docx,.xlsx,.jpeg,.png,.zip,.html"
              disabled={isUploading}
            />

            {/* Folder Tab */}
            <div className="absolute top-0 left-5 w-18 h-7 bg-purple-200 rounded-t-lg border-4 border-dashed border-gray-300 group-hover:border-purple-500 border-b-0"></div>

            {/* Main Content */}
            <div className="h-full flex flex-col items-center justify-center p-5 pt-10">
              {isUploading ? (
                <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                    <Upload className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-base font-semibold text-[#1e0836] group-hover:text-purple-700 transition-colors text-center">
                    Upload Template
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5 text-center">
                    Click to browse
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Template Cards */}
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group relative rounded-2xl bg-white border-2 border-gray-200 hover:border-purple-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
              style={{ aspectRatio: '3/4' }}
            >
              {/* Folder Tab */}
              <div className="absolute top-0 left-6 w-20 h-8 bg-purple-300 rounded-t-lg border-2 border-gray-200 group-hover:border-purple-500 border-b-0"></div>

              {/* Document Preview Area */}
              <div className="h-2/3 bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center relative pt-4">
                <FolderOpen className="h-24 w-24 text-purple-400 group-hover:text-purple-600 transition-colors" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${template.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {template.status}
                  </span>
                </div>

                {/* Actions Menu */}
                <div className="absolute top-3 left-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg bg-white/80 hover:bg-white shadow-sm transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/templates/${template.id}/edit`}
                          className="flex items-center cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/templates/${template.id}`}
                          className="flex items-center cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(template.id)}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Template Info */}
              <div className="h-1/3 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(template.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <FileText className="h-3 w-3 mr-1" />
                  ID: {template.id.substring(0, 8)}...
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && templates.length > 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria
            </p>
          </div>
        )}

        {filteredTemplates.length === 0 && templates.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#1e0836] mb-2">
              No templates yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by uploading your first template
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              template and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && onDeleteTemplate(deleteId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
