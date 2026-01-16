import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompletionRequest {
  participantId: string;
  dealId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { participantId, dealId } = await req.json() as CompletionRequest;

    if (!participantId || !dealId) {
      return new Response(
        JSON.stringify({ success: false, error: "participantId and dealId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the participant
    const { data: participant, error: fetchError } = await supabase
      .from("deal_participants")
      .select("*, deals(deal_number, created_by)")
      .eq("id", participantId)
      .eq("deal_id", dealId)
      .single();

    if (fetchError || !participant) {
      console.error("Error fetching participant:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Participant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (participant.status === "completed") {
      return new Response(
        JSON.stringify({ success: false, error: "Section already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update participant status to completed
    const { error: updateError } = await supabase
      .from("deal_participants")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", participantId);

    if (updateError) {
      console.error("Error updating participant:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log activity
    const { error: logError } = await supabase
      .from("activity_log")
      .insert({
        deal_id: dealId,
        actor_user_id: participant.user_id || participant.deals.created_by,
        action_type: "ParticipantCompleted",
        action_details: {
          role: participant.role,
          participantId: participant.id,
        },
      });

    if (logError) {
      console.warn("Failed to log activity:", logError);
    }

    // Check if sequential mode - find next participant to unlock
    const { data: allParticipants } = await supabase
      .from("deal_participants")
      .select("*")
      .eq("deal_id", dealId)
      .order("sequence_order", { ascending: true });

    let nextParticipant = null;
    if (participant.sequence_order !== null && allParticipants) {
      // Find next participant in sequence
      nextParticipant = allParticipants.find(
        (p) =>
          p.sequence_order !== null &&
          p.sequence_order > participant.sequence_order &&
          p.status !== "completed"
      );
    }

    // Get CSR info for notification
    const csrUserId = participant.deals.created_by;
    
    // Get CSR profile for email
    const { data: csrProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", csrUserId)
      .single();

    // Send notification to CSR via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && csrProfile?.email) {
      try {
        const roleDisplay = participant.role.charAt(0).toUpperCase() + participant.role.slice(1);
        const dealNumber = participant.deals.deal_number;
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Section Completed</h2>
            <p>The <strong>${roleDisplay}</strong> has completed their section for deal <strong>${dealNumber}</strong>.</p>
            ${nextParticipant ? `
              <p style="color: #666;">Next in sequence: <strong>${nextParticipant.role}</strong> has been unlocked and can now enter their data.</p>
            ` : `
              <p style="color: #22c55e;">All participants in sequence have completed their sections!</p>
            `}
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #888; font-size: 12px;">This is an automated notification from your deal management system.</p>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Deal System <noreply@resend.dev>",
            to: [csrProfile.email],
            subject: `[${dealNumber}] ${roleDisplay} completed their section`,
            html: emailHtml,
          }),
        });

        console.log("CSR notification sent successfully");
      } catch (emailError) {
        console.error("Failed to send CSR notification:", emailError);
        // Don't fail the whole operation if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        nextParticipant: nextParticipant ? {
          id: nextParticipant.id,
          role: nextParticipant.role,
        } : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
