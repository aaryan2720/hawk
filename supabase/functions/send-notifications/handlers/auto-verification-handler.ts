
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPEmailService } from "../smtp-email-service.ts";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export class AutoVerificationHandler {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private emailService: SMTPEmailService
  ) {}
  
  async handleAutoVerification(userId: string, email: string): Promise<Response> {
    try {
      console.log("=== Auto Verification Handler Started ===");
      console.log("User ID:", userId);
      console.log("Email:", email);
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email address is required" }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Send welcome email using SMTP service
      try {
        const { subject, html } = this.emailService.generateWelcomeEmail(email);
        const emailResult = await this.emailService.sendEmail(email, subject, html);
        
        console.log("Welcome email sent successfully via SMTP");
        
        return new Response(
          JSON.stringify({ 
            success: true,
            email_sent: true,
            provider_used: "SMTP",
            message: "Welcome email sent successfully"
          }),
          { status: 200, headers: corsHeaders }
        );
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        
        return new Response(
          JSON.stringify({ 
            success: false,
            email_sent: false,
            error: emailError.message,
            message: "Failed to send welcome email"
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    } catch (error) {
      console.error("=== Auto Verification Handler Error ===");
      console.error("Error details:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || "Unknown error in auto verification handler"
        }),
        { 
          status: 500, 
          headers: corsHeaders 
        }
      );
    }
  }
}
