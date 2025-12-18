import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

// Use /api/submitters for self-hosted, /submitters for hosted
const getSubmittersApiPath = () => DOCUSEAL_API_BASE_URL.includes('api.docuseal.com') ? 'submitters' : 'api/submitters';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();
        const { action, email, otp } = body;

        if (action === "send_otp") {
            if (!email) {
                return NextResponse.json({ message: "Email is required to send OTP" }, { status: 400 });
            }

            console.log(`[send-otp-route] Requesting OTP for submitter ${id} to email ${email}`);
            const docusealResponse = await fetch(
                `${DOCUSEAL_API_BASE_URL}/${getSubmittersApiPath()}/${id}/send-otp`,
                {
                    method: "POST",
                    headers: {
                        "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? '',
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                }
            );

            if (!docusealResponse.ok) {
                const errorData = await docusealResponse.json();
                console.error(`[send-otp-route] DocuSeal API error sending OTP:`, errorData);
                return NextResponse.json(errorData, {
                    status: docusealResponse.status,
                });
            }

            console.log(`[send-otp-route] OTP request successful for submitter ${id}`);
            return NextResponse.json({ message: "OTP sent successfully" });

        } else if (action === "verify_otp") {
            if (!otp) {
                return NextResponse.json({ message: "OTP is required for verification" }, { status: 400 });
            }

            console.log(`[verify-otp-route] Verifying OTP for submitter ${id}`);
            const docusealResponse = await fetch(
                `${DOCUSEAL_API_BASE_URL}/${getSubmittersApiPath()}/${id}/verify-otp`,
                {
                    method: "POST",
                    headers: {
                        "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? '',
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ otp }),
                }
            );

            if (!docusealResponse.ok) {
                const errorData = await docusealResponse.json();
                console.error(`[verify-otp-route] DocuSeal API error verifying OTP:`, errorData);
                return NextResponse.json(errorData, {
                    status: docusealResponse.status,
                });
            }

            const data = await docusealResponse.json();
            console.log(`[verify-otp-route] OTP verification successful for submitter ${id}`);
            // The response from DocuSeal should contain the 'auth_code'
            return NextResponse.json(data);

        } else {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }

    } catch (error: unknown) {
        console.error(`Error in OTP handling for submitter ${params.id}:`, error);
        return NextResponse.json(
            { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
            { status: 500 }
        );
    }
}
