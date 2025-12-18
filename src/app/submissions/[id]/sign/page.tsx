"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [signingLink, setSigningLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<DocuSeal.Submission | null>(
    null
  );
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (submissionId && status === "authenticated") {
      fetchSubmissionSigningLink(submissionId, session?.user?.email);
    }
  }, [submissionId, status, session]);

  const fetchSubmissionSigningLink = async (
    id: string,
    userEmail?: string | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      console.log("[sign page] Fetching submission:", id);
      const response = await fetch(`/api/docuseal/submissions/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch submission details");
      }
      const data: DocuSeal.Submission = await response.json();
      console.log("[sign page] Submission data:", data);
      console.log("[sign page] Submitters:", data.submitters);
      setSubmission(data);

      // Check if already completed at the submission level
      if (data.status === "completed") {
        setError(null);
        setSigningLink(null);
        toast.success("Document already signed!", {
          description: "This submission has been completed.",
        });
        return;
      }

      // Find the submitter for the current user
      const currentUserSubmitter = data.submitters?.find(
        (submitter) => submitter.email === userEmail
      );

      if (currentUserSubmitter) {
        console.log(
          "[sign page] Current user submitter:",
          currentUserSubmitter
        );
        // If current user has already completed their signing, show a message
        if (currentUserSubmitter.status === "completed") {
          setError(null);
          setSigningLink(null);
          toast.info("You have already signed this document!", {
            description: "Waiting for other signers to complete.",
          });
          return;
        }

        // Set initial signing link, will be updated with auth_code after OTP verification
        const initialEmbedSrc =
          currentUserSubmitter.embed_src ||
          `https://docuseal.com/s/${currentUserSubmitter.slug}`;
        setSigningLink(initialEmbedSrc);
      } else {
        console.error(
          "[sign page] No submitter found for current user or no submitters at all. Full data:",
          JSON.stringify(data, null, 2)
        );
        setError(
          "You are not authorized to sign this document or the signing link is not available."
        );
        toast.error("Unauthorized or link missing", {
          description:
            "Please ensure you are logged in with the correct account or contact the sender.",
        });
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while fetching the signing link."
      );
      toast.error("Error fetching signing link", {
        description: err.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (signingLink) {
      // Copy the link without the auth_code for sharing
      const linkToCopy = signingLink.split("?")[0];
      navigator.clipboard.writeText(linkToCopy);
      toast.success("Signing link copied to clipboard!", {
        description: "Share this link with the person who needs to sign.",
      });
    }
  };

  const handleSendOtp = async () => {
    if (!submissionId || !session?.user?.email) return;

    setIsRequestingOtp(true);
    setOtpError(null);
    try {
      const response = await fetch(
        `/api/docuseal/submitters/${submissionId}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "send_otp",
            email: session.user.email,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send OTP");
      }

      toast.success("OTP sent!", {
        description:
          "A verification code has been sent to your email. Please check your inbox.",
      });
      setOtpSent(true);
    } catch (err: any) {
      setOtpError(err.message || "An error occurred while sending OTP.");
      toast.error("Error sending OTP", {
        description: err.message || "Please try again.",
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!submissionId || !otpInput) return;

    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const response = await fetch(
        `/api/docuseal/submitters/${submissionId}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "verify_otp",
            otp: otpInput,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify OTP");
      }

      const data = await response.json();
      const receivedAuthCode = data.auth_code; // Assuming DocuSeal returns auth_code

      if (!receivedAuthCode) {
        throw new Error("Authentication code not received from DocuSeal.");
      }

      setAuthCode(receivedAuthCode);
      setOtpSent(false); // OTP flow completed
      toast.success("OTP Verified!", {
        description: "You can now open the signing form.",
      });
      // Update signing link with auth_code
      if (signingLink) {
        const baseUrl = signingLink.split("?")[0];
        setSigningLink(`${baseUrl}?auth_code=${receivedAuthCode}`);
      }
    } catch (err: any) {
      setOtpError(err.message || "An error occurred while verifying OTP.");
      toast.error("Error verifying OTP", {
        description: err.message || "Please check the code and try again.",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(10vh-10px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show completed status
  if (submission?.status === "completed") {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/submissions")}
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
                  onClick={() =>
                    window.open(submission.documents[0].url, "_blank")
                  }
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
          onClick={() => router.push("/submissions")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <Button onClick={() => router.push("/submissions")}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // if (!signingLink) {
  //   return (
  //     <div className="container mx-auto py-8">
  //     <Button
  //         variant="ghost"
  //         onClick={() => router.push('/submissions')}
  //         className="mb-4"
  //       >
  //         <ArrowLeft className="mr-2 h-4 w-4" />
  //         Back to Submissions
  //       </Button>
  //
  //       <Card className="max-w-2xl mx-auto">
  //         <CardContent className="pt-6">
  //           <div className="flex flex-col items-center justify-center py-12 text-center">
  //             <p className="text-muted-foreground mb-4">No signing form available.</p>
  //             <Button onClick={() => router.push('/submissions')}>Go Back</Button>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  // If signing link is available but not yet authorized (no authCode), show OTP request/verification
  if (signingLink && !authCode) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/submissions")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="text-4xl">🔒</div>
              <h2 className="text-2xl font-bold">Secure Document Access</h2>
              <p className="text-muted-foreground max-w-md">
                To access and sign this document, a verification code will be
                sent to your email.
              </p>

              {!otpSent ? (
                <Button
                  size="lg"
                  onClick={handleSendOtp}
                  disabled={isRequestingOtp}
                  className="mt-4"
                >
                  {isRequestingOtp ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Request Verification Code
                </Button>
              ) : (
                <div className="w-full max-w-sm space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to {session?.user?.email}
                  </p>
                  <Input
                    type="text"
                    placeholder="Enter OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="text-center"
                    maxLength={6}
                  />
                  {otpError && (
                    <p className="text-red-500 text-sm">{otpError}</p>
                  )}
                  <Button
                    size="lg"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpInput.length !== 6}
                    className="w-full"
                  >
                    {isVerifyingOtp ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Verify Code
                  </Button>
                  <Button
                    variant="link"
                    onClick={handleSendOtp}
                    disabled={isRequestingOtp}
                    className="mt-2"
                  >
                    {isRequestingOtp ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Resend Code
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If signingLink and authCode are both present, show the signing form button
  if (signingLink && authCode) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/submissions")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Button>

          <Button variant="outline" onClick={handleCopyLink}>
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
                Click the button below to open the signing form. You'll be able
                to review and sign the document.
              </p>
              <Button
                size="lg"
                onClick={() => window.open(signingLink, "_blank")}
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

  // Fallback for cases where no signingLink or authCode is available after loading
  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/submissions")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Submissions
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No signing form available or unauthorized access.
            </p>
            <Button onClick={() => router.push("/submissions")}>Go Back</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
