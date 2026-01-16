import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  participantId: string;
  email: string;
  name?: string;
  accessMethod: "login" | "magic_link";
  magicLinkUrl?: string;
  dealNumber: string;
  role: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Loan Portal <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.message || `HTTP ${response.status}` };
  }
  
  return { success: true };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to verify the user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      participantId,
      email, 
      name, 
      accessMethod, 
      magicLinkUrl,
      dealNumber,
      role 
    }: InviteRequest = await req.json();

    // Validate required fields
    if (!email || !participantId || !dealNumber || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare email content based on access method
    const recipientName = name || "there";
    const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1);
    
    let emailContent: string;
    let subject: string;
    
    if (accessMethod === "magic_link" && magicLinkUrl) {
      subject = `You're invited to participate in Deal ${dealNumber}`;
      emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Hello ${recipientName}!</h1>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            You have been invited to participate as a <strong>${roleDisplayName}</strong> in deal <strong>${dealNumber}</strong>.
          </p>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Click the button below to securely access the deal and complete your required information:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLinkUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Access Deal
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            This link is secure and unique to you. Please do not share it with others.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you have any questions, please contact your loan officer.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${magicLinkUrl}" style="color: #2563eb; word-break: break-all;">${magicLinkUrl}</a>
          </p>
        </div>
      `;
    } else {
      // Login-based invite
      subject = `You're invited to participate in Deal ${dealNumber}`;
      const loginUrl = `${Deno.env.get("SUPABASE_URL")?.replace('supabase.co', 'lovable.app') || ''}/auth`;
      
      emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Hello ${recipientName}!</h1>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            You have been invited to participate as a <strong>${roleDisplayName}</strong> in deal <strong>${dealNumber}</strong>.
          </p>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            To access the deal, please log in to your account:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Log In
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you don't have an account yet, please register using this email address (${email}).
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you have any questions, please contact your loan officer.
          </p>
        </div>
      `;
    }

    // Send email
    const emailResult = await sendEmail(email, subject, emailContent);

    if (!emailResult.success) {
      console.error("Email error:", emailResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully to:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        participantId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-participant-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
