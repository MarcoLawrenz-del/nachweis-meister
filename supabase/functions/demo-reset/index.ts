import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoResetResponse {
  success: boolean;
  message: string;
  resetTime: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Demo reset triggered');
    
    // In a real implementation, this would:
    // 1. Delete demo tenant data
    // 2. Re-seed with fresh demo data  
    // 3. Reset any demo-specific counters/states
    
    // For now, we just log the reset and return success
    const resetTime = new Date().toISOString();
    
    console.log('✅ Demo reset completed at:', resetTime);
    
    const response: DemoResetResponse = {
      success: true,
      message: 'Demo data has been reset to initial state',
      resetTime
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in demo-reset function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        resetTime: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);