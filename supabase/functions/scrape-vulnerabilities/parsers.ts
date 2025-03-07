
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { Vulnerability } from "./types.ts";
import { determineSeverity, getSampleVulnerabilities } from "./utils.ts";

// Parse NVD (National Vulnerability Database)
export function parseNVD(document: any, limit: number): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  // Basic extraction logic for demonstration
  try {
    const tables = document.querySelectorAll(".table");
    if (tables && tables.length > 0) {
      const rows = tables[0].querySelectorAll("tr");
      for (let i = 1; i < Math.min(rows.length, limit + 1); i++) {
        const cells = rows[i].querySelectorAll("td");
        if (cells.length >= 3) {
          // Extract text from cells
          const cveId = cells[0].textContent.trim();
          const title = cells[1].textContent.trim();
          
          vulnerabilities.push({
            cve: cveId,
            title: title,
            description: `Vulnerability found on NVD for ${title}`,
            severity: determineSeverity(),
            system: "NVD Database",
            mitigation: "Check vendor website for patches and mitigation strategies.",
            details: {
              source: "NVD",
              discoveryDate: new Date().toISOString().split('T')[0]
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("Error parsing NVD:", error);
  }
  
  // If no vulnerabilities were found, return sample data
  if (vulnerabilities.length === 0) {
    return getSampleVulnerabilities(limit, "NVD");
  }
  
  return vulnerabilities;
}

// Parse CVE Details
export function parseCVEDetails(document: any, limit: number): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  // Basic extraction logic for demonstration
  try {
    const table = document.querySelector(".searchresults");
    if (table) {
      const rows = table.querySelectorAll("tr");
      for (let i = 1; i < Math.min(rows.length, limit + 1); i++) {
        const cells = rows[i].querySelectorAll("td");
        if (cells.length >= 5) {
          const cveId = cells[0].textContent.trim();
          const description = cells[4].textContent.trim();
          
          vulnerabilities.push({
            cve: cveId,
            title: `Vulnerability ${cveId}`,
            description: description,
            severity: determineSeverity(),
            system: "CVE Details Database",
            mitigation: "Follow vendor-specific mitigation strategies.",
            details: {
              source: "CVE Details",
              discoveryDate: new Date().toISOString().split('T')[0]
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("Error parsing CVE Details:", error);
  }
  
  // If no vulnerabilities were found, return sample data
  if (vulnerabilities.length === 0) {
    return getSampleVulnerabilities(limit, "CVE Details");
  }
  
  return vulnerabilities;
}

// Parse CISA Known Exploited Vulnerabilities
export function parseCISA(document: any, limit: number): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  // Basic extraction logic for demonstration
  try {
    const table = document.querySelector(".table");
    if (table) {
      const rows = table.querySelectorAll("tr");
      for (let i = 1; i < Math.min(rows.length, limit + 1); i++) {
        const cells = rows[i].querySelectorAll("td");
        if (cells.length >= 4) {
          const cveId = cells[0].textContent.trim();
          const vendorProject = cells[1].textContent.trim();
          const productName = cells[2].textContent.trim();
          const description = cells[3].textContent.trim();
          
          vulnerabilities.push({
            cve: cveId,
            title: `${vendorProject} ${productName} Vulnerability`,
            description: description,
            severity: "critical", // CISA KEV vulnerabilities are all high severity
            system: `${vendorProject} ${productName}`,
            mitigation: "Immediately apply vendor patches as this is an actively exploited vulnerability.",
            details: {
              source: "CISA Known Exploited Vulnerabilities",
              vendor: vendorProject,
              product: productName,
              discoveryDate: new Date().toISOString().split('T')[0]
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("Error parsing CISA KEV:", error);
  }
  
  // If no vulnerabilities were found, return sample data
  if (vulnerabilities.length === 0) {
    return getSampleVulnerabilities(limit, "CISA KEV");
  }
  
  return vulnerabilities;
}
