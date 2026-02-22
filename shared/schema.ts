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
