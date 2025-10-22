"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SignSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [signingLink, setSigningLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<DocuSeal.Submission | null>(null);

  useEffect(() => {
    if (submissionId) {
      fetchSubmissionSigningLink(submissionId);
    }
  }, [submissionId]);

  const fetchSubmissionSigningLink = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[sign page] Fetching submission:', id);
      const response = await fetch(`/api/docuseal/submissions/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch submission details");
      }
      const data: DocuSeal.Submission = await response.json();
      console.log('[sign page] Submission data:', data);
      console.log('[sign page] Submitters:', data.submitters);
      console.log('[sign page] First submitter embed_src:', data.submitters?.[0]?.embed_src);
      setSubmission(data);
      
      // Check if already completed
      if (data.status === 'completed') {
        setError(null);
        setSigningLink(null);
        toast.success("Document already signed!", {
          description: "This submission has been completed.",
        });
        return;
      }
      
      // Use embed_src from the first submitter, or construct it from slug
      if (data.submitters && data.submitters[0]) {
        const submitter = data.submitters[0];
        // embed_src might not be in the response, so construct it from slug
        const embedSrc = submitter.embed_src || `https://docuseal.com/s/${submitter.slug}`;
        console.log('[sign page] Setting signing link:', embedSrc);
        setSigningLink(embedSrc);
      } else {
        console.error('[sign page] No submitters found. Full data:', JSON.stringify(data, null, 2));
        setError("Signing link not found for this submission.");
        toast.error("Signing link missing", {
          description: "The signing link for this submission could not be found.",
        });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching the signing link.");
      toast.error("Error fetching signing link", {
        description: err.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (signingLink) {
      navigator.clipboard.writeText(signingLink);
      toast.success('Signing link copied to clipboard!', {
        description: 'Share this link with the person who needs to sign.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show completed status
  if (submission?.status === 'completed') {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/submissions')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
        
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Document Signed!</h2>
              <p className="text-muted-foreground mb-6">
                This submission has been completed successfully.
              </p>
              {submission.documents?.[0]?.url && (
                <Button
                  onClick={() => window.open(submission.documents[0].url, '_blank')}
                >
                  Download Signed Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/submissions')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
        
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <Button onClick={() => router.push('/submissions')}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!signingLink) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/submissions')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
        
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No signing form available.</p>
              <Button onClick={() => router.push('/submissions')}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/submissions')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
        
        <Button
          variant="outline"
          onClick={handleCopyLink}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Link to Share
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="text-4xl">📝</div>
            <h2 className="text-2xl font-bold">Ready to Sign</h2>
            <p className="text-muted-foreground max-w-md">
              Click the button below to open the signing form. You'll be able to review and sign the document.
            </p>
            <Button
              size="lg"
              onClick={() => window.open(signingLink, '_blank')}
              className="mt-4"
            >
              Open Signing Form
            </Button>
            <p className="text-sm text-muted-foreground">
              The form will open in a new tab
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>Or copy the link above to share with someone else.</p>
      </div>
    </div>
  );
}