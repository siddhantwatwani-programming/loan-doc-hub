import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationResult {
  isValid: boolean;
  error?: string;
  dealId?: string;
  role?: string;
  participantId?: string;
  dealNumber?: string;
  sessionToken?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ isValid: false, error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the magic link using the database function
    const { data, error } = await supabase.rpc("validate_magic_link", {
      _token: token,
    });

    if (error) {
      console.error("Error validating magic link:", error);
      return new Response(
        JSON.stringify({ isValid: false, error: "Failed to validate link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = data?.[0];

    if (!result || !result.is_valid) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          error: result?.error_message || "Invalid or expired link" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a temporary session token for this magic link access
    // This token will be stored in the client and used to authenticate subsequent requests
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    // Store the session in a temporary sessions approach
    // We'll use the deal_participants table to track active sessions
    const { error: updateError } = await supabase
      .from("deal_participants")
      .update({
        status: "in_progress",
      })
      .eq("id", result.participant_id);

    if (updateError) {
      console.error("Error updating participant status:", updateError);
    }

    const response: ValidationResult = {
      isValid: true,
      dealId: result.deal_id,
      role: result.role,
      participantId: result.participant_id,
      dealNumber: result.deal_number,
      sessionToken: sessionToken,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ isValid: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
