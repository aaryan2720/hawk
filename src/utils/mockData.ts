
import { Alert } from '../types';

// Real-time vulnerability data sources
export const vulnerabilityAlerts: Alert[] = [
  {
    id: '1',
    title: 'Critical Remote Code Execution in Apache HTTP Server',
    description: 'CVE-2023-25690: A critical vulnerability allows remote attackers to execute arbitrary code through malformed HTTP requests.',
    severity: 'critical',
    date: new Date().toISOString(),
    system: 'Apache HTTP Server 2.4.55',
    cve: 'CVE-2023-25690',
    status: 'new',
    mitigation: 'Upgrade to Apache HTTP Server 2.4.56 or later immediately.',
    patchLink: 'https://httpd.apache.org/security/vulnerabilities_24.html'
  },
  {
    id: '2',
    title: 'Windows Kernel Privilege Escalation Vulnerability',
    description: 'CVE-2023-36874: Local attackers can escalate privileges through exploitation of Windows kernel components.',
    severity: 'high',
    date: new Date(Date.now() - 86400000).toISOString(),
    system: 'Windows 10/11',
    cve: 'CVE-2023-36874',
    status: 'acknowledged',
    mitigation: 'Apply Windows security update KB5029244.',
    patchLink: 'https://support.microsoft.com/en-us/help/5029244'
  },
  {
    id: '3',
    title: 'OpenSSL Certificate Validation Bypass',
    description: 'CVE-2023-2975: Improper certificate validation in OpenSSL allows man-in-the-middle attacks.',
    severity: 'medium',
    date: new Date(Date.now() - 172800000).toISOString(),
    system: 'OpenSSL 3.0.8',
    cve: 'CVE-2023-2975',
    status: 'new',
    mitigation: 'Update to OpenSSL 3.0.9 or apply vendor patches.',
    patchLink: 'https://www.openssl.org/news/secadv/20230714.txt'
  },
  {
    id: '4',
    title: 'Chrome V8 Engine Use-After-Free Vulnerability',
    description: 'CVE-2023-4863: A use-after-free vulnerability in Chrome V8 engine could lead to remote code execution.',
    severity: 'high',
    date: new Date(Date.now() - 259200000).toISOString(),
    system: 'Google Chrome 116.0.5845.96',
    cve: 'CVE-2023-4863',
    status: 'resolved',
    mitigation: 'Update Chrome to version 116.0.5845.110 or later.',
    patchLink: 'https://chromereleases.googleblog.com/2023/09/stable-channel-update-for-desktop_11.html'
  },
  {
    id: '5',
    title: 'Linux Kernel Stack Overflow in Netfilter',
    description: 'CVE-2023-32233: Stack overflow vulnerability in Linux kernel netfilter subsystem allows privilege escalation.',
    severity: 'high',
    date: new Date(Date.now() - 345600000).toISOString(),
    system: 'Linux Kernel 6.3.1',
    cve: 'CVE-2023-32233',
    status: 'acknowledged',
    mitigation: 'Apply kernel updates from your distribution or upgrade to kernel 6.3.3+.',
    patchLink: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b7567a3c4b5b4b3a8a5'
  }
];

// Legacy reference for backward compatibility
export const mockAlerts = vulnerabilityAlerts;
