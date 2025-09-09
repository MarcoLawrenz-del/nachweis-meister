import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderJob {
  id: string;
  requirement_id: string;
  state: 'active' | 'paused' | 'completed' | 'escalated';
  next_run_at: string;
  attempts: number;
  max_attempts: number;
  escalated: boolean;
  requirement: {
    document_type: {
      name_de: string;
      code: string;
    };
    project_sub: {
      subcontractor: {
        id: string;
        company_name: string;
        contact_email: string;
      };
      project: {
        name: string;
        tenant: {
          id: string;
          name: string;
          logo_url: string;
        };
      };
    };
    due_date: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Processing reminder jobs...');

    // Fetch all active reminder jobs that are due (only for active subcontractors)
    const { data: reminderJobs, error: fetchError } = await supabaseClient
      .from('reminder_jobs')
      .select(`
        id,
        requirement_id,
        state,
        next_run_at,
        attempts,
        max_attempts,
        escalated,
        requirement:requirements (
          due_date,
          document_type:document_types (
            name_de,
            code
          ),
          project_sub:project_subs (
            subcontractor:subcontractors!inner (
              id,
              company_name,
              contact_email,
              status
            ),
            project:projects (
              name,
              tenant:tenants (
                id,
                name,
                logo_url
              )
            )
          )
        )
      `)
      .eq('state', 'active')
      .eq('requirement.project_sub.subcontractor.status', 'active') // Only active subcontractors
      .lte('next_run_at', new Date().toISOString())
      .limit(50); // Process max 50 jobs per run

    if (fetchError) {
      console.error('Error fetching reminder jobs:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${reminderJobs?.length || 0} reminder jobs to process`);

    let processedCount = 0;
    let escalatedCount = 0;
    let errorCount = 0;

    for (const job of (reminderJobs as ReminderJob[]) || []) {
      try {
        console.log(`Processing job ${job.id} (attempt ${job.attempts + 1}/${job.max_attempts})`);

        // Determine email template based on attempts
        let templateType = 'reminder_soft';
        if (job.attempts === 0) {
          templateType = 'invite_initial';
        } else if (job.attempts >= 3) {
          templateType = 'reminder_hard';
        }

        // Check if we should escalate
        const shouldEscalate = job.attempts >= job.max_attempts - 1;

        if (shouldEscalate && !job.escalated) {
          // Send escalation email
          await sendEscalationEmail(supabaseClient, job);
          
          // Mark as escalated
          await supabaseClient
            .from('reminder_jobs')
            .update({
              escalated: true,
              attempts: job.attempts + 1,
              state: 'escalated',
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          escalatedCount++;
        } else if (!shouldEscalate) {
          // Send regular reminder
          await sendReminderEmail(supabaseClient, job, templateType);
          
          // Update job with next run time
          const nextRunAt = getNextReminderDate(job.attempts + 1);
          
          await supabaseClient
            .from('reminder_jobs')
            .update({
              attempts: job.attempts + 1,
              next_run_at: nextRunAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
        }

        processedCount++;
        
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        errorCount++;
        
        // Mark job as having an error but don't fail completely
        await supabaseClient
          .from('reminder_jobs')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    }

    // Process monthly reminders (3rd, 10th, 17th, 24th of month)
    await processMonthlyReminders(supabaseClient);

    console.log(`Reminder processing complete: ${processedCount} processed, ${escalatedCount} escalated, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        escalated: escalatedCount,
        errors: errorCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: any) {
    console.error('Error in process-reminder-jobs function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

async function sendReminderEmail(supabaseClient: any, job: ReminderJob, templateType: string) {
  console.log(`Sending ${templateType} email for job ${job.id}`);

  const uploadUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/public/upload/reminder/${job.requirement_id}`;
  
  const templateData = {
    subcontractorName: job.requirement.project_sub.subcontractor.company_name,
    projectName: job.requirement.project_sub.project.name,
    requirementName: job.requirement.document_type.name_de,
    documentTypeCode: job.requirement.document_type.code,
    dueDate: job.requirement.due_date ? new Date(job.requirement.due_date).toLocaleDateString('de-DE') : undefined,
    uploadUrl,
    tenantName: job.requirement.project_sub.project.tenant.name,
    tenantLogoUrl: job.requirement.project_sub.project.tenant.logo_url,
    attemptNumber: job.attempts + 1
  };

  // Send email via send-reminder-email edge function
  const { error: emailError } = await supabaseClient.functions.invoke('send-reminder-email', {
    body: {
      to: job.requirement.project_sub.subcontractor.contact_email,
      templateType,
      templateData,
      requirementId: job.requirement_id,
      subcontractorId: job.requirement.project_sub.subcontractor.id,
      tenantId: job.requirement.project_sub.project.tenant.id
    }
  });

  if (emailError) {
    console.error('Failed to send reminder email:', emailError);
    throw emailError;
  }
}

async function sendEscalationEmail(supabaseClient: any, job: ReminderJob) {
  console.log(`Sending escalation email for job ${job.id}`);

  const uploadUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/public/upload/reminder/${job.requirement_id}`;
  
  const templateData = {
    subcontractorName: job.requirement.project_sub.subcontractor.company_name,
    projectName: job.requirement.project_sub.project.name,
    requirementName: job.requirement.document_type.name_de,
    documentTypeCode: job.requirement.document_type.code,
    dueDate: job.requirement.due_date ? new Date(job.requirement.due_date).toLocaleDateString('de-DE') : undefined,
    uploadUrl,
    tenantName: job.requirement.project_sub.project.tenant.name,
    tenantLogoUrl: job.requirement.project_sub.project.tenant.logo_url,
    attemptNumber: job.attempts + 1,
    escalationReason: `Keine Antwort nach ${job.attempts} Erinnerungen`
  };

  // Send escalation email (to project managers, not subcontractor)
  const { error: emailError } = await supabaseClient.functions.invoke('send-reminder-email', {
    body: {
      templateType: 'escalation',
      templateData,
      requirementId: job.requirement_id,
      subcontractorId: job.requirement.project_sub.subcontractor.id,
      tenantId: job.requirement.project_sub.project.tenant.id,
      isEscalation: true
    }
  });

  if (emailError) {
    console.error('Failed to send escalation email:', emailError);
    throw emailError;
  }
}

async function processMonthlyReminders(supabaseClient: any) {
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  // Only process on specific days: 3rd, 10th, 17th, 24th
  if (![3, 10, 17, 24].includes(dayOfMonth)) {
    return;
  }

  console.log(`Processing monthly reminders for day ${dayOfMonth}`);

  // Find all requirements with monthly frequency that need reminders
  const { data: monthlyRequirements, error } = await supabaseClient
    .from('requirements')
    .select(`
      id,
      document_type:document_types!inner (
        code,
        name_de
      ),
      project_sub:project_subs (
        subcontractor:subcontractors (
          id,
          company_name,
          contact_email,
          status
        ),
        project:projects (
          name,
          tenant:tenants (
            id,
            name,
            logo_url
          )
        )
      )
    `)
    .eq('status', 'missing')
    .eq('project_sub.subcontractor.status', 'active'); // Only active subcontractors

  if (error) {
    console.error('Error fetching monthly requirements:', error);
    return;
  }

  for (const req of monthlyRequirements || []) {
    try {
      const uploadUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/public/upload/reminder/${req.id}`;
      
      const templateData = {
        subcontractorName: req.project_sub.subcontractor.company_name,
        projectName: req.project_sub.project.name,
        requirementName: req.document_type.name_de,
        documentTypeCode: req.document_type.code,
        uploadUrl,
        tenantName: req.project_sub.project.tenant.name,
        tenantLogoUrl: req.project_sub.project.tenant.logo_url
      };

      await supabaseClient.functions.invoke('send-reminder-email', {
        body: {
          to: req.project_sub.subcontractor.contact_email,
          templateType: 'monthly_refresh',
          templateData,
          requirementId: req.id,
          subcontractorId: req.project_sub.subcontractor.id,
          tenantId: req.project_sub.project.tenant.id
        }
      });

      console.log(`Sent monthly reminder for requirement ${req.id}`);
      
    } catch (error) {
      console.error(`Failed to send monthly reminder for requirement ${req.id}:`, error);
    }
  }
}

function getNextReminderDate(attemptNumber: number): Date {
  const now = new Date();
  
  // Reminder schedule: T+3, T+7, T+14, T+18, T+25
  switch (attemptNumber) {
    case 1: // After initial (T0), next is T+3
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case 2: // T+7
      return new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days after T+3
    case 3: // T+14
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days after T+7
    case 4: // T+18
      return new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days after T+14
    case 5: // T+25 (final warning)
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days after T+18
    default:
      // After T+25, set to next week for potential final actions
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

serve(handler);