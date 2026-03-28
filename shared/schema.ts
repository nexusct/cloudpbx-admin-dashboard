import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
  firstName: true,
  lastName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Extensions table
export const extensions = pgTable("extensions", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 10 }).notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull().default("sip"),
  status: text("status").notNull().default("offline"),
  userId: varchar("user_id").references(() => users.id),
  voicemailEnabled: boolean("voicemail_enabled").default(true),
  callForwardingEnabled: boolean("call_forwarding_enabled").default(false),
  callForwardingNumber: text("call_forwarding_number"),
  ringTimeout: integer("ring_timeout").default(30),
  callerIdName: text("caller_id_name"),
  callerIdNumber: text("caller_id_number"),
  department: text("department"),
  location: text("location"),
});

export const insertExtensionSchema = createInsertSchema(extensions).omit({ id: true });
export type InsertExtension = z.infer<typeof insertExtensionSchema>;
export type Extension = typeof extensions.$inferSelect;

// DIDs (Direct Inward Dialing numbers)
export const dids = pgTable("dids", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 20 }).notNull().unique(),
  country: text("country").notNull().default("US"),
  city: text("city"),
  state: text("state"),
  provider: text("provider").default("internal"),
  status: text("status").notNull().default("active"),
  type: text("type").notNull().default("local"),
  monthlyRate: integer("monthly_rate").default(0),
  assignedTo: text("assigned_to"),
  assignedType: text("assigned_type"),
  smsEnabled: boolean("sms_enabled").default(false),
  faxEnabled: boolean("fax_enabled").default(false),
  e911Enabled: boolean("e911_enabled").default(false),
});

export const insertDidSchema = createInsertSchema(dids).omit({ id: true });
export type InsertDid = z.infer<typeof insertDidSchema>;
export type Did = typeof dids.$inferSelect;

// Call Flows / IVR
export const callFlows = pgTable("call_flows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("ivr"),
  enabled: boolean("enabled").default(true),
  nodes: jsonb("nodes").default([]),
  edges: jsonb("edges").default([]),
  didId: integer("did_id").references(() => dids.id),
});

export const insertCallFlowSchema = createInsertSchema(callFlows).omit({ id: true });
export type InsertCallFlow = z.infer<typeof insertCallFlowSchema>;
export type CallFlow = typeof callFlows.$inferSelect;

// Devices / Handsets
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mac: varchar("mac", { length: 17 }).unique(),
  model: text("model"),
  manufacturer: text("manufacturer"),
  type: text("type").notNull().default("desk_phone"),
  status: text("status").notNull().default("offline"),
  firmwareVersion: text("firmware_version"),
  latestFirmware: text("latest_firmware"),
  extensionId: integer("extension_id").references(() => extensions.id),
  ipAddress: text("ip_address"),
  lastSeen: timestamp("last_seen"),
  provisioningStatus: text("provisioning_status").default("pending"),
});

export const insertDeviceSchema = createInsertSchema(devices).omit({ id: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

// Call Logs / CDR
export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  callId: varchar("call_id", { length: 50 }).notNull(),
  direction: text("direction").notNull(),
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  fromName: text("from_name"),
  toName: text("to_name"),
  status: text("status").notNull(),
  duration: integer("duration").default(0),
  startTime: timestamp("start_time").notNull(),
  answerTime: timestamp("answer_time"),
  endTime: timestamp("end_time"),
  recordingUrl: text("recording_url"),
  extensionId: integer("extension_id").references(() => extensions.id),
  didId: integer("did_id").references(() => dids.id),
  hangupCause: text("hangup_cause"),
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({ id: true });
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type CallLog = typeof callLogs.$inferSelect;

// SMS Messages
export const smsMessages = pgTable("sms_messages", {
  id: serial("id").primaryKey(),
  direction: text("direction").notNull(),
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  didId: integer("did_id").references(() => dids.id),
  segments: integer("segments").default(1),
  mediaUrls: jsonb("media_urls").default([]),
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({ id: true });
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;

// Fax Messages
export const faxMessages = pgTable("fax_messages", {
  id: serial("id").primaryKey(),
  direction: text("direction").notNull(),
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  status: text("status").notNull().default("pending"),
  pages: integer("pages").default(0),
  sentAt: timestamp("sent_at"),
  receivedAt: timestamp("received_at"),
  didId: integer("did_id").references(() => dids.id),
  documentUrl: text("document_url"),
  thumbnailUrl: text("thumbnail_url"),
  resolution: text("resolution"),
});

export const insertFaxMessageSchema = createInsertSchema(faxMessages).omit({ id: true });
export type InsertFaxMessage = z.infer<typeof insertFaxMessageSchema>;
export type FaxMessage = typeof faxMessages.$inferSelect;

// Integrations
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  icon: text("icon"),
  status: text("status").notNull().default("available"),
  config: jsonb("config").default({}),
  features: jsonb("features").default([]),
  popular: boolean("popular").default(false),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true });
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

export const integrationConnections = pgTable("integration_connections", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull().references(() => integrations.id),
  provider: text("provider").notNull(),
  clientId: text("client_id"),
  clientSecret: text("client_secret"),
  tenantId: text("tenant_id"),
  instanceUrl: text("instance_url"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  scopes: text("scopes"),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  extraConfig: jsonb("extra_config").default({}),
  connectedAt: timestamp("connected_at").default(sql`CURRENT_TIMESTAMP`),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("idle"),
});

export const insertIntegrationConnectionSchema = createInsertSchema(integrationConnections).omit({ id: true, connectedAt: true });
export type InsertIntegrationConnection = z.infer<typeof insertIntegrationConnectionSchema>;
export type IntegrationConnection = typeof integrationConnections.$inferSelect;

// AI Chat Sessions
export const aiSessions = pgTable("ai_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => aiSessions.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAiSessionSchema = createInsertSchema(aiSessions).omit({ id: true, createdAt: true });
export type InsertAiSession = z.infer<typeof insertAiSessionSchema>;
export type AiSession = typeof aiSessions.$inferSelect;

export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({ id: true, createdAt: true });
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;

// Ring Groups
export const ringGroups = pgTable("ring_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  number: varchar("number", { length: 10 }).notNull().unique(),
  strategy: text("strategy").notNull().default("simultaneous"),
  ringTimeout: integer("ring_timeout").default(20),
  failoverDestination: text("failover_destination"),
  members: jsonb("members").default([]),
  enabled: boolean("enabled").default(true),
});

export const insertRingGroupSchema = createInsertSchema(ringGroups).omit({ id: true });
export type InsertRingGroup = z.infer<typeof insertRingGroupSchema>;
export type RingGroup = typeof ringGroups.$inferSelect;

// Call Queues
export const callQueues = pgTable("call_queues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  number: varchar("number", { length: 10 }).notNull().unique(),
  strategy: text("strategy").notNull().default("round_robin"),
  maxWaitTime: integer("max_wait_time").default(300),
  maxCallers: integer("max_callers").default(50),
  agents: jsonb("agents").default([]),
  holdMusic: text("hold_music"),
  announcePosition: boolean("announce_position").default(true),
  enabled: boolean("enabled").default(true),
});

export const insertCallQueueSchema = createInsertSchema(callQueues).omit({ id: true });
export type InsertCallQueue = z.infer<typeof insertCallQueueSchema>;
export type CallQueue = typeof callQueues.$inferSelect;

// System Settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  category: text("category").notNull().default("general"),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ id: true });
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// Contacts / Phonebook
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  company: text("company"),
  email: text("email"),
  phoneNumbers: jsonb("phone_numbers").default([]),
  tags: jsonb("tags").default([]),
  notes: text("notes"),
  avatar: text("avatar"),
  isVip: boolean("is_vip").default(false),
  doNotCall: boolean("do_not_call").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Voicemails
export const voicemails = pgTable("voicemails", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").references(() => extensions.id),
  callerNumber: text("caller_number").notNull(),
  callerName: text("caller_name"),
  duration: integer("duration").default(0),
  audioUrl: text("audio_url"),
  transcription: text("transcription"),
  transcriptionConfidence: integer("transcription_confidence"),
  isRead: boolean("is_read").default(false),
  isUrgent: boolean("is_urgent").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertVoicemailSchema = createInsertSchema(voicemails).omit({ id: true, createdAt: true });
export type InsertVoicemail = z.infer<typeof insertVoicemailSchema>;
export type Voicemail = typeof voicemails.$inferSelect;

// Call Transcriptions & AI Analysis
export const callTranscriptions = pgTable("call_transcriptions", {
  id: serial("id").primaryKey(),
  callLogId: integer("call_log_id").references(() => callLogs.id),
  transcription: text("transcription"),
  summary: text("summary"),
  sentiment: text("sentiment"),
  sentimentScore: integer("sentiment_score"),
  keywords: jsonb("keywords").default([]),
  topics: jsonb("topics").default([]),
  actionItems: jsonb("action_items").default([]),
  speakers: jsonb("speakers").default([]),
  qualityScore: integer("quality_score"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCallTranscriptionSchema = createInsertSchema(callTranscriptions).omit({ id: true, createdAt: true });
export type InsertCallTranscription = z.infer<typeof insertCallTranscriptionSchema>;
export type CallTranscription = typeof callTranscriptions.$inferSelect;

// Time-Based Routing Rules
export const routingRules = pgTable("routing_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priority: integer("priority").default(100),
  enabled: boolean("enabled").default(true),
  type: text("type").notNull().default("time"),
  conditions: jsonb("conditions").default({}),
  action: text("action").notNull(),
  destination: text("destination"),
  didId: integer("did_id").references(() => dids.id),
});

export const insertRoutingRuleSchema = createInsertSchema(routingRules).omit({ id: true });
export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;
export type RoutingRule = typeof routingRules.$inferSelect;

// Holiday Schedules
export const holidaySchedules = pgTable("holiday_schedules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  recurring: boolean("recurring").default(false),
  action: text("action").notNull().default("voicemail"),
  destination: text("destination"),
  greeting: text("greeting"),
});

export const insertHolidayScheduleSchema = createInsertSchema(holidaySchedules).omit({ id: true });
export type InsertHolidaySchedule = z.infer<typeof insertHolidayScheduleSchema>;
export type HolidaySchedule = typeof holidaySchedules.$inferSelect;

// Webhooks
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: jsonb("events").default([]),
  secret: text("secret"),
  enabled: boolean("enabled").default(true),
  lastTriggered: timestamp("last_triggered"),
  failureCount: integer("failure_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({ id: true, createdAt: true, lastTriggered: true, failureCount: true });
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;

// Call Dispositions
export const callDispositions = pgTable("call_dispositions", {
  id: serial("id").primaryKey(),
  callLogId: integer("call_log_id").references(() => callLogs.id),
  code: text("code").notNull(),
  label: text("label").notNull(),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCallDispositionSchema = createInsertSchema(callDispositions).omit({ id: true, createdAt: true });
export type InsertCallDisposition = z.infer<typeof insertCallDispositionSchema>;
export type CallDisposition = typeof callDispositions.$inferSelect;

// Speed Dials
export const speedDials = pgTable("speed_dials", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  number: text("number").notNull(),
  icon: text("icon"),
  color: text("color"),
});

export const insertSpeedDialSchema = createInsertSchema(speedDials).omit({ id: true });
export type InsertSpeedDial = z.infer<typeof insertSpeedDialSchema>;
export type SpeedDial = typeof speedDials.$inferSelect;

// Call Parking Slots
export const parkingSlots = pgTable("parking_slots", {
  id: serial("id").primaryKey(),
  slotNumber: integer("slot_number").notNull().unique(),
  status: text("status").notNull().default("available"),
  callId: varchar("call_id", { length: 50 }),
  callerNumber: text("caller_number"),
  callerName: text("caller_name"),
  parkedBy: integer("parked_by").references(() => extensions.id),
  parkedAt: timestamp("parked_at"),
  expiresAt: timestamp("expires_at"),
});

export const insertParkingSlotSchema = createInsertSchema(parkingSlots).omit({ id: true });
export type InsertParkingSlot = z.infer<typeof insertParkingSlotSchema>;
export type ParkingSlot = typeof parkingSlots.$inferSelect;

// Agent Status / Presence
export const agentStatus = pgTable("agent_status", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").references(() => extensions.id).unique(),
  status: text("status").notNull().default("available"),
  statusMessage: text("status_message"),
  lastActivity: timestamp("last_activity").default(sql`CURRENT_TIMESTAMP`),
  currentCallId: varchar("current_call_id", { length: 50 }),
  callsHandled: integer("calls_handled").default(0),
  avgHandleTime: integer("avg_handle_time").default(0),
  loginTime: timestamp("login_time"),
});

export const insertAgentStatusSchema = createInsertSchema(agentStatus).omit({ id: true });
export type InsertAgentStatus = z.infer<typeof insertAgentStatusSchema>;
export type AgentStatus = typeof agentStatus.$inferSelect;

// Queue Statistics (real-time)
export const queueStats = pgTable("queue_stats", {
  id: serial("id").primaryKey(),
  queueId: integer("queue_id").references(() => callQueues.id).unique(),
  callersWaiting: integer("callers_waiting").default(0),
  avgWaitTime: integer("avg_wait_time").default(0),
  longestWait: integer("longest_wait").default(0),
  callsToday: integer("calls_today").default(0),
  abandonedToday: integer("abandoned_today").default(0),
  slaPercentage: integer("sla_percentage").default(100),
  agentsAvailable: integer("agents_available").default(0),
  agentsBusy: integer("agents_busy").default(0),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertQueueStatSchema = createInsertSchema(queueStats).omit({ id: true, updatedAt: true });
export type InsertQueueStat = z.infer<typeof insertQueueStatSchema>;
export type QueueStat = typeof queueStats.$inferSelect;

// SIP Providers (templates for SIP trunk configuration)
export const sipProviders = pgTable("sip_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  website: text("website"),
  regions: jsonb("regions").default([]),
  transport: text("transport").default("udp"),
  registrationServer: text("registration_server"),
  outboundProxy: text("outbound_proxy"),
  port: integer("port").default(5060),
  tlsPort: integer("tls_port").default(5061),
  codecs: jsonb("codecs").default(["G.711u", "G.711a", "G.729"]),
  dtmfMode: text("dtmf_mode").default("rfc2833"),
  natTraversal: boolean("nat_traversal").default(true),
  srtpEnabled: boolean("srtp_enabled").default(false),
  tlsEnabled: boolean("tls_enabled").default(false),
  registrationExpiry: integer("registration_expiry").default(3600),
  authMethod: text("auth_method").default("digest"),
  qualifyFrequency: integer("qualify_frequency").default(60),
  keepAlive: integer("keep_alive").default(30),
  maxChannels: integer("max_channels").default(0),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertSipProviderSchema = createInsertSchema(sipProviders).omit({ id: true, createdAt: true });
export type InsertSipProvider = z.infer<typeof insertSipProviderSchema>;
export type SipProvider = typeof sipProviders.$inferSelect;

// SIP Trunks (configured instances)
export const sipTrunks = pgTable("sip_trunks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  providerId: integer("provider_id").references(() => sipProviders.id),
  status: text("status").notNull().default("inactive"),
  username: text("username"),
  authUsername: text("auth_username"),
  host: text("host"),
  port: integer("port").default(5060),
  transport: text("transport").default("udp"),
  codecs: jsonb("codecs").default([]),
  maxChannels: integer("max_channels").default(0),
  callerIdName: text("caller_id_name"),
  callerIdNumber: text("caller_id_number"),
  outboundRoutes: jsonb("outbound_routes").default([]),
  inboundRoutes: jsonb("inbound_routes").default([]),
  settings: jsonb("settings").default({}),
  enabled: boolean("enabled").default(true),
  registrationStatus: text("registration_status").default("unregistered"),
  lastRegistration: timestamp("last_registration"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertSipTrunkSchema = createInsertSchema(sipTrunks).omit({ id: true, createdAt: true, updatedAt: true, lastRegistration: true, registrationStatus: true });
export type InsertSipTrunk = z.infer<typeof insertSipTrunkSchema>;
export type SipTrunk = typeof sipTrunks.$inferSelect;

// Device Templates (handset/endpoint models)
export const deviceTemplates = pgTable("device_templates", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(),
  model: text("model").notNull(),
  deviceType: text("device_type").notNull().default("phone"),
  image: text("image"),
  firmwareVersion: text("firmware_version"),
  provisioningProtocol: text("provisioning_protocol").default("http"),
  provisioningPath: text("provisioning_path"),
  defaultPorts: jsonb("default_ports").default({ sip: 5060, rtp: "10000-20000" }),
  codecs: jsonb("codecs").default(["G.711u", "G.711a", "G.729", "G.722"]),
  lineCount: integer("line_count").default(1),
  blfKeys: integer("blf_keys").default(0),
  softKeys: integer("soft_keys").default(0),
  expansionModules: integer("expansion_modules").default(0),
  hasDisplay: boolean("has_display").default(true),
  hasBluetooth: boolean("has_bluetooth").default(false),
  hasWifi: boolean("has_wifi").default(false),
  hasPoe: boolean("has_poe").default(true),
  hasGigabit: boolean("has_gigabit").default(false),
  hasCamera: boolean("has_camera").default(false),
  settings: jsonb("settings").default({}),
  configTemplate: text("config_template"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertDeviceTemplateSchema = createInsertSchema(deviceTemplates).omit({ id: true, createdAt: true });
export type InsertDeviceTemplate = z.infer<typeof insertDeviceTemplateSchema>;
export type DeviceTemplate = typeof deviceTemplates.$inferSelect;

// AI Agent Virtual Extensions
export const aiAgents = pgTable("ai_agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull().default("You are a helpful AI assistant for the company. Answer questions politely and assist the caller."),
  voice: text("voice").notNull().default("alloy"),
  extensionId: integer("extension_id").references(() => extensions.id),
  mcpServers: jsonb("mcp_servers").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({ id: true, createdAt: true });
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;
export type AiAgent = typeof aiAgents.$inferSelect;

export const aiAgentCalls = pgTable("ai_agent_calls", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => aiAgents.id),
  callId: varchar("call_id", { length: 50 }).notNull(),
  callerNumber: text("caller_number").notNull(),
  duration: integer("duration").default(0),
  transcript: text("transcript"),
  recordingUrl: text("recording_url"),
  managerFeedback: text("manager_feedback"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAiAgentCallSchema = createInsertSchema(aiAgentCalls).omit({ id: true, createdAt: true });
export type InsertAiAgentCall = z.infer<typeof insertAiAgentCallSchema>;
export type AiAgentCall = typeof aiAgentCalls.$inferSelect;

// ─── FEATURE 1: WebRTC Softphone Sessions ────────────────────────────────────
export const softphoneSessions = pgTable("softphone_sessions", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").references(() => extensions.id),
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  peerConnection: text("peer_connection"),
  status: text("status").notNull().default("idle"), // idle, calling, connected, held
  remoteNumber: text("remote_number"),
  direction: text("direction").default("outbound"), // inbound, outbound
  startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`),
  endedAt: timestamp("ended_at"),
  duration: integer("duration").default(0),
});
export const insertSoftphoneSessionSchema = createInsertSchema(softphoneSessions).omit({ id: true });
export type InsertSoftphoneSession = z.infer<typeof insertSoftphoneSessionSchema>;
export type SoftphoneSession = typeof softphoneSessions.$inferSelect;

// ─── FEATURE 2: Call Quality Scores ──────────────────────────────────────────
export const callQualityScores = pgTable("call_quality_scores", {
  id: serial("id").primaryKey(),
  callId: varchar("call_id", { length: 50 }).notNull(),
  extensionId: integer("extension_id").references(() => extensions.id),
  overallScore: integer("overall_score").default(0), // 0-100
  clarityScore: integer("clarity_score").default(0),
  pacingScore: integer("pacing_score").default(0),
  professionalismScore: integer("professionalism_score").default(0),
  empathyScore: integer("empathy_score").default(0),
  resolutionScore: integer("resolution_score").default(0),
  aiSummary: text("ai_summary"),
  suggestions: jsonb("suggestions").default([]),
  keywords: jsonb("keywords").default([]),
  silencePercentage: integer("silence_percentage").default(0),
  talkRatio: integer("talk_ratio").default(50),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertCallQualityScoreSchema = createInsertSchema(callQualityScores).omit({ id: true, createdAt: true });
export type InsertCallQualityScore = z.infer<typeof insertCallQualityScoreSchema>;
export type CallQualityScore = typeof callQualityScores.$inferSelect;

// ─── FEATURE 3: Predictive Dialer Campaigns ──────────────────────────────────
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  type: text("type").notNull().default("predictive"), // predictive, preview, progressive, power
  callerIdNumber: text("caller_id_number"),
  maxConcurrentCalls: integer("max_concurrent_calls").default(5),
  dialingRatio: integer("dialing_ratio").default(3),
  retryAttempts: integer("retry_attempts").default(3),
  retryDelay: integer("retry_delay").default(60),
  scheduleStart: text("schedule_start").default("09:00"),
  scheduleEnd: text("schedule_end").default("17:00"),
  timezone: text("timezone").default("America/New_York"),
  totalContacts: integer("total_contacts").default(0),
  dialedCount: integer("dialed_count").default(0),
  answeredCount: integer("answered_count").default(0),
  completedCount: integer("completed_count").default(0),
  dncListEnabled: boolean("dnc_list_enabled").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export const campaignContacts = pgTable("campaign_contacts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  phoneNumber: text("phone_number").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  status: text("status").notNull().default("pending"), // pending, dialing, answered, completed, dnc, failed
  attempts: integer("attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  notes: text("notes"),
  customData: jsonb("custom_data").default({}),
});
export const insertCampaignContactSchema = createInsertSchema(campaignContacts).omit({ id: true });
export type InsertCampaignContact = z.infer<typeof insertCampaignContactSchema>;
export type CampaignContact = typeof campaignContacts.$inferSelect;

// ─── FEATURE 4: Voice Biometrics ─────────────────────────────────────────────
export const voicePrints = pgTable("voice_prints", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").references(() => extensions.id),
  contactId: integer("contact_id"),
  phoneNumber: text("phone_number"),
  displayName: text("display_name").notNull(),
  voicePrintData: text("voice_print_data"), // encrypted biometric template
  enrollmentStatus: text("enrollment_status").notNull().default("pending"), // pending, enrolled, failed
  enrollmentSamples: integer("enrollment_samples").default(0),
  requiredSamples: integer("required_samples").default(3),
  confidenceThreshold: integer("confidence_threshold").default(85),
  lastVerifiedAt: timestamp("last_verified_at"),
  verificationCount: integer("verification_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertVoicePrintSchema = createInsertSchema(voicePrints).omit({ id: true, createdAt: true });
export type InsertVoicePrint = z.infer<typeof insertVoicePrintSchema>;
export type VoicePrint = typeof voicePrints.$inferSelect;

// ─── FEATURE 5: Emotion Analytics ────────────────────────────────────────────
export const emotionAnalytics = pgTable("emotion_analytics", {
  id: serial("id").primaryKey(),
  callId: varchar("call_id", { length: 50 }).notNull(),
  extensionId: integer("extension_id").references(() => extensions.id),
  agentEmotions: jsonb("agent_emotions").default({}), // { happy: 30, neutral: 50, frustrated: 10, ... }
  callerEmotions: jsonb("caller_emotions").default({}),
  emotionTimeline: jsonb("emotion_timeline").default([]), // array of {timestamp, emotion, speaker, confidence}
  overallSentiment: text("overall_sentiment").default("neutral"), // positive, neutral, negative
  escalationRisk: integer("escalation_risk").default(0), // 0-100
  satisfactionScore: integer("satisfaction_score").default(50), // 0-100
  frustrationPeak: integer("frustration_peak").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertEmotionAnalyticsSchema = createInsertSchema(emotionAnalytics).omit({ id: true, createdAt: true });
export type InsertEmotionAnalytics = z.infer<typeof insertEmotionAnalyticsSchema>;
export type EmotionAnalytics = typeof emotionAnalytics.$inferSelect;

// ─── FEATURE 6: Fraud Detection ──────────────────────────────────────────────
export const fraudEvents = pgTable("fraud_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // toll_fraud, robocall, spoofing, registration_attack, high_rate
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("open"), // open, investigating, resolved, false_positive
  sourceNumber: text("source_number"),
  destinationNumber: text("destination_number"),
  trunkId: integer("trunk_id"),
  extensionId: integer("extension_id").references(() => extensions.id),
  callCount: integer("call_count").default(1),
  estimatedLoss: integer("estimated_loss").default(0), // in cents
  description: text("description").notNull(),
  evidence: jsonb("evidence").default({}),
  detectedAt: timestamp("detected_at").default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  blockedIp: text("blocked_ip"),
  geoLocation: text("geo_location"),
});
export const insertFraudEventSchema = createInsertSchema(fraudEvents).omit({ id: true, detectedAt: true });
export type InsertFraudEvent = z.infer<typeof insertFraudEventSchema>;
export type FraudEvent = typeof fraudEvents.$inferSelect;

export const blockedNumbers = pgTable("blocked_numbers", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  reason: text("reason").notNull().default("spam"),
  source: text("source").notNull().default("manual"), // manual, auto, dnc, fraud
  fraudEventId: integer("fraud_event_id").references(() => fraudEvents.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertBlockedNumberSchema = createInsertSchema(blockedNumbers).omit({ id: true, createdAt: true });
export type InsertBlockedNumber = z.infer<typeof insertBlockedNumberSchema>;
export type BlockedNumber = typeof blockedNumbers.$inferSelect;

// ─── FEATURE 7: Compliance Recording Policies ────────────────────────────────
export const recordingPolicies = pgTable("recording_policies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  recordingMode: text("recording_mode").notNull().default("always"), // always, on_demand, never, announcement
  retentionDays: integer("retention_days").default(90),
  encryptionEnabled: boolean("encryption_enabled").default(true),
  consentRequired: boolean("consent_required").default(false),
  consentMessage: text("consent_message"),
  autoDeleteEnabled: boolean("auto_delete_enabled").default(true),
  complianceFramework: text("compliance_framework").default("none"), // gdpr, hipaa, pci, sox, none
  applyToInbound: boolean("apply_to_inbound").default(true),
  applyToOutbound: boolean("apply_to_outbound").default(true),
  extensionIds: jsonb("extension_ids").default([]),
  didIds: jsonb("did_ids").default([]),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertRecordingPolicySchema = createInsertSchema(recordingPolicies).omit({ id: true, createdAt: true });
export type InsertRecordingPolicy = z.infer<typeof insertRecordingPolicySchema>;
export type RecordingPolicy = typeof recordingPolicies.$inferSelect;

// ─── FEATURE 8: Smart Callback Scheduler ─────────────────────────────────────
export const callbackRequests = pgTable("callback_requests", {
  id: serial("id").primaryKey(),
  callerNumber: text("caller_number").notNull(),
  callerName: text("caller_name"),
  extensionId: integer("extension_id").references(() => extensions.id),
  queueId: integer("queue_id"),
  status: text("status").notNull().default("pending"), // pending, scheduled, attempted, completed, expired
  requestedAt: timestamp("requested_at").default(sql`CURRENT_TIMESTAMP`),
  scheduledFor: timestamp("scheduled_for"),
  attemptedAt: timestamp("attempted_at"),
  completedAt: timestamp("completed_at"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  notes: text("notes"),
  aiOptimized: boolean("ai_optimized").default(true),
  optimalTimeSlots: jsonb("optimal_time_slots").default([]),
  reason: text("reason").default("queue_overflow"),
});
export const insertCallbackRequestSchema = createInsertSchema(callbackRequests).omit({ id: true, requestedAt: true });
export type InsertCallbackRequest = z.infer<typeof insertCallbackRequestSchema>;
export type CallbackRequest = typeof callbackRequests.$inferSelect;

// ─── FEATURE 9: Number Porting Tracker ───────────────────────────────────────
export const portingRequests = pgTable("porting_requests", {
  id: serial("id").primaryKey(),
  portingType: text("porting_type").notNull().default("port_in"), // port_in, port_out
  status: text("status").notNull().default("draft"), // draft, submitted, pending, foc_received, completed, rejected, cancelled
  phoneNumbers: jsonb("phone_numbers").notNull().default([]),
  losingCarrier: text("losing_carrier"),
  gainingCarrier: text("gaining_carrier"),
  accountNumber: text("account_number"),
  billingName: text("billing_name"),
  serviceAddress: text("service_address"),
  focDate: timestamp("foc_date"),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  rejectionReason: text("rejection_reason"),
  portingPin: text("porting_pin"),
  lotaNumber: text("lota_number"),
  notes: text("notes"),
  documents: jsonb("documents").default([]),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertPortingRequestSchema = createInsertSchema(portingRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPortingRequest = z.infer<typeof insertPortingRequestSchema>;
export type PortingRequest = typeof portingRequests.$inferSelect;

// ─── FEATURE 10: Network Quality Monitor ─────────────────────────────────────
export const networkQualityMetrics = pgTable("network_quality_metrics", {
  id: serial("id").primaryKey(),
  trunkId: integer("trunk_id"),
  extensionId: integer("extension_id").references(() => extensions.id),
  callId: varchar("call_id", { length: 50 }),
  mosScore: integer("mos_score").default(0), // Mean Opinion Score 10-50 (x10 for precision)
  jitter: integer("jitter").default(0), // ms
  packetLoss: integer("packet_loss").default(0), // percentage x100
  latency: integer("latency").default(0), // ms
  codecUsed: text("codec_used"),
  qualityRating: text("quality_rating").default("good"), // excellent, good, fair, poor, bad
  alertGenerated: boolean("alert_generated").default(false),
  measuredAt: timestamp("measured_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertNetworkQualityMetricSchema = createInsertSchema(networkQualityMetrics).omit({ id: true, measuredAt: true });
export type InsertNetworkQualityMetric = z.infer<typeof insertNetworkQualityMetricSchema>;
export type NetworkQualityMetric = typeof networkQualityMetrics.$inferSelect;

// ─── FEATURE 11: Omnichannel Inbox ───────────────────────────────────────────
export const omnichannelThreads = pgTable("omnichannel_threads", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id"),
  contactNumber: text("contact_number").notNull(),
  contactName: text("contact_name"),
  channels: jsonb("channels").default([]), // array of channel types used
  status: text("status").notNull().default("open"), // open, resolved, pending, archived
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  assignedTo: integer("assigned_to").references(() => extensions.id),
  lastMessageAt: timestamp("last_message_at").default(sql`CURRENT_TIMESTAMP`),
  lastMessagePreview: text("last_message_preview"),
  lastChannel: text("last_channel"), // call, sms, fax, voicemail, email
  unreadCount: integer("unread_count").default(0),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertOmnichannelThreadSchema = createInsertSchema(omnichannelThreads).omit({ id: true, createdAt: true });
export type InsertOmnichannelThread = z.infer<typeof insertOmnichannelThreadSchema>;
export type OmnichannelThread = typeof omnichannelThreads.$inferSelect;

// ─── FEATURE 12: Agent Gamification ──────────────────────────────────────────
export const agentAchievements = pgTable("agent_achievements", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").notNull().references(() => extensions.id),
  totalPoints: integer("total_points").default(0),
  level: integer("level").default(1),
  levelName: text("level_name").default("Rookie"),
  callsHandled: integer("calls_handled").default(0),
  callsAnsweredOnTime: integer("calls_answered_on_time").default(0),
  averageHandleTime: integer("average_handle_time").default(0),
  customerSatisfaction: integer("customer_satisfaction").default(0),
  streak: integer("streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  badges: jsonb("badges").default([]),
  weeklyRank: integer("weekly_rank"),
  monthlyRank: integer("monthly_rank"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertAgentAchievementSchema = createInsertSchema(agentAchievements).omit({ id: true, updatedAt: true });
export type InsertAgentAchievement = z.infer<typeof insertAgentAchievementSchema>;
export type AgentAchievement = typeof agentAchievements.$inferSelect;

// ─── FEATURE 13: Custom Reports ───────────────────────────────────────────────
export const customReports = pgTable("custom_reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("table"), // table, bar, line, pie, kpi
  dataSources: jsonb("data_sources").notNull().default([]),
  columns: jsonb("columns").default([]),
  filters: jsonb("filters").default([]),
  groupBy: text("group_by"),
  sortBy: text("sort_by"),
  sortDirection: text("sort_direction").default("desc"),
  dateRange: text("date_range").default("last_7_days"),
  isScheduled: boolean("is_scheduled").default(false),
  scheduleFrequency: text("schedule_frequency"), // daily, weekly, monthly
  scheduleEmail: text("schedule_email"),
  isPublic: boolean("is_public").default(false),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  lastRunAt: timestamp("last_run_at"),
});
export const insertCustomReportSchema = createInsertSchema(customReports).omit({ id: true, createdAt: true });
export type InsertCustomReport = z.infer<typeof insertCustomReportSchema>;
export type CustomReport = typeof customReports.$inferSelect;

// ─── FEATURE 14: IVR Node Analytics ──────────────────────────────────────────
export const ivrNodeStats = pgTable("ivr_node_stats", {
  id: serial("id").primaryKey(),
  callFlowId: integer("call_flow_id"),
  nodeId: text("node_id").notNull(),
  nodeLabel: text("node_label"),
  nodeType: text("node_type").default("menu"), // menu, transfer, voicemail, hangup
  totalEntries: integer("total_entries").default(0),
  totalExits: integer("total_exits").default(0),
  totalAbandoned: integer("total_abandoned").default(0),
  avgTimeSpent: integer("avg_time_spent").default(0), // seconds
  optionSelections: jsonb("option_selections").default({}), // {key: count}
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertIvrNodeStatSchema = createInsertSchema(ivrNodeStats).omit({ id: true, createdAt: true });
export type InsertIvrNodeStat = z.infer<typeof insertIvrNodeStatSchema>;
export type IvrNodeStat = typeof ivrNodeStats.$inferSelect;

// ─── FEATURE 15: API Key Manager ─────────────────────────────────────────────
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(),
  scopes: jsonb("scopes").notNull().default([]),
  rateLimit: integer("rate_limit").default(1000), // requests per hour
  allowedIps: jsonb("allowed_ips").default([]),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),
  createdBy: text("created_by"),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, usageCount: true });
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// ─── FEATURE 16: SIP Security Monitor ────────────────────────────────────────
export const sipSecurityEvents = pgTable("sip_security_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // registration_attack, brute_force, scanning, spoofing, unauthorized_call
  severity: text("severity").notNull().default("medium"),
  sourceIp: text("source_ip").notNull(),
  geoCountry: text("geo_country"),
  geoCity: text("geo_city"),
  userAgent: text("user_agent"),
  targetExtension: text("target_extension"),
  attemptCount: integer("attempt_count").default(1),
  isBlocked: boolean("is_blocked").default(false),
  details: jsonb("details").default({}),
  detectedAt: timestamp("detected_at").default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: timestamp("resolved_at"),
});
export const insertSipSecurityEventSchema = createInsertSchema(sipSecurityEvents).omit({ id: true, detectedAt: true });
export type InsertSipSecurityEvent = z.infer<typeof insertSipSecurityEventSchema>;
export type SipSecurityEvent = typeof sipSecurityEvents.$inferSelect;

export const ipBlocklist = pgTable("ip_blocklist", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  cidrRange: text("cidr_range"),
  reason: text("reason").notNull(),
  source: text("source").notNull().default("manual"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertIpBlocklistSchema = createInsertSchema(ipBlocklist).omit({ id: true, createdAt: true });
export type InsertIpBlocklist = z.infer<typeof insertIpBlocklistSchema>;
export type IpBlocklist = typeof ipBlocklist.$inferSelect;

// ─── FEATURE 17: Business Hours Manager ──────────────────────────────────────
export const businessHourProfiles = pgTable("business_hour_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  timezone: text("timezone").notNull().default("America/New_York"),
  isDefault: boolean("is_default").default(false),
  schedule: jsonb("schedule").notNull().default({}), // {monday: {open: "09:00", close: "17:00", enabled: true}, ...}
  afterHoursAction: text("after_hours_action").default("voicemail"), // voicemail, forward, ivr, reject
  afterHoursTarget: text("after_hours_target"),
  holidayProfileId: integer("holiday_profile_id"),
  appliesTo: jsonb("applies_to").default({}), // {extensions: [], dids: [], queues: []}
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertBusinessHourProfileSchema = createInsertSchema(businessHourProfiles).omit({ id: true, createdAt: true });
export type InsertBusinessHourProfile = z.infer<typeof insertBusinessHourProfileSchema>;
export type BusinessHourProfile = typeof businessHourProfiles.$inferSelect;

// ─── FEATURE 18: Call Journey Mapper ─────────────────────────────────────────
export const callJourneys = pgTable("call_journeys", {
  id: serial("id").primaryKey(),
  callId: varchar("call_id", { length: 50 }).notNull().unique(),
  callerNumber: text("caller_number").notNull(),
  calledNumber: text("called_number"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  totalDuration: integer("total_duration").default(0),
  steps: jsonb("steps").notNull().default([]), // [{stepType, target, timestamp, duration, result}]
  entryPoint: text("entry_point"), // did, extension, trunk
  exitReason: text("exit_reason"), // answered, voicemail, abandoned, transferred, busy
  finalExtension: integer("final_extension"),
  wasTransferred: boolean("was_transferred").default(false),
  transferCount: integer("transfer_count").default(0),
  holdCount: integer("hold_count").default(0),
  totalHoldTime: integer("total_hold_time").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertCallJourneySchema = createInsertSchema(callJourneys).omit({ id: true, createdAt: true });
export type InsertCallJourney = z.infer<typeof insertCallJourneySchema>;
export type CallJourney = typeof callJourneys.$inferSelect;

// ─── FEATURE 19: Auto-Provisioning ───────────────────────────────────────────
export const provisioningProfiles = pgTable("provisioning_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  deviceModel: text("device_model"),
  vendor: text("vendor"),
  firmwareVersion: text("firmware_version"),
  sipServer: text("sip_server"),
  sipPort: integer("sip_port").default(5060),
  stunServer: text("stun_server"),
  codec: text("codec").default("G.711u"),
  tlsEnabled: boolean("tls_enabled").default(false),
  srtp: boolean("srtp").default(false),
  customConfig: jsonb("custom_config").default({}),
  dhcpOption66: text("dhcp_option66"),
  tftp: boolean("tftp").default(false),
  http: boolean("http").default(true),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertProvisioningProfileSchema = createInsertSchema(provisioningProfiles).omit({ id: true, createdAt: true });
export type InsertProvisioningProfile = z.infer<typeof insertProvisioningProfileSchema>;
export type ProvisioningProfile = typeof provisioningProfiles.$inferSelect;

// ─── FEATURE 20: Disaster Recovery ───────────────────────────────────────────
export const failoverRules = pgTable("failover_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  primaryTrunkId: integer("primary_trunk_id"),
  backupTrunkIds: jsonb("backup_trunk_ids").notNull().default([]),
  triggerCondition: text("trigger_condition").notNull().default("unreachable"), // unreachable, high_loss, latency
  triggerThreshold: integer("trigger_threshold").default(3), // failures or ms
  checkInterval: integer("check_interval").default(30), // seconds
  recoveryTime: integer("recovery_time").default(300), // seconds before switching back
  notifyOnFailover: boolean("notify_on_failover").default(true),
  notifyEmail: text("notify_email"),
  notifySms: text("notify_sms"),
  currentStatus: text("current_status").default("normal"), // normal, failover, recovering
  lastFailoverAt: timestamp("last_failover_at"),
  lastCheckAt: timestamp("last_check_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertFailoverRuleSchema = createInsertSchema(failoverRules).omit({ id: true, createdAt: true });
export type InsertFailoverRule = z.infer<typeof insertFailoverRuleSchema>;
export type FailoverRule = typeof failoverRules.$inferSelect;

// ─── FEATURE 21: Conversation Intelligence ────────────────────────────────────
export const coachingAlerts = pgTable("coaching_alerts", {
  id: serial("id").primaryKey(),
  extensionId: integer("extension_id").notNull().references(() => extensions.id),
  callId: varchar("call_id", { length: 50 }),
  type: text("type").notNull(), // keyword_detected, silence_too_long, talk_too_fast, negative_sentiment, competitor_mention
  severity: text("severity").notNull().default("info"), // info, warning, critical
  triggerText: text("trigger_text"),
  suggestion: text("suggestion").notNull(),
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  detectedAt: timestamp("detected_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertCoachingAlertSchema = createInsertSchema(coachingAlerts).omit({ id: true, detectedAt: true });
export type InsertCoachingAlert = z.infer<typeof insertCoachingAlertSchema>;
export type CoachingAlert = typeof coachingAlerts.$inferSelect;

export const coachingTriggers = pgTable("coaching_triggers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // keyword, sentiment, silence, pace, competitor
  triggerValue: text("trigger_value").notNull(),
  response: text("response").notNull(),
  severity: text("severity").notNull().default("info"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertCoachingTriggerSchema = createInsertSchema(coachingTriggers).omit({ id: true, createdAt: true });
export type InsertCoachingTrigger = z.infer<typeof insertCoachingTriggerSchema>;
export type CoachingTrigger = typeof coachingTriggers.$inferSelect;

// ─── FEATURE 22: Cost Analytics ───────────────────────────────────────────────
export const callCostRecords = pgTable("call_cost_records", {
  id: serial("id").primaryKey(),
  callId: varchar("call_id", { length: 50 }).notNull(),
  trunkId: integer("trunk_id"),
  extensionId: integer("extension_id").references(() => extensions.id),
  didId: integer("did_id"),
  direction: text("direction").notNull().default("outbound"),
  destination: text("destination"),
  destinationCountry: text("destination_country"),
  destinationType: text("destination_type").default("local"), // local, longdistance, international, mobile, tollfree
  duration: integer("duration").default(0), // seconds
  ratePerMinute: integer("rate_per_minute").default(0), // in millicents
  totalCost: integer("total_cost").default(0), // in cents
  currency: text("currency").default("USD"),
  billedAt: timestamp("billed_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertCallCostRecordSchema = createInsertSchema(callCostRecords).omit({ id: true, billedAt: true });
export type InsertCallCostRecord = z.infer<typeof insertCallCostRecordSchema>;
export type CallCostRecord = typeof callCostRecords.$inferSelect;

export const costBudgets = pgTable("cost_budgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  period: text("period").notNull().default("monthly"), // daily, weekly, monthly
  budgetAmount: integer("budget_amount").notNull().default(0), // in cents
  currentSpend: integer("current_spend").default(0),
  alertThreshold: integer("alert_threshold").default(80), // percentage
  alertEmail: text("alert_email"),
  applyToExtensionId: integer("apply_to_extension_id"),
  applyToTrunkId: integer("apply_to_trunk_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertCostBudgetSchema = createInsertSchema(costBudgets).omit({ id: true, createdAt: true });
export type InsertCostBudget = z.infer<typeof insertCostBudgetSchema>;
export type CostBudget = typeof costBudgets.$inferSelect;

// ─── FEATURE 23: Multi-Tenant Manager ────────────────────────────────────────
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  plan: text("plan").notNull().default("basic"), // basic, professional, enterprise
  status: text("status").notNull().default("active"), // active, suspended, trial, cancelled
  maxExtensions: integer("max_extensions").default(25),
  maxConcurrentCalls: integer("max_concurrent_calls").default(10),
  maxStorageGb: integer("max_storage_gb").default(10),
  billingEmail: text("billing_email"),
  adminEmail: text("admin_email"),
  phone: text("phone"),
  address: text("address"),
  logoUrl: text("logo_url"),
  features: jsonb("features").default([]),
  settings: jsonb("settings").default({}),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// ─── FEATURE 24: Green Calling Initiative ────────────────────────────────────
export const carbonFootprintRecords = pgTable("carbon_footprint_records", {
  id: serial("id").primaryKey(),
  period: text("period").notNull(), // YYYY-MM
  totalMinutes: integer("total_minutes").default(0),
  co2GramsEstimate: integer("co2_grams_estimate").default(0),
  energyKwh: integer("energy_kwh").default(0), // millionths of kWh
  renewablePercentage: integer("renewable_percentage").default(0),
  offsetPurchased: integer("offset_purchased").default(0), // grams CO2e
  netCo2: integer("net_co2").default(0),
  treesEquivalent: integer("trees_equivalent").default(0),
  greenCallsCount: integer("green_calls_count").default(0),
  totalCallsCount: integer("total_calls_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertCarbonFootprintRecordSchema = createInsertSchema(carbonFootprintRecords).omit({ id: true, createdAt: true });
export type InsertCarbonFootprintRecord = z.infer<typeof insertCarbonFootprintRecordSchema>;
export type CarbonFootprintRecord = typeof carbonFootprintRecords.$inferSelect;

export const greenGoals = pgTable("green_goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  targetCo2ReductionPercent: integer("target_co2_reduction_percent").default(20),
  targetRenewablePercent: integer("target_renewable_percent").default(100),
  targetYear: integer("target_year").default(2025),
  currentProgress: integer("current_progress").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertGreenGoalSchema = createInsertSchema(greenGoals).omit({ id: true, createdAt: true });
export type InsertGreenGoal = z.infer<typeof insertGreenGoalSchema>;
export type GreenGoal = typeof greenGoals.$inferSelect;

// ─── FEATURE 25: Agent Coaching Live ──────────────────────────────────────────
export const liveCoachingSessions = pgTable("live_coaching_sessions", {
  id: serial("id").primaryKey(),
  agentExtensionId: integer("agent_extension_id").notNull().references(() => extensions.id),
  supervisorExtensionId: integer("supervisor_extension_id").references(() => extensions.id),
  callId: varchar("call_id", { length: 50 }),
  mode: text("mode").notNull().default("listen"), // listen, whisper, barge
  startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`),
  endedAt: timestamp("ended_at"),
  duration: integer("duration").default(0),
  whisperMessages: jsonb("whisper_messages").default([]),
  notes: text("notes"),
  rating: integer("rating"),
  feedback: text("feedback"),
});
export const insertLiveCoachingSessionSchema = createInsertSchema(liveCoachingSessions).omit({ id: true, startedAt: true });
export type InsertLiveCoachingSession = z.infer<typeof insertLiveCoachingSessionSchema>;
export type LiveCoachingSession = typeof liveCoachingSessions.$inferSelect;
