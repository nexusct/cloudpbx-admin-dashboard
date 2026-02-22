import type { IntegrationConnection } from "@shared/schema";

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

function getAuthHeader(config: WordPressConfig): string {
  return "Basic " + Buffer.from(`${config.username}:${config.applicationPassword}`).toString("base64");
}

async function wpApiRequest(config: WordPressConfig, endpoint: string, method: string = "GET", body?: any) {
  const url = `${config.siteUrl.replace(/\/$/, "")}/wp-json${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: getAuthHeader(config),
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WordPress API error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function testConnection(config: WordPressConfig): Promise<{ siteName: string; siteUrl: string; valid: boolean }> {
  try {
    const siteInfo = await wpApiRequest(config, "/wp/v2/settings");
    return {
      siteName: siteInfo.title || "WordPress Site",
      siteUrl: config.siteUrl,
      valid: true,
    };
  } catch (error) {
    try {
      const users = await wpApiRequest(config, "/wp/v2/users/me");
      return {
        siteName: users.name || "WordPress Site",
        siteUrl: config.siteUrl,
        valid: true,
      };
    } catch {
      return { siteName: "", siteUrl: config.siteUrl, valid: false };
    }
  }
}

export async function getUsers(config: WordPressConfig) {
  return wpApiRequest(config, "/wp/v2/users?per_page=100&context=edit");
}

export async function getPosts(config: WordPressConfig, status: string = "publish") {
  return wpApiRequest(config, `/wp/v2/posts?per_page=20&status=${status}`);
}

export async function getPages(config: WordPressConfig) {
  return wpApiRequest(config, "/wp/v2/pages?per_page=100");
}

export async function getPlugins(config: WordPressConfig) {
  return wpApiRequest(config, "/wp/v2/plugins");
}

export async function getSiteHealth(config: WordPressConfig) {
  try {
    const users = await wpApiRequest(config, "/wp/v2/users/me");
    return {
      connected: true,
      user: users.name || users.slug,
      role: users.roles?.[0] || "unknown",
    };
  } catch {
    return { connected: false, user: null, role: null };
  }
}

export async function createPost(config: WordPressConfig, postData: {
  title: string;
  content: string;
  status?: string;
}) {
  return wpApiRequest(config, "/wp/v2/posts", "POST", {
    title: postData.title,
    content: postData.content,
    status: postData.status || "draft",
  });
}

export async function createClickToCallWidget(config: WordPressConfig, phoneNumber: string) {
  const widgetHtml = `
<!-- CloudPBX Click-to-Call Widget -->
<div id="cloudpbx-click-to-call" style="position:fixed;bottom:20px;right:20px;z-index:9999;">
  <a href="tel:${phoneNumber}" style="display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;background:#2563eb;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);text-decoration:none;font-size:24px;" aria-label="Call us">
    &#9742;
  </a>
</div>`;

  return wpApiRequest(config, "/wp/v2/posts", "POST", {
    title: "CloudPBX Click-to-Call Widget",
    content: widgetHtml,
    status: "draft",
    type: "wp_block",
  });
}
