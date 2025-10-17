"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SignSubmissionPage() {
  const params = useParams();
  const submissionId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [signingLink, setSigningLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (submissionId) {
      fetchSubmissionSigningLink(submissionId);
    }
  }, [submissionId]);

  const fetchSubmissionSigningLink = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/docuseal/submissions/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch submission details");
      }
      const data: DocuSeal.Submission = await response.json();
      // Use embed_src from the first submitter
      if (data.submitters && data.submitters[0]?.embed_src) {
        setSigningLink(data.submitters[0].embed_src);
      } else {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)] text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!signingLink) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)] text-muted-foreground">
        <p>No signing form available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Sign Document</h1>
      <div className="relative w-full h-[80vh] border rounded-md overflow-hidden">
        {/* DocuSeal signing form embedding */}
        <iframe
          src={signingLink}
          width="100%"
          height="100%"
          style={{ border: "none" }}
          title="DocuSeal Signing Form"
        ></iframe>
      </div>
    </div>
  );
}