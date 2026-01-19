import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role for storage operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { templateId, fileName, fileContent } = await req.json();

    if (!templateId || !fileName || !fileContent) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: templateId, fileName, fileContent" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 file content
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to templates bucket
    const storagePath = `templates/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("templates")
      .upload(storagePath, bytes, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the template record with the file path
    const { error: updateError } = await supabase
      .from("templates")
      .update({ file_path: storagePath })
      .eq("id", templateId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        path: storagePath,
        message: "Template uploaded successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});