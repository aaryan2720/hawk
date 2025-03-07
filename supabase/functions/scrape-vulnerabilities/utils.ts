
import { Vulnerability } from "./types.ts";

// Generate sample vulnerabilities when scraping fails
export function getSampleVulnerabilities(count: number, source: string): Vulnerability[] {
  const samples: Vulnerability[] = [];
  const systems = ["Windows 11", "Ubuntu 22.04", "macOS Ventura", "CentOS 8", "Android 14"];
  const descriptions = [
    "Remote code execution vulnerability in the authentication module",
    "SQL injection vulnerability in the API endpoint",
    "Cross-site scripting vulnerability in the web interface",
    "Privilege escalation vulnerability in the kernel module",
    "Buffer overflow vulnerability in the network stack"
  ];
  
  for (let i = 0; i < count; i++) {
    const systemIndex = Math.floor(Math.random() * systems.length);
    const descIndex = Math.floor(Math.random() * descriptions.length);
    const cveYear = 2023 + Math.floor(Math.random() * 2);
    const cveNum = Math.floor(Math.random() * 10000);
    
    samples.push({
      cve: `CVE-${cveYear}-${cveNum.toString().padStart(4, '0')}`,
      title: `${systems[systemIndex]} Security Vulnerability`,
      description: descriptions[descIndex],
      severity: determineSeverity(),
      system: systems[systemIndex],
      mitigation: "Apply the latest security patches from vendor.",
      patchLink: `https://example.com/patches/${systems[systemIndex].toLowerCase().replace(/\s+/g, '-')}`,
      details: {
        source: source,
        impactScore: (Math.random() * 10).toFixed(1),
        exploitabilityScore: (Math.random() * 10).toFixed(1),
        discoveryDate: new Date().toISOString().split('T')[0]
      }
    });
  }
  
  return samples;
}

// Helper function to generate random severity
export function determineSeverity(): "low" | "medium" | "high" | "critical" {
  const severities = ["low", "medium", "high", "critical"];
  const randomIndex = Math.floor(Math.random() * severities.length);
  return severities[randomIndex] as "low" | "medium" | "high" | "critical";
}
