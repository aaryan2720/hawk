
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: string;
  vulnerability: any;
  source: any;
  rule: { id: string; name: string };
  channel: {
    type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'siem';
    config: Record<string, any>;
    priority: number;
  };
  timestamp: string;
}

interface SlackMessage {
  text: string;
  blocks: any[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

interface TeamsMessage {
  "@type": string;
  "@context": string;
  themeColor: string;
  summary: string;
  sections: any[];
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Enterprise notification service started');
    
    const payload: NotificationPayload = await req.json();
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    let result;

    switch (payload.channel.type) {
      case 'email':
        result = await sendEmailNotification(payload);
        break;
      case 'sms':
        result = await sendSMSNotification(payload);
        break;
      case 'webhook':
        result = await sendWebhookNotification(payload);
        break;
      case 'slack':
        result = await sendSlackNotification(payload);
        break;
      case 'teams':
        result = await sendTeamsNotification(payload);
        break;
      case 'siem':
        result = await sendSIEMNotification(payload);
        break;
      default:
        throw new Error(`Unsupported channel type: ${payload.channel.type}`);
    }

    // Log notification in database
    await logNotification(supabaseClient, payload, result);

    return new Response(
      JSON.stringify({ 
        success: true,
        channel: payload.channel.type,
        result
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in enterprise notifications:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendEmailNotification(payload: NotificationPayload): Promise<any> {
  try {
    const emailContent = formatVulnerabilityEmail(payload.vulnerability, payload.source);
    
    // Use SendGrid for enterprise email delivery
    const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendGridApiKey) {
      console.log("SendGrid API key not configured, skipping email");
      return { success: false, reason: "API key not configured" };
    }

    const emailData = {
      personalizations: [
        {
          to: payload.channel.config.recipients || [{ email: payload.channel.config.email }],
          subject: `🚨 ENTERPRISE ALERT: ${payload.vulnerability.severity.toUpperCase()} Vulnerability - ${payload.vulnerability.oemName}`
        }
      ],
      from: {
        email: payload.channel.config.fromEmail || "alerts@hawksecurity.com",
        name: "HAWK Enterprise Security"
      },
      content: [
        {
          type: "text/html",
          value: emailContent
        }
      ],
      mail_settings: {
        sandbox_mode: {
          enable: false
        }
      },
      tracking_settings: {
        click_tracking: {
          enable: true
        },
        open_tracking: {
          enable: true
        }
      }
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendGridApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`);
    }

    return { success: true, messageId: response.headers.get("x-message-id") };
  } catch (error) {
    console.error("Error sending email notification:", error);
    return { success: false, error: error.message };
  }
}

async function sendSlackNotification(payload: NotificationPayload): Promise<any> {
  try {
    const webhookUrl = payload.channel.config.webhookUrl;
    if (!webhookUrl) {
      throw new Error("Slack webhook URL not configured");
    }

    const severityColor = getSeverityColor(payload.vulnerability.severity);
    
    const slackMessage: SlackMessage = {
      text: `🚨 Enterprise Vulnerability Alert: ${payload.vulnerability.severity.toUpperCase()}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🚨 ${payload.vulnerability.severity.toUpperCase()} Vulnerability Alert`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Product:* ${payload.vulnerability.productName}`
            },
            {
              type: "mrkdwn",
              text: `*OEM:* ${payload.vulnerability.oemName}`
            },
            {
              type: "mrkdwn",
              text: `*Severity:* ${payload.vulnerability.severity.toUpperCase()}`
            },
            {
              type: "mrkdwn",
              text: `*CVE:* ${payload.vulnerability.cve}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Description:* ${payload.vulnerability.description}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Mitigation:* ${payload.vulnerability.mitigation}`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Details"
              },
              url: payload.vulnerability.mitigationUrl || "#",
              style: "primary"
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Source: ${payload.source.name} | Rule: ${payload.rule.name} | ${new Date(payload.timestamp).toLocaleString()}`
            }
          ]
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(slackMessage)
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return { success: true, platform: "slack" };
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return { success: false, error: error.message };
  }
}

async function sendTeamsNotification(payload: NotificationPayload): Promise<any> {
  try {
    const webhookUrl = payload.channel.config.webhookUrl;
    if (!webhookUrl) {
      throw new Error("Teams webhook URL not configured");
    }

    const severityColor = getSeverityColor(payload.vulnerability.severity);
    
    const teamsMessage: TeamsMessage = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: severityColor,
      summary: `Enterprise Vulnerability Alert: ${payload.vulnerability.severity.toUpperCase()}`,
      sections: [
        {
          activityTitle: `🚨 ${payload.vulnerability.severity.toUpperCase()} Vulnerability Alert`,
          activitySubtitle: `${payload.vulnerability.oemName} ${payload.vulnerability.productName}`,
          facts: [
            {
              name: "Product",
              value: payload.vulnerability.productName
            },
            {
              name: "OEM",
              value: payload.vulnerability.oemName
            },
            {
              name: "Severity",
              value: payload.vulnerability.severity.toUpperCase()
            },
            {
              name: "CVE",
              value: payload.vulnerability.cve
            },
            {
              name: "Source",
              value: payload.source.name
            },
            {
              name: "Rule",
              value: payload.rule.name
            }
          ],
          text: payload.vulnerability.description
        },
        {
          activityTitle: "Mitigation Strategy",
          text: payload.vulnerability.mitigation
        }
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "View Full Advisory",
          targets: [
            {
              os: "default",
              uri: payload.vulnerability.mitigationUrl || "#"
            }
          ]
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(teamsMessage)
    });

    if (!response.ok) {
      throw new Error(`Teams API error: ${response.status}`);
    }

    return { success: true, platform: "teams" };
  } catch (error) {
    console.error("Error sending Teams notification:", error);
    return { success: false, error: error.message };
  }
}

async function sendSMSNotification(payload: NotificationPayload): Promise<any> {
  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("Twilio credentials not configured, skipping SMS");
      return { success: false, reason: "Twilio not configured" };
    }

    const message = `🚨 HAWK ENTERPRISE ALERT\n${payload.vulnerability.severity.toUpperCase()} vulnerability in ${payload.vulnerability.oemName} ${payload.vulnerability.productName}\nCVE: ${payload.vulnerability.cve}\nCheck your email for details.`;

    const body = new URLSearchParams({
      To: payload.channel.config.phoneNumber,
      From: twilioPhoneNumber,
      Body: message
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      }
    );

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error("Error sending SMS notification:", error);
    return { success: false, error: error.message };
  }
}

async function sendWebhookNotification(payload: NotificationPayload): Promise<any> {
  try {
    const webhookUrl = payload.channel.config.url;
    if (!webhookUrl) {
      throw new Error("Webhook URL not configured");
    }

    const webhookPayload = {
      event: "vulnerability_alert",
      severity: payload.vulnerability.severity,
      vulnerability: payload.vulnerability,
      source: payload.source,
      rule: payload.rule,
      timestamp: payload.timestamp,
      enterpriseMetadata: {
        alertId: `enterprise_${Date.now()}`,
        version: "1.0",
        source: "HAWK Enterprise Security Platform"
      }
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "HAWK-Enterprise-Security/1.0"
    };

    // Add authentication headers if configured
    if (payload.channel.config.authHeader) {
      headers["Authorization"] = payload.channel.config.authHeader;
    }

    if (payload.channel.config.apiKey) {
      headers["X-API-Key"] = payload.channel.config.apiKey;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    return { success: true, statusCode: response.status };
  } catch (error) {
    console.error("Error sending webhook notification:", error);
    return { success: false, error: error.message };
  }
}

async function sendSIEMNotification(payload: NotificationPayload): Promise<any> {
  try {
    // SIEM integration (Splunk, QRadar, Sentinel, etc.)
    const siemPayload = {
      timestamp: payload.timestamp,
      event_type: "vulnerability_alert",
      severity: payload.vulnerability.severity,
      source: "HAWK_Enterprise",
      vulnerability: {
        cve: payload.vulnerability.cve,
        product: payload.vulnerability.productName,
        vendor: payload.vulnerability.oemName,
        description: payload.vulnerability.description,
        mitigation: payload.vulnerability.mitigation
      },
      source_info: {
        name: payload.source.name,
        category: payload.source.category,
        region: payload.source.region
      },
      rule_info: {
        id: payload.rule.id,
        name: payload.rule.name
      },
      enterprise_metadata: {
        alert_id: `enterprise_${Date.now()}`,
        platform: "HAWK_Enterprise_Security"
      }
    };

    // Send to configured SIEM endpoint
    const siemUrl = payload.channel.config.endpoint;
    if (!siemUrl) {
      throw new Error("SIEM endpoint not configured");
    }

    const response = await fetch(siemUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": payload.channel.config.authHeader || ""
      },
      body: JSON.stringify(siemPayload)
    });

    if (!response.ok) {
      throw new Error(`SIEM API error: ${response.status}`);
    }

    return { success: true, platform: "siem", statusCode: response.status };
  } catch (error) {
    console.error("Error sending SIEM notification:", error);
    return { success: false, error: error.message };
  }
}

async function logNotification(
  supabaseClient: any,
  payload: NotificationPayload,
  result: any
): Promise<void> {
  try {
    await supabaseClient
      .from('enterprise_notification_logs')
      .insert({
        rule_id: payload.rule.id,
        channel_type: payload.channel.type,
        vulnerability_cve: payload.vulnerability.cve,
        source_id: payload.source.id,
        status: result.success ? 'sent' : 'failed',
        result: result,
        sent_at: payload.timestamp,
        metadata: {
          channel_config: payload.channel.config,
          vulnerability: payload.vulnerability,
          source: payload.source
        }
      });
  } catch (error) {
    console.error("Error logging notification:", error);
  }
}

function formatVulnerabilityEmail(vulnerability: any, source: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🚨 Enterprise Vulnerability Alert</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
          HAWK Enterprise Security Platform
        </p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-top: 0; font-size: 24px;">
            ${vulnerability.severity.toUpperCase()} Severity Alert
          </h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div>
              <strong style="color: #495057;">Product Name:</strong><br>
              <span style="color: #212529; font-size: 16px;">${vulnerability.productName}</span>
            </div>
            <div>
              <strong style="color: #495057;">OEM Name:</strong><br>
              <span style="color: #212529; font-size: 16px;">${vulnerability.oemName}</span>
            </div>
            <div>
              <strong style="color: #495057;">Severity Level:</strong><br>
              <span style="color: ${getSeverityColor(vulnerability.severity)}; font-size: 16px; font-weight: bold;">
                ${vulnerability.severity.toUpperCase()}
              </span>
            </div>
            <div>
              <strong style="color: #495057;">CVE ID:</strong><br>
              <span style="color: #212529; font-size: 16px;">${vulnerability.cve}</span>
            </div>
          </div>
          
          <div style="margin: 20px 0;">
            <strong style="color: #495057;">Vulnerability Description:</strong><br>
            <p style="color: #212529; line-height: 1.6; margin: 10px 0;">
              ${vulnerability.description}
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <strong style="color: #495057;">Mitigation Strategy:</strong><br>
            <p style="color: #212529; line-height: 1.6; margin: 10px 0;">
              ${vulnerability.mitigation}
            </p>
          </div>
          
          ${vulnerability.mitigationUrl ? `
            <div style="margin: 25px 0;">
              <a href="${vulnerability.mitigationUrl}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Full Security Advisory
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="background: #e9ecef; padding: 20px; border-radius: 8px; font-size: 14px; color: #6c757d;">
          <strong>Source Information:</strong><br>
          Source: ${source.name} | Category: ${source.category} | Region: ${source.region}<br>
          Alert generated at: ${new Date().toLocaleString()}<br>
          <em>This is an automated alert from HAWK Enterprise Security Platform</em>
        </div>
      </div>
    </div>
  `;
}

function getSeverityColor(severity: string): string {
  const colors = {
    critical: "#dc3545",
    high: "#fd7e14",
    medium: "#ffc107",
    low: "#28a745"
  };
  return colors[severity.toLowerCase() as keyof typeof colors] || "#6c757d";
}
