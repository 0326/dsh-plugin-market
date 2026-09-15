import overviewMarkdown from "../content/whitepaper/v0.1.5-rc.2/00-overview.md?raw";
import compositionMarkdown from "../content/whitepaper/v0.1.5-rc.2/01-composition.md?raw";
import bootConfigMarkdown from "../content/whitepaper/v0.1.5-rc.2/02-boot-config.md?raw";
import agentCoreMarkdown from "../content/whitepaper/v0.1.5-rc.2/03-agent-core.md?raw";
import runtimeMarkdown from "../content/whitepaper/v0.1.5-rc.2/04-runtime.md?raw";
import sessionStateMarkdown from "../content/whitepaper/v0.1.5-rc.2/05-session-state.md?raw";
import capabilitySeamsMarkdown from "../content/whitepaper/v0.1.5-rc.2/06-capability-seams.md?raw";
import coreCapabilitiesMarkdown from "../content/whitepaper/v0.1.5-rc.2/07-core-capabilities.md?raw";
import presetsMarkdown from "../content/whitepaper/v0.1.5-rc.2/08-presets.md?raw";
import subagentWorkflowJobsMarkdown from "../content/whitepaper/v0.1.5-rc.2/09-subagent-workflow-jobs.md?raw";
import hooksInterceptionMarkdown from "../content/whitepaper/v0.1.5-rc.2/10-hooks-interception.md?raw";
import webClientMarkdown from "../content/whitepaper/v0.1.5-rc.2/11-web-client.md?raw";
import pluginsMarkdown from "../content/whitepaper/v0.1.5-rc.2/12-plugin-development.md?raw";
import extensionMapMarkdown from "../content/whitepaper/v0.1.5-rc.2/13-extension-map.md?raw";
import sdkAcpWebhookMarkdown from "../content/whitepaper/v0.1.5-rc.2/14-sdk-acp-webhook.md?raw";
import securityPermissionsMarkdown from "../content/whitepaper/v0.1.5-rc.2/15-security-permissions.md?raw";
import diagnosticsObservabilityMarkdown from "../content/whitepaper/v0.1.5-rc.2/16-diagnostics-observability.md?raw";
import evolutionMarkdown from "../content/whitepaper/v0.1.5-rc.2/17-evolution.md?raw";

import overviewHtml from "../content/whitepaper/generated/v0.1.5-rc.2/00-overview.html?raw";
import compositionHtml from "../content/whitepaper/generated/v0.1.5-rc.2/01-composition.html?raw";
import bootConfigHtml from "../content/whitepaper/generated/v0.1.5-rc.2/02-boot-config.html?raw";
import agentCoreHtml from "../content/whitepaper/generated/v0.1.5-rc.2/03-agent-core.html?raw";
import runtimeHtml from "../content/whitepaper/generated/v0.1.5-rc.2/04-runtime.html?raw";
import sessionStateHtml from "../content/whitepaper/generated/v0.1.5-rc.2/05-session-state.html?raw";
import capabilitySeamsHtml from "../content/whitepaper/generated/v0.1.5-rc.2/06-capability-seams.html?raw";
import coreCapabilitiesHtml from "../content/whitepaper/generated/v0.1.5-rc.2/07-core-capabilities.html?raw";
import presetsHtml from "../content/whitepaper/generated/v0.1.5-rc.2/08-presets.html?raw";
import subagentWorkflowJobsHtml from "../content/whitepaper/generated/v0.1.5-rc.2/09-subagent-workflow-jobs.html?raw";
import hooksInterceptionHtml from "../content/whitepaper/generated/v0.1.5-rc.2/10-hooks-interception.html?raw";
import webClientHtml from "../content/whitepaper/generated/v0.1.5-rc.2/11-web-client.html?raw";
import pluginsHtml from "../content/whitepaper/generated/v0.1.5-rc.2/12-plugin-development.html?raw";
import extensionMapHtml from "../content/whitepaper/generated/v0.1.5-rc.2/13-extension-map.html?raw";
import sdkAcpWebhookHtml from "../content/whitepaper/generated/v0.1.5-rc.2/14-sdk-acp-webhook.html?raw";
import securityPermissionsHtml from "../content/whitepaper/generated/v0.1.5-rc.2/15-security-permissions.html?raw";
import diagnosticsObservabilityHtml from "../content/whitepaper/generated/v0.1.5-rc.2/16-diagnostics-observability.html?raw";
import evolutionHtml from "../content/whitepaper/generated/v0.1.5-rc.2/17-evolution.html?raw";

export const V015RC2_ASSETS = {
	overview: { markdown: overviewMarkdown, html: overviewHtml },
	composition: { markdown: compositionMarkdown, html: compositionHtml },
	"boot-config": { markdown: bootConfigMarkdown, html: bootConfigHtml },
	"agent-core": { markdown: agentCoreMarkdown, html: agentCoreHtml },
	runtime: { markdown: runtimeMarkdown, html: runtimeHtml },
	"session-state": { markdown: sessionStateMarkdown, html: sessionStateHtml },
	"capability-seams": { markdown: capabilitySeamsMarkdown, html: capabilitySeamsHtml },
	"core-capabilities": { markdown: coreCapabilitiesMarkdown, html: coreCapabilitiesHtml },
	presets: { markdown: presetsMarkdown, html: presetsHtml },
	"subagent-workflow-jobs": { markdown: subagentWorkflowJobsMarkdown, html: subagentWorkflowJobsHtml },
	"hooks-interception": { markdown: hooksInterceptionMarkdown, html: hooksInterceptionHtml },
	"web-client": { markdown: webClientMarkdown, html: webClientHtml },
	"plugin-development": { markdown: pluginsMarkdown, html: pluginsHtml },
	"extension-map": { markdown: extensionMapMarkdown, html: extensionMapHtml },
	"sdk-acp-webhook": { markdown: sdkAcpWebhookMarkdown, html: sdkAcpWebhookHtml },
	"security-permissions": { markdown: securityPermissionsMarkdown, html: securityPermissionsHtml },
	"diagnostics-observability": { markdown: diagnosticsObservabilityMarkdown, html: diagnosticsObservabilityHtml },
	evolution: { markdown: evolutionMarkdown, html: evolutionHtml },
} as const;
