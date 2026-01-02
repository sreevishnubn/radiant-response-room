import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user preferences if authenticated
    let userPreferences = null;
    const authHeader = req.headers.get("authorization");
    
    if (authHeader && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        userPreferences = prefs;
        console.log("User preferences loaded:", userPreferences);
      }
    }

    console.log("Processing chat request with", messages.length, "messages");

    // Build personalized system prompt
    let preferencesContext = "";
    if (userPreferences) {
      const parts = [];
      
      if (userPreferences.favorite_sites?.length > 0) {
        parts.push(`Favorite shopping sites: ${userPreferences.favorite_sites.join(", ")}`);
      }
      
      if (userPreferences.clothing_sizes && Object.keys(userPreferences.clothing_sizes).length > 0) {
        const sizes = Object.entries(userPreferences.clothing_sizes)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        parts.push(`Clothing sizes: ${sizes}`);
      }
      
      if (userPreferences.preferred_categories?.length > 0) {
        parts.push(`Preferred categories: ${userPreferences.preferred_categories.join(", ")}`);
      }
      
      if (userPreferences.budget_range && Object.keys(userPreferences.budget_range).length > 0) {
        const budget = userPreferences.budget_range;
        if (budget.min || budget.max) {
          parts.push(`Budget range: ${budget.min || 0} - ${budget.max || "unlimited"} ${budget.currency || "USD"}`);
        }
      }
      
      if (parts.length > 0) {
        preferencesContext = `\n\nUser's saved preferences:\n${parts.join("\n")}\n\nUse these preferences to personalize your recommendations. If the user asks about shopping, default to their favorite sites. Suggest items in their sizes.`;
      }
    }

    const systemPrompt = `You are a helpful AI task assistant. Your role is to understand user requests and help them accomplish tasks.

When a user asks you to do something (like booking, ordering, or any other task), you should:
1. Ask clarifying questions to understand exactly what they need
2. Suggest options when there are multiple choices (e.g., "Would you prefer Flipkart, Amazon, or another e-commerce site?")
3. Guide them step-by-step through the process
4. Provide helpful information and recommendations

For tasks like shopping:
- Ask about preferences (brand, color, size, budget, etc.)
- Suggest popular platforms (Flipkart, Amazon, Myntra, etc.)
- Help compare options
- Provide guidance on completing the purchase

IMPORTANT: When the user tells you their preferences (like favorite sites, sizes, or budget), acknowledge that you'll remember them and suggest they can be saved to their profile.

Be conversational, helpful, and proactive in gathering the information needed to complete the task. Always confirm important details before proceeding.${preferencesContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI gateway");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
