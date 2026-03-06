import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Validate user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      message_type,
      subject,
      message_body,
      recipients,
      deal_id,
      attachments,
    } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one recipient is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!message_body) {
      return new Response(
        JSON.stringify({ error: "Message body is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let status = "sent";
    let errorMessage: string | null = null;

    if (message_type === "email") {
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ error: "Email service not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get sender profile for from name
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", user.id)
        .single();

      const fromName = senderProfile?.full_name || "Private Lending 360";
      const recipientEmails = recipients
        .map((r: any) => r.email)
        .filter(Boolean);

      if (recipientEmails.length === 0) {
        return new Response(
          JSON.stringify({
            error: "No valid email addresses in recipients",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Build Resend attachments from base64 data
      const resendAttachments = (attachments || [])
        .filter((a: any) => a.content && a.filename)
        .map((a: any) => ({
          filename: a.filename,
          content: a.content,
        }));

      // Send via Resend
      const emailPayload: any = {
        from: `${fromName} <onboarding@resend.dev>`,
        to: recipientEmails,
        subject: subject || "(No Subject)",
        html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${message_body.replace(
          /\n/g,
          "<br/>"
        )}</div>`,
      };

      if (resendAttachments.length > 0) {
        emailPayload.attachments = resendAttachments;
      }

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (!resendResponse.ok) {
        const resendError = await resendResponse.text();
        console.error("Resend API error:", resendError);
        status = "failed";
        errorMessage = `Email send failed: ${resendError}`;
      }
    } else if (message_type === "sms") {
      // SMS not yet implemented - store as pending
      status = "pending";
      errorMessage = "SMS sending is not yet configured";
    }

    // Store message record
    const { error: insertError } = await supabase.from("messages").insert({
      sender_id: user.id,
      deal_id: deal_id || null,
      message_type,
      subject: subject || null,
      body: message_body,
      recipients: JSON.parse(JSON.stringify(recipients)),
      attachments: JSON.parse(
        JSON.stringify(
          (attachments || []).map((a: any) => ({
            filename: a.filename,
            size: a.size,
          }))
        )
      ),
      status,
      error_message: errorMessage,
    });

    if (insertError) {
      console.error("Error storing message:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: status === "sent",
        status,
        error: errorMessage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-message:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
