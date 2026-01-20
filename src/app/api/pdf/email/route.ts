import { NextRequest, NextResponse } from "next/server";
import type { PlayerProfile, AnalysisResult } from "@/types";

interface EmailRequest {
  email: string;
  result: AnalysisResult;
  profile: PlayerProfile;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();

    // Validate email
    if (!body.email || !body.email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    // Validate result and profile exist
    if (!body.result || !body.profile) {
      return NextResponse.json(
        { error: "Analysis result and profile are required" },
        { status: 400 }
      );
    }

    // TODO: Implement email sending with a service like Resend, SendGrid, or AWS SES
    // For now, return a helpful message
    //
    // Example implementation with Resend:
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'ExposureEngine <noreply@warubi-sports.com>',
    //   to: body.email,
    //   subject: `Your ExposureEngine Report - ${body.profile.firstName} ${body.profile.lastName}`,
    //   html: generateEmailHTML(body.result, body.profile),
    // });

    return NextResponse.json(
      {
        error:
          "Email feature coming soon. For now, please use the Download PDF button and save as PDF from the print dialog.",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Failed to process email request" },
      { status: 500 }
    );
  }
}
