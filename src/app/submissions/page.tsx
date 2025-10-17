'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Trash2, PlusCircle, Copy, Download, Eye, Send, Search, Filter, User, Calendar, LayoutGrid, Menu, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SubmissionsSkeleton } from '@/components/loading-skeletons';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submissions, setSubmissions] = useState<DocuSeal.Submission[]>([]);
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { register, handleSubmit, reset, control, setValue } =
    useForm<CreateSubmissionForm>({
      defaultValues: {
        submitters: [{ email: '', name: '', role: '' }],
        send_email: true,
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'submitters',
  });

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/docuseal/submissions?status=${
          filterStatus === 'ALL' ? '' : filterStatus
        }`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
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
      toast.error('Error fetching submissions', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchTemplatesForForm = useCallback(async () => {
    try {
      const response = await fetch('/api/docuseal/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates for form');
      }
      const data: DocuSeal.PaginatedResponse<DocuSeal.Template> =
        await response.json();
      setTemplates(data.data.map((t) => ({ id: t.id, name: t.name })));
    } catch (error: unknown) {
      toast.error('Error fetching templates for form', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
    fetchTemplatesForForm();
  }, [fetchSubmissions, fetchTemplatesForForm]);

  const onCreateSubmission = async (data: CreateSubmissionForm) => {
    setCreating(true);
    try {
      console.log('Submitting data:', data);

      // Ensure the payload has the correct structure
      const payload = {
        template_id: data.template_id,
        submitters: data.submitters,
        send_email: data.send_email,
      };

      console.log('Payload to send:', payload);

      const response = await fetch('/api/docuseal/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);

        let errorMessage = 'Failed to create submission.';
        if (errorData?.error === 'Template does not contain fields') {
          errorMessage = 'This template has no fields. Please edit the template to add signature fields before creating a submission.';
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData?.error === 'string') {
          errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);

      // DocuSeal API returns an array of submitters, not a full submission
      // We need to refetch the submissions list to get the updated data
      toast.success('Submission created successfully!');
      reset();
      await fetchSubmissions();
    } catch (error: unknown) {
      console.error('Submission error:', error);
      toast.error('Error creating submission', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setCreating(false);
    }
  };

  const onDeleteSubmission = async (id: number) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    const originalSubmissions = submissions;
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    toast.loading('Deleting submission...', { id: 'delete-submission' });

    try {
      const response = await fetch(`/api/docuseal/submissions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }

      toast.success('Submission deleted successfully!', {
        id: 'delete-submission',
      });
    } catch (error: unknown) {
      toast.error('Error deleting submission', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
        id: 'delete-submission',
      });
      setSubmissions(originalSubmissions);
    }
  };

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading document and creating template...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/docuseal/templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const newTemplate = await res.json();
      toast.success('Template created successfully! Redirecting to editor...', { id: toastId });

      router.push(`/templates/${newTemplate.id}/edit`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Upload failed: ${message}`, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onResendInvite = async (submitterId: number) => {
    toast.loading('Resending invite...', { id: `resend-${submitterId}` });
    try {
      const response = await fetch(`/api/docuseal/submitters/${submitterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send_email: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend invite');
      }

      toast.success('Invite resent', { id: `resend-${submitterId}` });
    } catch (err: unknown) {
      toast.error('Error resending invite', {
        id: `resend-${submitterId}`,
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SENT':
      case 'PENDING': // From dev branch
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'DECLINED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'OPENED':
      case 'EXPIRED': // From dev branch
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
      filterStatus === 'ALL' ||
      submission.status.toUpperCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <SubmissionsSkeleton />;
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
                
                {/* Submissions Box (Active) */}
                <div className="flex items-center space-x-2 rounded-lg px-3 py-2 bg-black text-white dark:bg-white dark:text-black">
                  <Menu className="h-4 w-4" />
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold">Submissions</h1>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={onUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.bmp"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploading ? 'UPLOADING...' : 'UPLOAD'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-muted-foreground">
                Track and manage document submissions and signatures.
              </p>
            </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Submission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
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
                      setValue('template_id', Number(value));
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
                    {...register('template_id', { valueAsNumber: true })}
                  />
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-2 rounded-md border p-4"
                  >
                    <h4 className="font-medium">Submitter {index + 1}</h4>
                    <div>
                      <Label htmlFor={`submitters.${index}.email`}>Email</Label>
                      <Input
                        id={`submitters.${index}.email`}
                        type="email"
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
                        {...register(`submitters.${index}.name`)}
                        disabled={creating}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`submitters.${index}.role`}>
                        Role (Optional)
                      </Label>
                      <Input
                        id={`submitters.${index}.role`}
                        {...register(`submitters.${index}.role`)}
                        disabled={creating}
                      />
                    </div>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        Remove Submitter
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ email: '', name: '', role: '' })}
                >
                  Add Submitter
                </Button>

                <div className="flex items-center space-x-2">
                  <input
                    id="send_email"
                    type="checkbox"
                    {...register('send_email')}
                    defaultChecked
                  />
                  <Label htmlFor="send_email">Send email invitation</Label>
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
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="OPENED">Opened</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Send className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {submissions.length === 0
                ? 'Get started by creating your first submission.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {/* The button to create a submission is already in the header, so this might be redundant */}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Template</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[25%]">Recipient</TableHead>
                  <TableHead className="w-[15%]">Created</TableHead>
                  <TableHead className="w-[15%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50">
                          <Send className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {submission.template.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {submission.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusBadgeVariant(submission.status)}
                      >
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                          <User className="h-3 w-3" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {submission.submitters
                              .map((s) => s.name || 'No Name')
                              .join(', ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {submission.submitters
                              .map((s) => s.email)
                              .join(', ')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {new Date(submission.created_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end space-x-1">
                        {submission.submitters[0]?.embed_src && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                submission.submitters[0].embed_src || ''
                              );
                              toast.success(
                                'Signing link copied to clipboard!'
                              );
                            }}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy signing link</span>
                          </Button>
                        )}
                        {submission.status === 'completed' &&
                          submission.documents?.[0]?.url && (
                            <Link
                              href={submission.documents[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">
                                  Download document
                                </span>
                              </Button>
                            </Link>
                          )}
                        {submission.submitters[0]?.embed_src && (
                          <Link
                            href={`/submissions/${submission.id}/sign`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View signing form</span>
                            </Button>
                          </Link>
                        )}
                        {submission.submitters[0] && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mr-2"
                            onClick={() =>
                              onResendInvite(submission.submitters[0].id)
                            }
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                          onClick={() => onDeleteSubmission(submission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete submission</span>
                        </Button>
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
