import {
  type User, type InsertUser,
  type Extension, type InsertExtension,
  type Did, type InsertDid,
  type CallFlow, type InsertCallFlow,
  type Device, type InsertDevice,
  type CallLog, type InsertCallLog,
  type SmsMessage, type InsertSmsMessage,
  type FaxMessage, type InsertFaxMessage,
  type Integration, type InsertIntegration,
  type AiSession, type InsertAiSession,
  type AiMessage, type InsertAiMessage,
  type RingGroup, type InsertRingGroup,
  type CallQueue, type InsertCallQueue,
  type SystemSetting, type InsertSystemSetting,
  type Contact, type InsertContact,
  type Voicemail, type InsertVoicemail,
  type CallTranscription, type InsertCallTranscription,
  type RoutingRule, type InsertRoutingRule,
  type Webhook, type InsertWebhook,
  type AgentStatus, type InsertAgentStatus,
  type QueueStat, type InsertQueueStat,
  type ParkingSlot, type InsertParkingSlot,
  type SipProvider, type InsertSipProvider,
  type SipTrunk, type InsertSipTrunk,
  type DeviceTemplate, type InsertDeviceTemplate,
  type IntegrationConnection, type InsertIntegrationConnection,
  type HolidaySchedule, type InsertHolidaySchedule,
  type CallDisposition, type InsertCallDisposition,
  type SpeedDial, type InsertSpeedDial,
  type AiAgent, type InsertAiAgent,
  type AiAgentCall, type InsertAiAgentCall,
  users, extensions, dids, callFlows, devices, callLogs,
  smsMessages, faxMessages, integrations, aiSessions, aiMessages,
  ringGroups, callQueues, systemSettings, contacts, voicemails,
  callTranscriptions, routingRules, webhooks, agentStatus, queueStats, parkingSlots,
  sipProviders, sipTrunks, deviceTemplates, integrationConnections,
  holidaySchedules, callDispositions, speedDials, aiAgents, aiAgentCalls,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getExtensions(): Promise<Extension[]>;
  getExtension(id: number): Promise<Extension | undefined>;
  createExtension(extension: InsertExtension): Promise<Extension>;
  updateExtension(id: number, extension: Partial<InsertExtension>): Promise<Extension | undefined>;
  deleteExtension(id: number): Promise<boolean>;

  getDids(): Promise<Did[]>;
  getDid(id: number): Promise<Did | undefined>;
  createDid(did: InsertDid): Promise<Did>;
  updateDid(id: number, did: Partial<InsertDid>): Promise<Did | undefined>;
  deleteDid(id: number): Promise<boolean>;

  getCallFlows(): Promise<CallFlow[]>;
  getCallFlow(id: number): Promise<CallFlow | undefined>;
  createCallFlow(callFlow: InsertCallFlow): Promise<CallFlow>;
  updateCallFlow(id: number, callFlow: Partial<InsertCallFlow>): Promise<CallFlow | undefined>;
  deleteCallFlow(id: number): Promise<boolean>;

  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;

  getCallLogs(): Promise<CallLog[]>;
  createCallLog(callLog: InsertCallLog): Promise<CallLog>;

  getSmsMessages(): Promise<SmsMessage[]>;
  createSmsMessage(sms: InsertSmsMessage): Promise<SmsMessage>;

  getFaxMessages(): Promise<FaxMessage[]>;
  createFaxMessage(fax: InsertFaxMessage): Promise<FaxMessage>;

  getIntegrations(): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  getIntegrationBySlug(slug: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: number): Promise<boolean>;

  getIntegrationConnection(integrationId: number): Promise<IntegrationConnection | undefined>;
  getIntegrationConnectionByProvider(provider: string): Promise<IntegrationConnection | undefined>;
  createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection>;
  updateIntegrationConnection(id: number, connection: Partial<InsertIntegrationConnection>): Promise<IntegrationConnection | undefined>;
  deleteIntegrationConnection(id: number): Promise<boolean>;

  getAiSessions(): Promise<AiSession[]>;
  getAiSession(id: number): Promise<AiSession | undefined>;
  createAiSession(session: InsertAiSession): Promise<AiSession>;
  getAiMessages(sessionId: number): Promise<AiMessage[]>;
  createAiMessage(message: InsertAiMessage): Promise<AiMessage>;

  getRingGroups(): Promise<RingGroup[]>;
  getRingGroup(id: number): Promise<RingGroup | undefined>;
  createRingGroup(ringGroup: InsertRingGroup): Promise<RingGroup>;
  updateRingGroup(id: number, ringGroup: Partial<InsertRingGroup>): Promise<RingGroup | undefined>;
  deleteRingGroup(id: number): Promise<boolean>;

  getCallQueues(): Promise<CallQueue[]>;
  getCallQueue(id: number): Promise<CallQueue | undefined>;
  createCallQueue(callQueue: InsertCallQueue): Promise<CallQueue>;
  updateCallQueue(id: number, callQueue: Partial<InsertCallQueue>): Promise<CallQueue | undefined>;
  deleteCallQueue(id: number): Promise<boolean>;

  getSystemSettings(): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  updateSystemSetting(key: string, value: any): Promise<SystemSetting>;

  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  getVoicemails(extensionId?: number): Promise<Voicemail[]>;
  getVoicemail(id: number): Promise<Voicemail | undefined>;
  createVoicemail(voicemail: InsertVoicemail): Promise<Voicemail>;
  markVoicemailRead(id: number): Promise<Voicemail | undefined>;
  deleteVoicemail(id: number): Promise<boolean>;

  getCallTranscriptions(): Promise<CallTranscription[]>;
  getCallTranscription(callLogId: number): Promise<CallTranscription | undefined>;
  createCallTranscription(transcription: InsertCallTranscription): Promise<CallTranscription>;

  getRoutingRules(): Promise<RoutingRule[]>;
  getRoutingRule(id: number): Promise<RoutingRule | undefined>;
  createRoutingRule(rule: InsertRoutingRule): Promise<RoutingRule>;
  updateRoutingRule(id: number, rule: Partial<InsertRoutingRule>): Promise<RoutingRule | undefined>;
  deleteRoutingRule(id: number): Promise<boolean>;

  getWebhooks(): Promise<Webhook[]>;
  getWebhook(id: number): Promise<Webhook | undefined>;
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: number, webhook: Partial<InsertWebhook>): Promise<Webhook | undefined>;
  deleteWebhook(id: number): Promise<boolean>;

  getAgentStatuses(): Promise<AgentStatus[]>;
  getAgentStatus(extensionId: number): Promise<AgentStatus | undefined>;
  updateAgentStatus(extensionId: number, status: Partial<InsertAgentStatus>): Promise<AgentStatus>;

  getQueueStats(): Promise<QueueStat[]>;
  getQueueStat(queueId: number): Promise<QueueStat | undefined>;
  updateQueueStat(queueId: number, stat: Partial<InsertQueueStat>): Promise<QueueStat>;

  getParkingSlots(): Promise<ParkingSlot[]>;
  parkCall(slotNumber: number, callData: Partial<InsertParkingSlot>): Promise<ParkingSlot>;
  retrieveCall(slotNumber: number): Promise<ParkingSlot | undefined>;

  getSipProviders(): Promise<SipProvider[]>;
  getSipProvider(id: number): Promise<SipProvider | undefined>;
  getSipProviderBySlug(slug: string): Promise<SipProvider | undefined>;
  createSipProvider(provider: InsertSipProvider): Promise<SipProvider>;
  updateSipProvider(id: number, provider: Partial<InsertSipProvider>): Promise<SipProvider | undefined>;
  deleteSipProvider(id: number): Promise<boolean>;

  getSipTrunks(): Promise<SipTrunk[]>;
  getSipTrunk(id: number): Promise<SipTrunk | undefined>;
  createSipTrunk(trunk: InsertSipTrunk): Promise<SipTrunk>;
  updateSipTrunk(id: number, trunk: Partial<InsertSipTrunk>): Promise<SipTrunk | undefined>;
  deleteSipTrunk(id: number): Promise<boolean>;

  getDeviceTemplates(): Promise<DeviceTemplate[]>;
  getDeviceTemplate(id: number): Promise<DeviceTemplate | undefined>;
  createDeviceTemplate(template: InsertDeviceTemplate): Promise<DeviceTemplate>;
  updateDeviceTemplate(id: number, template: Partial<InsertDeviceTemplate>): Promise<DeviceTemplate | undefined>;
  deleteDeviceTemplate(id: number): Promise<boolean>;

  getHolidaySchedules(): Promise<HolidaySchedule[]>;
  getHolidaySchedule(id: number): Promise<HolidaySchedule | undefined>;
  createHolidaySchedule(schedule: InsertHolidaySchedule): Promise<HolidaySchedule>;
  updateHolidaySchedule(id: number, schedule: Partial<InsertHolidaySchedule>): Promise<HolidaySchedule | undefined>;
  deleteHolidaySchedule(id: number): Promise<boolean>;

  getCallDispositions(): Promise<CallDisposition[]>;
  getCallDisposition(id: number): Promise<CallDisposition | undefined>;
  getCallDispositionsByCallLog(callLogId: number): Promise<CallDisposition[]>;
  createCallDisposition(disposition: InsertCallDisposition): Promise<CallDisposition>;
  updateCallDisposition(id: number, disposition: Partial<InsertCallDisposition>): Promise<CallDisposition | undefined>;
  deleteCallDisposition(id: number): Promise<boolean>;

  getSpeedDials(userId?: string): Promise<SpeedDial[]>;
  getSpeedDial(id: number): Promise<SpeedDial | undefined>;
  createSpeedDial(speedDial: InsertSpeedDial): Promise<SpeedDial>;
  updateSpeedDial(id: number, speedDial: Partial<InsertSpeedDial>): Promise<SpeedDial | undefined>;
  deleteSpeedDial(id: number): Promise<boolean>;

  createVoicemail(voicemail: InsertVoicemail): Promise<Voicemail>;

  getAiAgents(): Promise<AiAgent[]>;
  getAiAgent(id: number): Promise<AiAgent | undefined>;
  createAiAgent(agent: InsertAiAgent): Promise<AiAgent>;
  updateAiAgent(id: number, agent: Partial<InsertAiAgent>): Promise<AiAgent | undefined>;
  deleteAiAgent(id: number): Promise<boolean>;

  getAiAgentCalls(): Promise<AiAgentCall[]>;
  getAiAgentCallsByAgent(agentId: number): Promise<AiAgentCall[]>;
  createAiAgentCall(call: InsertAiAgentCall): Promise<AiAgentCall>;

  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getExtensions(): Promise<Extension[]> {
    return db.select().from(extensions);
  }

  async getExtension(id: number): Promise<Extension | undefined> {
    const [ext] = await db.select().from(extensions).where(eq(extensions.id, id));
    return ext || undefined;
  }

  async createExtension(extension: InsertExtension): Promise<Extension> {
    const [ext] = await db.insert(extensions).values(extension).returning();
    return ext;
  }

  async updateExtension(id: number, extension: Partial<InsertExtension>): Promise<Extension | undefined> {
    const [ext] = await db.update(extensions).set(extension).where(eq(extensions.id, id)).returning();
    return ext || undefined;
  }

  async deleteExtension(id: number): Promise<boolean> {
    const result = await db.delete(extensions).where(eq(extensions.id, id)).returning();
    return result.length > 0;
  }

  async getDids(): Promise<Did[]> {
    return db.select().from(dids);
  }

  async getDid(id: number): Promise<Did | undefined> {
    const [did] = await db.select().from(dids).where(eq(dids.id, id));
    return did || undefined;
  }

  async createDid(did: InsertDid): Promise<Did> {
    const [newDid] = await db.insert(dids).values(did).returning();
    return newDid;
  }

  async updateDid(id: number, did: Partial<InsertDid>): Promise<Did | undefined> {
    const [updated] = await db.update(dids).set(did).where(eq(dids.id, id)).returning();
    return updated || undefined;
  }

  async deleteDid(id: number): Promise<boolean> {
    const result = await db.delete(dids).where(eq(dids.id, id)).returning();
    return result.length > 0;
  }

  async getCallFlows(): Promise<CallFlow[]> {
    return db.select().from(callFlows);
  }

  async getCallFlow(id: number): Promise<CallFlow | undefined> {
    const [flow] = await db.select().from(callFlows).where(eq(callFlows.id, id));
    return flow || undefined;
  }

  async createCallFlow(callFlow: InsertCallFlow): Promise<CallFlow> {
    const [flow] = await db.insert(callFlows).values(callFlow).returning();
    return flow;
  }

  async updateCallFlow(id: number, callFlow: Partial<InsertCallFlow>): Promise<CallFlow | undefined> {
    const [flow] = await db.update(callFlows).set(callFlow).where(eq(callFlows.id, id)).returning();
    return flow || undefined;
  }

  async deleteCallFlow(id: number): Promise<boolean> {
    const result = await db.delete(callFlows).where(eq(callFlows.id, id)).returning();
    return result.length > 0;
  }

  async getDevices(): Promise<Device[]> {
    return db.select().from(devices);
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device || undefined;
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const [newDevice] = await db.insert(devices).values(device).returning();
    return newDevice;
  }

  async updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device | undefined> {
    const [updated] = await db.update(devices).set(device).where(eq(devices.id, id)).returning();
    return updated || undefined;
  }

  async deleteDevice(id: number): Promise<boolean> {
    const result = await db.delete(devices).where(eq(devices.id, id)).returning();
    return result.length > 0;
  }

  async getCallLogs(): Promise<CallLog[]> {
    return db.select().from(callLogs);
  }

  async createCallLog(callLog: InsertCallLog): Promise<CallLog> {
    const [log] = await db.insert(callLogs).values(callLog).returning();
    return log;
  }

  async getSmsMessages(): Promise<SmsMessage[]> {
    return db.select().from(smsMessages);
  }

  async createSmsMessage(sms: InsertSmsMessage): Promise<SmsMessage> {
    const [msg] = await db.insert(smsMessages).values(sms).returning();
    return msg;
  }

  async getFaxMessages(): Promise<FaxMessage[]> {
    return db.select().from(faxMessages);
  }

  async createFaxMessage(fax: InsertFaxMessage): Promise<FaxMessage> {
    const [msg] = await db.insert(faxMessages).values(fax).returning();
    return msg;
  }

  async getIntegrations(): Promise<Integration[]> {
    return db.select().from(integrations);
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration || undefined;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db.insert(integrations).values(integration).returning();
    return newIntegration;
  }

  async getIntegrationBySlug(slug: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.slug, slug));
    return integration || undefined;
  }

  async updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const [updated] = await db.update(integrations).set(integration).where(eq(integrations.id, id)).returning();
    return updated || undefined;
  }

  async deleteIntegration(id: number): Promise<boolean> {
    const result = await db.delete(integrations).where(eq(integrations.id, id)).returning();
    return result.length > 0;
  }

  async getIntegrationConnection(integrationId: number): Promise<IntegrationConnection | undefined> {
    const [conn] = await db.select().from(integrationConnections).where(eq(integrationConnections.integrationId, integrationId));
    return conn || undefined;
  }

  async getIntegrationConnectionByProvider(provider: string): Promise<IntegrationConnection | undefined> {
    const [conn] = await db.select().from(integrationConnections).where(eq(integrationConnections.provider, provider));
    return conn || undefined;
  }

  async createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection> {
    const [newConn] = await db.insert(integrationConnections).values(connection).returning();
    return newConn;
  }

  async updateIntegrationConnection(id: number, connection: Partial<InsertIntegrationConnection>): Promise<IntegrationConnection | undefined> {
    const [updated] = await db.update(integrationConnections).set(connection).where(eq(integrationConnections.id, id)).returning();
    return updated || undefined;
  }

  async deleteIntegrationConnection(id: number): Promise<boolean> {
    const result = await db.delete(integrationConnections).where(eq(integrationConnections.id, id)).returning();
    return result.length > 0;
  }

  async getAiSessions(): Promise<AiSession[]> {
    return db.select().from(aiSessions);
  }

  async getAiSession(id: number): Promise<AiSession | undefined> {
    const [session] = await db.select().from(aiSessions).where(eq(aiSessions.id, id));
    return session || undefined;
  }

  async createAiSession(session: InsertAiSession): Promise<AiSession> {
    const [newSession] = await db.insert(aiSessions).values(session).returning();
    return newSession;
  }

  async getAiMessages(sessionId: number): Promise<AiMessage[]> {
    return db.select().from(aiMessages).where(eq(aiMessages.sessionId, sessionId));
  }

  async createAiMessage(message: InsertAiMessage): Promise<AiMessage> {
    const [msg] = await db.insert(aiMessages).values(message).returning();
    return msg;
  }

  async getRingGroups(): Promise<RingGroup[]> {
    return db.select().from(ringGroups);
  }

  async getRingGroup(id: number): Promise<RingGroup | undefined> {
    const [group] = await db.select().from(ringGroups).where(eq(ringGroups.id, id));
    return group || undefined;
  }

  async createRingGroup(ringGroup: InsertRingGroup): Promise<RingGroup> {
    const [group] = await db.insert(ringGroups).values(ringGroup).returning();
    return group;
  }

  async updateRingGroup(id: number, ringGroup: Partial<InsertRingGroup>): Promise<RingGroup | undefined> {
    const [group] = await db.update(ringGroups).set(ringGroup).where(eq(ringGroups.id, id)).returning();
    return group || undefined;
  }

  async deleteRingGroup(id: number): Promise<boolean> {
    const result = await db.delete(ringGroups).where(eq(ringGroups.id, id)).returning();
    return result.length > 0;
  }

  async getCallQueues(): Promise<CallQueue[]> {
    return db.select().from(callQueues);
  }

  async getCallQueue(id: number): Promise<CallQueue | undefined> {
    const [queue] = await db.select().from(callQueues).where(eq(callQueues.id, id));
    return queue || undefined;
  }

  async createCallQueue(callQueue: InsertCallQueue): Promise<CallQueue> {
    const [queue] = await db.insert(callQueues).values(callQueue).returning();
    return queue;
  }

  async updateCallQueue(id: number, callQueue: Partial<InsertCallQueue>): Promise<CallQueue | undefined> {
    const [queue] = await db.update(callQueues).set(callQueue).where(eq(callQueues.id, id)).returning();
    return queue || undefined;
  }

  async deleteCallQueue(id: number): Promise<boolean> {
    const result = await db.delete(callQueues).where(eq(callQueues.id, id)).returning();
    return result.length > 0;
  }

  async getSystemSettings(): Promise<SystemSetting[]> {
    return db.select().from(systemSettings);
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async updateSystemSetting(key: string, value: any): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(key);
    if (existing) {
      const [updated] = await db.update(systemSettings).set({ value }).where(eq(systemSettings.key, key)).returning();
      return updated;
    } else {
      const [newSetting] = await db.insert(systemSettings).values({ key, value, category: "general" }).returning();
      return newSetting;
    }
  }

  async getContacts(): Promise<Contact[]> {
    return db.select().from(contacts).orderBy(contacts.firstName);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts).set(contact).where(eq(contacts.id, id)).returning();
    return updated || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id)).returning();
    return result.length > 0;
  }

  async getVoicemails(extensionId?: number): Promise<Voicemail[]> {
    if (extensionId) {
      return db.select().from(voicemails).where(eq(voicemails.extensionId, extensionId)).orderBy(desc(voicemails.createdAt));
    }
    return db.select().from(voicemails).orderBy(desc(voicemails.createdAt));
  }

  async getVoicemail(id: number): Promise<Voicemail | undefined> {
    const [vm] = await db.select().from(voicemails).where(eq(voicemails.id, id));
    return vm || undefined;
  }

  async createVoicemail(voicemail: InsertVoicemail): Promise<Voicemail> {
    const [vm] = await db.insert(voicemails).values(voicemail).returning();
    return vm;
  }

  async markVoicemailRead(id: number): Promise<Voicemail | undefined> {
    const [vm] = await db.update(voicemails).set({ isRead: true }).where(eq(voicemails.id, id)).returning();
    return vm || undefined;
  }

  async deleteVoicemail(id: number): Promise<boolean> {
    const result = await db.delete(voicemails).where(eq(voicemails.id, id)).returning();
    return result.length > 0;
  }

  async getCallTranscriptions(): Promise<CallTranscription[]> {
    return db.select().from(callTranscriptions).orderBy(desc(callTranscriptions.createdAt));
  }

  async getCallTranscription(callLogId: number): Promise<CallTranscription | undefined> {
    const [trans] = await db.select().from(callTranscriptions).where(eq(callTranscriptions.callLogId, callLogId));
    return trans || undefined;
  }

  async createCallTranscription(transcription: InsertCallTranscription): Promise<CallTranscription> {
    const [trans] = await db.insert(callTranscriptions).values(transcription).returning();
    return trans;
  }

  async getRoutingRules(): Promise<RoutingRule[]> {
    return db.select().from(routingRules).orderBy(routingRules.priority);
  }

  async getRoutingRule(id: number): Promise<RoutingRule | undefined> {
    const [rule] = await db.select().from(routingRules).where(eq(routingRules.id, id));
    return rule || undefined;
  }

  async createRoutingRule(rule: InsertRoutingRule): Promise<RoutingRule> {
    const [newRule] = await db.insert(routingRules).values(rule).returning();
    return newRule;
  }

  async updateRoutingRule(id: number, rule: Partial<InsertRoutingRule>): Promise<RoutingRule | undefined> {
    const [updated] = await db.update(routingRules).set(rule).where(eq(routingRules.id, id)).returning();
    return updated || undefined;
  }

  async deleteRoutingRule(id: number): Promise<boolean> {
    const result = await db.delete(routingRules).where(eq(routingRules.id, id)).returning();
    return result.length > 0;
  }

  async getWebhooks(): Promise<Webhook[]> {
    return db.select().from(webhooks);
  }

  async getWebhook(id: number): Promise<Webhook | undefined> {
    const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id));
    return webhook || undefined;
  }

  async createWebhook(webhook: InsertWebhook): Promise<Webhook> {
    const [newWebhook] = await db.insert(webhooks).values(webhook).returning();
    return newWebhook;
  }

  async updateWebhook(id: number, webhook: Partial<InsertWebhook>): Promise<Webhook | undefined> {
    const [updated] = await db.update(webhooks).set(webhook).where(eq(webhooks.id, id)).returning();
    return updated || undefined;
  }

  async deleteWebhook(id: number): Promise<boolean> {
    const result = await db.delete(webhooks).where(eq(webhooks.id, id)).returning();
    return result.length > 0;
  }

  async getAgentStatuses(): Promise<AgentStatus[]> {
    return db.select().from(agentStatus);
  }

  async getAgentStatus(extensionId: number): Promise<AgentStatus | undefined> {
    const [status] = await db.select().from(agentStatus).where(eq(agentStatus.extensionId, extensionId));
    return status || undefined;
  }

  async updateAgentStatus(extensionId: number, status: Partial<InsertAgentStatus>): Promise<AgentStatus> {
    const existing = await this.getAgentStatus(extensionId);
    if (existing) {
      const [updated] = await db.update(agentStatus).set(status).where(eq(agentStatus.extensionId, extensionId)).returning();
      return updated;
    } else {
      const [newStatus] = await db.insert(agentStatus).values({ extensionId, ...status }).returning();
      return newStatus;
    }
  }

  async getQueueStats(): Promise<QueueStat[]> {
    return db.select().from(queueStats);
  }

  async getQueueStat(queueId: number): Promise<QueueStat | undefined> {
    const [stat] = await db.select().from(queueStats).where(eq(queueStats.queueId, queueId));
    return stat || undefined;
  }

  async updateQueueStat(queueId: number, stat: Partial<InsertQueueStat>): Promise<QueueStat> {
    const existing = await this.getQueueStat(queueId);
    if (existing) {
      const [updated] = await db.update(queueStats).set(stat).where(eq(queueStats.queueId, queueId)).returning();
      return updated;
    } else {
      const [newStat] = await db.insert(queueStats).values({ queueId, ...stat }).returning();
      return newStat;
    }
  }

  async getParkingSlots(): Promise<ParkingSlot[]> {
    return db.select().from(parkingSlots).orderBy(parkingSlots.slotNumber);
  }

  async parkCall(slotNumber: number, callData: Partial<InsertParkingSlot>): Promise<ParkingSlot> {
    const [slot] = await db.insert(parkingSlots)
      .values({ slotNumber, status: "occupied", ...callData })
      .onConflictDoUpdate({ target: parkingSlots.slotNumber, set: { status: "occupied", ...callData } })
      .returning();
    return slot;
  }

  async retrieveCall(slotNumber: number): Promise<ParkingSlot | undefined> {
    const [slot] = await db.update(parkingSlots)
      .set({ status: "available", callId: null, callerNumber: null, callerName: null, parkedBy: null, parkedAt: null, expiresAt: null })
      .where(eq(parkingSlots.slotNumber, slotNumber))
      .returning();
    return slot || undefined;
  }

  async getSipProviders(): Promise<SipProvider[]> {
    return db.select().from(sipProviders).orderBy(sipProviders.name);
  }

  async getSipProvider(id: number): Promise<SipProvider | undefined> {
    const [provider] = await db.select().from(sipProviders).where(eq(sipProviders.id, id));
    return provider || undefined;
  }

  async getSipProviderBySlug(slug: string): Promise<SipProvider | undefined> {
    const [provider] = await db.select().from(sipProviders).where(eq(sipProviders.slug, slug));
    return provider || undefined;
  }

  async createSipProvider(provider: InsertSipProvider): Promise<SipProvider> {
    const [newProvider] = await db.insert(sipProviders).values(provider).returning();
    return newProvider;
  }

  async updateSipProvider(id: number, provider: Partial<InsertSipProvider>): Promise<SipProvider | undefined> {
    const [updated] = await db.update(sipProviders).set(provider).where(eq(sipProviders.id, id)).returning();
    return updated || undefined;
  }

  async deleteSipProvider(id: number): Promise<boolean> {
    const result = await db.delete(sipProviders).where(eq(sipProviders.id, id)).returning();
    return result.length > 0;
  }

  async getSipTrunks(): Promise<SipTrunk[]> {
    return db.select().from(sipTrunks).orderBy(sipTrunks.name);
  }

  async getSipTrunk(id: number): Promise<SipTrunk | undefined> {
    const [trunk] = await db.select().from(sipTrunks).where(eq(sipTrunks.id, id));
    return trunk || undefined;
  }

  async createSipTrunk(trunk: InsertSipTrunk): Promise<SipTrunk> {
    const [newTrunk] = await db.insert(sipTrunks).values(trunk).returning();
    return newTrunk;
  }

  async updateSipTrunk(id: number, trunk: Partial<InsertSipTrunk>): Promise<SipTrunk | undefined> {
    const [updated] = await db.update(sipTrunks).set(trunk).where(eq(sipTrunks.id, id)).returning();
    return updated || undefined;
  }

  async deleteSipTrunk(id: number): Promise<boolean> {
    const result = await db.delete(sipTrunks).where(eq(sipTrunks.id, id)).returning();
    return result.length > 0;
  }

  async getDeviceTemplates(): Promise<DeviceTemplate[]> {
    return db.select().from(deviceTemplates).orderBy(deviceTemplates.manufacturer, deviceTemplates.model);
  }

  async getDeviceTemplate(id: number): Promise<DeviceTemplate | undefined> {
    const [template] = await db.select().from(deviceTemplates).where(eq(deviceTemplates.id, id));
    return template || undefined;
  }

  async createDeviceTemplate(template: InsertDeviceTemplate): Promise<DeviceTemplate> {
    const [newTemplate] = await db.insert(deviceTemplates).values(template).returning();
    return newTemplate;
  }

  async updateDeviceTemplate(id: number, template: Partial<InsertDeviceTemplate>): Promise<DeviceTemplate | undefined> {
    const [updated] = await db.update(deviceTemplates).set(template).where(eq(deviceTemplates.id, id)).returning();
    return updated || undefined;
  }

  async deleteDeviceTemplate(id: number): Promise<boolean> {
    const result = await db.delete(deviceTemplates).where(eq(deviceTemplates.id, id)).returning();
    return result.length > 0;
  }

  async getHolidaySchedules(): Promise<HolidaySchedule[]> {
    return db.select().from(holidaySchedules);
  }

  async getHolidaySchedule(id: number): Promise<HolidaySchedule | undefined> {
    const [schedule] = await db.select().from(holidaySchedules).where(eq(holidaySchedules.id, id));
    return schedule || undefined;
  }

  async createHolidaySchedule(schedule: InsertHolidaySchedule): Promise<HolidaySchedule> {
    const [newSchedule] = await db.insert(holidaySchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateHolidaySchedule(id: number, schedule: Partial<InsertHolidaySchedule>): Promise<HolidaySchedule | undefined> {
    const [updated] = await db.update(holidaySchedules).set(schedule).where(eq(holidaySchedules.id, id)).returning();
    return updated || undefined;
  }

  async deleteHolidaySchedule(id: number): Promise<boolean> {
    const result = await db.delete(holidaySchedules).where(eq(holidaySchedules.id, id)).returning();
    return result.length > 0;
  }

  async getCallDispositions(): Promise<CallDisposition[]> {
    return db.select().from(callDispositions).orderBy(desc(callDispositions.createdAt));
  }

  async getCallDisposition(id: number): Promise<CallDisposition | undefined> {
    const [disposition] = await db.select().from(callDispositions).where(eq(callDispositions.id, id));
    return disposition || undefined;
  }

  async getCallDispositionsByCallLog(callLogId: number): Promise<CallDisposition[]> {
    return db.select().from(callDispositions).where(eq(callDispositions.callLogId, callLogId));
  }

  async createCallDisposition(disposition: InsertCallDisposition): Promise<CallDisposition> {
    const [newDisposition] = await db.insert(callDispositions).values(disposition).returning();
    return newDisposition;
  }

  async updateCallDisposition(id: number, disposition: Partial<InsertCallDisposition>): Promise<CallDisposition | undefined> {
    const [updated] = await db.update(callDispositions).set(disposition).where(eq(callDispositions.id, id)).returning();
    return updated || undefined;
  }

  async deleteCallDisposition(id: number): Promise<boolean> {
    const result = await db.delete(callDispositions).where(eq(callDispositions.id, id)).returning();
    return result.length > 0;
  }

  async getSpeedDials(userId?: string): Promise<SpeedDial[]> {
    if (userId) {
      return db.select().from(speedDials).where(eq(speedDials.userId, userId)).orderBy(speedDials.position);
    }
    return db.select().from(speedDials).orderBy(speedDials.position);
  }

  async getSpeedDial(id: number): Promise<SpeedDial | undefined> {
    const [dial] = await db.select().from(speedDials).where(eq(speedDials.id, id));
    return dial || undefined;
  }

  async createSpeedDial(speedDial: InsertSpeedDial): Promise<SpeedDial> {
    const [newDial] = await db.insert(speedDials).values(speedDial).returning();
    return newDial;
  }

  async updateSpeedDial(id: number, speedDial: Partial<InsertSpeedDial>): Promise<SpeedDial | undefined> {
    const [updated] = await db.update(speedDials).set(speedDial).where(eq(speedDials.id, id)).returning();
    return updated || undefined;
  }

  async deleteSpeedDial(id: number): Promise<boolean> {
    const result = await db.delete(speedDials).where(eq(speedDials.id, id)).returning();
    return result.length > 0;
  }

  async getAiAgents(): Promise<AiAgent[]> {
    return db.select().from(aiAgents).orderBy(aiAgents.name);
  }

  async getAiAgent(id: number): Promise<AiAgent | undefined> {
    const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, id));
    return agent || undefined;
  }

  async createAiAgent(agent: InsertAiAgent): Promise<AiAgent> {
    const [newAgent] = await db.insert(aiAgents).values(agent).returning();
    return newAgent;
  }

  async updateAiAgent(id: number, agent: Partial<InsertAiAgent>): Promise<AiAgent | undefined> {
    const [updated] = await db.update(aiAgents).set(agent).where(eq(aiAgents.id, id)).returning();
    return updated || undefined;
  }

  async deleteAiAgent(id: number): Promise<boolean> {
    const result = await db.delete(aiAgents).where(eq(aiAgents.id, id)).returning();
    return result.length > 0;
  }

  async getAiAgentCalls(): Promise<AiAgentCall[]> {
    return db.select().from(aiAgentCalls).orderBy(desc(aiAgentCalls.createdAt));
  }

  async getAiAgentCallsByAgent(agentId: number): Promise<AiAgentCall[]> {
    return db.select().from(aiAgentCalls).where(eq(aiAgentCalls.agentId, agentId)).orderBy(desc(aiAgentCalls.createdAt));
  }

  async createAiAgentCall(call: InsertAiAgentCall): Promise<AiAgentCall> {
    const [newCall] = await db.insert(aiAgentCalls).values(call).returning();
    return newCall;
  }

  async seedInitialData(): Promise<void> {
    const existingExtensions = await this.getExtensions();
    if (existingExtensions.length === 0) {
      const extensionsData: InsertExtension[] = [
        { number: "101", name: "John Smith", type: "sip", status: "online", voicemailEnabled: true, callForwardingEnabled: false, ringTimeout: 30, callerIdName: "John Smith", callerIdNumber: "+15551234567", department: "Sales", location: "HQ" },
        { number: "102", name: "Sarah Johnson", type: "sip", status: "busy", voicemailEnabled: true, callForwardingEnabled: true, callForwardingNumber: "+15559876543", ringTimeout: 20, callerIdName: "Sarah Johnson", callerIdNumber: "+15551234568", department: "Support", location: "HQ" },
        { number: "103", name: "Mike Brown", type: "sip", status: "online", voicemailEnabled: true, callForwardingEnabled: false, ringTimeout: 30, callerIdName: "Mike Brown", callerIdNumber: "+15551234569", department: "Marketing", location: "Remote" },
        { number: "104", name: "Emily Davis", type: "webrtc", status: "away", voicemailEnabled: false, callForwardingEnabled: false, ringTimeout: 25, callerIdName: "Emily Davis", callerIdNumber: "+15551234570", department: "Sales", location: "HQ" },
        { number: "105", name: "Chris Wilson", type: "sip", status: "online", voicemailEnabled: true, callForwardingEnabled: false, ringTimeout: 30, callerIdName: "Chris Wilson", callerIdNumber: "+15551234571", department: "Support", location: "HQ" },
        { number: "106", name: "Reception", type: "sip", status: "online", voicemailEnabled: true, callForwardingEnabled: false, ringTimeout: 15, callerIdName: "Main Reception", callerIdNumber: "+15551234500", department: "Admin", location: "HQ" },
      ];
      for (const ext of extensionsData) {
        await this.createExtension(ext);
      }
    }

    const existingDids = await this.getDids();
    if (existingDids.length === 0) {
      const didsData: InsertDid[] = [
        { number: "+15551234567", country: "US", city: "New York", state: "NY", provider: "Twilio", status: "active", type: "local", monthlyRate: 100, assignedTo: "Main IVR", assignedType: "call_flow", smsEnabled: true, faxEnabled: false, e911Enabled: true },
        { number: "+15559876543", country: "US", city: "Los Angeles", state: "CA", provider: "Twilio", status: "active", type: "local", monthlyRate: 100, assignedTo: "Sales Queue", assignedType: "queue", smsEnabled: true, faxEnabled: false, e911Enabled: true },
        { number: "+18005551234", country: "US", provider: "Bandwidth", status: "active", type: "toll_free", monthlyRate: 300, assignedTo: "Support", assignedType: "extension", smsEnabled: false, faxEnabled: false, e911Enabled: false },
      ];
      for (const did of didsData) {
        await this.createDid(did);
      }
    }

    const existingRingGroups = await this.getRingGroups();
    if (existingRingGroups.length === 0) {
      const ringGroupsData: InsertRingGroup[] = [
        { name: "Sales Team", number: "200", strategy: "simultaneous", ringTimeout: 20, members: ["101", "102", "104"], enabled: true },
        { name: "Support Team", number: "201", strategy: "round_robin", ringTimeout: 25, members: ["103", "105"], enabled: true },
      ];
      for (const rg of ringGroupsData) {
        await this.createRingGroup(rg);
      }
    }

    const existingCallQueues = await this.getCallQueues();
    if (existingCallQueues.length === 0) {
      const callQueuesData: InsertCallQueue[] = [
        { name: "Sales Queue", number: "300", strategy: "round_robin", maxWaitTime: 300, maxCallers: 50, agents: ["101", "102", "104"], announcePosition: true, enabled: true },
        { name: "Support Queue", number: "301", strategy: "least_calls", maxWaitTime: 600, maxCallers: 100, agents: ["103", "105", "106"], announcePosition: true, enabled: true },
      ];
      for (const cq of callQueuesData) {
        await this.createCallQueue(cq);
      }
    }

    const existingContacts = await this.getContacts();
    if (existingContacts.length === 0) {
      const contactsData: InsertContact[] = [
        { firstName: "Robert", lastName: "Anderson", company: "Tech Corp", email: "robert@techcorp.com", phoneNumbers: [{ type: "work", number: "+15551112222" }, { type: "mobile", number: "+15552223333" }], isVip: true, doNotCall: false, notes: "Key account, priority support" },
        { firstName: "Jennifer", lastName: "Martinez", company: "Acme Inc", email: "jennifer@acme.com", phoneNumbers: [{ type: "work", number: "+15553334444" }], isVip: false, doNotCall: false },
        { firstName: "David", lastName: "Thompson", company: "Global Solutions", email: "david@globalsolutions.com", phoneNumbers: [{ type: "work", number: "+15554445555" }, { type: "mobile", number: "+15555556666" }], isVip: false, doNotCall: false, notes: "Software vendor contact" },
        { firstName: "Lisa", lastName: "Garcia", email: "lisa.garcia@email.com", phoneNumbers: [{ type: "home", number: "+15556667777" }], isVip: false, doNotCall: true, notes: "Requested no marketing calls" },
        { firstName: "Michael", lastName: "Chen", company: "Enterprise Systems", email: "mchen@enterprise.com", phoneNumbers: [{ type: "work", number: "+15557778888" }], isVip: true, doNotCall: false },
      ];
      for (const contact of contactsData) {
        await this.createContact(contact);
      }
    }

    const existingVoicemails = await this.getVoicemails();
    if (existingVoicemails.length === 0) {
      const voicemailsData: InsertVoicemail[] = [
        { extensionId: 1, callerNumber: "+15551112222", callerName: "Robert Anderson", duration: 45, audioUrl: "/voicemails/vm1.wav", transcription: "Hi, this is Robert from Tech Corp. I wanted to follow up on our meeting yesterday. Please give me a call back when you get a chance. Thanks!", isRead: false, isUrgent: true },
        { extensionId: 1, callerNumber: "+15553334444", callerName: "Jennifer Martinez", duration: 32, audioUrl: "/voicemails/vm2.wav", transcription: "Hey, Jennifer here. Just checking in about the proposal. Let me know if you need any additional information.", isRead: false, isUrgent: false },
        { extensionId: 2, callerNumber: "+15554445555", callerName: "David Thompson", duration: 28, audioUrl: "/voicemails/vm3.wav", transcription: "This is David from Global Solutions. I have an update on the software delivery schedule. Call me back at your convenience.", isRead: true, isUrgent: false },
        { extensionId: 3, callerNumber: "+15557778888", callerName: "Michael Chen", duration: 58, audioUrl: "/voicemails/vm4.wav", transcription: "Hi, Michael Chen here. Urgent matter regarding the enterprise license renewal. Please call me back as soon as possible.", isRead: false, isUrgent: true },
      ];
      for (const vm of voicemailsData) {
        await db.insert(voicemails).values(vm);
      }
    }

    const existingRoutingRules = await this.getRoutingRules();
    if (existingRoutingRules.length === 0) {
      const routingRulesData: InsertRoutingRule[] = [
        { name: "Business Hours", description: "Route calls during business hours", type: "time", action: "forward", destination: "200", priority: 100, enabled: true, conditions: { startTime: "09:00", endTime: "17:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday"] } },
        { name: "After Hours", description: "Route calls to voicemail after hours", type: "time", action: "voicemail", destination: "voicemail", priority: 50, enabled: true, conditions: { startTime: "17:00", endTime: "09:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] } },
        { name: "VIP Callers", description: "Priority routing for VIP customers", type: "caller_id", action: "forward", destination: "101", priority: 200, enabled: true, conditions: { callerIds: ["+15551112222", "+15557778888"] } },
        { name: "Weekend Support", description: "Weekend call handling", type: "time", action: "queue", destination: "301", priority: 75, enabled: true, conditions: { startTime: "09:00", endTime: "17:00", days: ["saturday", "sunday"] } },
      ];
      for (const rule of routingRulesData) {
        await this.createRoutingRule(rule);
      }
    }

    const existingWebhooks = await this.getWebhooks();
    if (existingWebhooks.length === 0) {
      const webhooksData: InsertWebhook[] = [
        { name: "CRM Integration", url: "https://api.example-crm.com/webhooks/calls", events: ["call.started", "call.ended", "call.missed"], secret: "whsec_abc123", enabled: true },
        { name: "Slack Notifications", url: "https://hooks.slack.com/services/T00000000/B00000000/XXXX", events: ["voicemail.received", "call.missed"], secret: "whsec_def456", enabled: true },
        { name: "Analytics Platform", url: "https://analytics.example.com/ingest/pbx", events: ["call.started", "call.answered", "call.ended", "sms.received", "sms.sent"], secret: "whsec_ghi789", enabled: false },
      ];
      for (const webhook of webhooksData) {
        await this.createWebhook(webhook);
      }
    }

    // Seed Integrations (12 supported integrations with real API connectivity)
    const existingIntegrations = await this.getIntegrations();
    if (existingIntegrations.length === 0) {
      const integrationsData: InsertIntegration[] = [
        { name: "Microsoft Teams", slug: "ms-teams", category: "Collaboration", description: "Direct routing, presence sync, and click-to-call from Microsoft Teams. Make and receive PBX calls directly within Teams with full call control.", icon: "Users", status: "available", popular: true, features: ["Direct routing", "Presence sync", "Click-to-call", "Call transfer", "Voicemail integration", "Call recording"] },
        { name: "Microsoft Entra ID", slug: "ms-entra", category: "Identity", description: "Enterprise SSO and automatic user provisioning from Azure AD. Sync users, groups, and security policies with your phone system.", icon: "Shield", status: "available", popular: true, features: ["Single sign-on", "User provisioning", "Group mapping", "Directory sync", "Conditional access", "MFA integration"] },
        { name: "Zoho CRM", slug: "zoho-crm", category: "CRM", description: "Full CRM integration with click-to-call, automatic call logging, contact sync, and screen pops for incoming calls.", icon: "Building2", status: "available", popular: true, features: ["Click-to-call", "Call logging", "Contact sync", "Screen pop", "Deal tracking", "Lead routing"] },
        { name: "Zoho Desk", slug: "zoho-desk", category: "CRM", description: "Help desk integration with auto-ticket creation from calls, agent routing based on skills, and SLA tracking.", icon: "Ticket", status: "available", popular: true, features: ["Ticket creation", "Call logging", "Agent routing", "SLA tracking", "Knowledge base search"] },
        { name: "WordPress", slug: "wordpress", category: "Website", description: "Click-to-call widget, live agent availability display, and call tracking plugin for your WordPress website.", icon: "Globe", status: "available", popular: true, features: ["Click-to-call widget", "Agent portal", "Live chat", "Call tracking", "Visitor analytics"] },
        { name: "Notion", slug: "notion", category: "Productivity", description: "Sync call logs, meeting notes, and contacts to Notion databases. Auto-create pages from voicemails and call summaries.", icon: "FileText", status: "available", popular: true, features: ["Call notes sync", "Database integration", "Meeting minutes", "Contact directory", "Voicemail transcripts", "Team wiki"] },
        { name: "Twilio", slug: "twilio", category: "Telephony", description: "Programmable SMS, voice, and fax capabilities powered by Twilio. Send/receive SMS, manage phone numbers, and route calls.", icon: "Phone", status: "available", popular: true, features: ["SMS gateway", "Voice API", "Fax support", "Number management", "Call recording", "IVR builder", "Programmable routing"] },
        { name: "Google Workspace", slug: "google-workspace", category: "Productivity", description: "Sync contacts, calendar, and Gmail with your phone system. Click-to-call from Gmail, auto-schedule follow-ups.", icon: "Calendar", status: "available", popular: true, features: ["Contact sync", "Calendar integration", "Gmail click-to-call", "Meet integration", "Drive recording storage", "Directory sync"] },
        { name: "UniFi Voice", slug: "unifi-voice", category: "UniFi", description: "Deep integration with UniFi Talk for SIP device provisioning, extension management, call routing, and voicemail across your UniFi network.", icon: "Phone", status: "available", popular: true, features: ["SIP device provisioning", "Extension sync", "Call routing rules", "Voicemail management", "Auto-attendant", "Ring groups", "Call queues", "CDR sync", "Firmware management"] },
        { name: "UniFi Network", slug: "unifi-network", category: "UniFi", description: "Monitor and manage VoIP network quality, VLAN configuration, QoS policies, switch ports, and AP connectivity for optimal call quality.", icon: "Activity", status: "available", popular: true, features: ["VLAN management", "QoS policies", "Switch port config", "AP management", "Network topology", "Bandwidth monitoring", "Client tracking", "Firewall rules", "DPI analytics", "Site-to-site VPN"] },
        { name: "UniFi Access", slug: "unifi-access", category: "UniFi", description: "Integrate door access control with your phone system. Trigger door unlocks from calls, log access events, and manage visitor entry.", icon: "Shield", status: "available", popular: true, features: ["Door unlock via call", "Access logs", "Visitor management", "Intercom integration", "Schedule-based access", "Badge management", "Emergency lockdown", "Multi-site access"] },
        { name: "UniFi Protect", slug: "unifi-protect", category: "UniFi", description: "View camera feeds from phone extensions, trigger recordings on call events, and integrate motion alerts with call routing.", icon: "Video", status: "available", popular: true, features: ["Live camera feeds", "Motion-triggered calls", "Recording management", "Smart detection alerts", "Doorbell integration", "Timeline view", "Camera groups", "Privacy zones", "Event notifications"] },
        { name: "RCare Nurse Call", slug: "rcare", category: "Healthcare", description: "Full integration with RCare nurse call systems. Route alarms to extensions, manage incidents, map devices to rooms, and receive real-time notifications from the RCare Cube.", icon: "HeartPulse", status: "available", popular: true, features: ["Alarm routing to extensions", "Incident management", "Device-to-extension mapping", "Real-time notifications", "Zone/view management", "Alarm acknowledgment", "Escalation rules", "ADL logging", "Resident directory", "Call-triggered alerts"] },
        { name: "PBX in a Flash", slug: "pbx-in-a-flash", category: "PBX Engine", description: "Connect to your Asterisk or FreePBX server to sync extensions, monitor presence, and generate configuration.", icon: "Server", status: "available", popular: true, features: ["Sync Extensions", "Monitor Status", "Generate Config"] }
      ];
      for (const integration of integrationsData) {
        await this.createIntegration(integration);
      }
    }

    // Seed SIP Providers (20+ provider templates)
    const existingProviders = await this.getSipProviders();
    if (existingProviders.length === 0) {
      const sipProvidersData: InsertSipProvider[] = [
        { name: "Twilio", slug: "twilio", description: "Cloud communications platform", website: "https://twilio.com", regions: ["US", "EU", "APAC"], transport: "tls", registrationServer: "sip.twilio.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "G.729", "Opus"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600, authMethod: "digest", qualifyFrequency: 60, keepAlive: 30 },
        { name: "Bandwidth", slug: "bandwidth", description: "Enterprise communications API", website: "https://bandwidth.com", regions: ["US", "CA"], transport: "udp", registrationServer: "sip.bandwidth.com", port: 5060, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, tlsEnabled: false, registrationExpiry: 3600, authMethod: "digest", qualifyFrequency: 60 },
        { name: "Vonage", slug: "vonage", description: "Cloud communication APIs", website: "https://vonage.com", regions: ["US", "EU", "APAC"], transport: "tls", registrationServer: "sip.nexmo.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "Opus"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 1800 },
        { name: "Telnyx", slug: "telnyx", description: "Mission-critical communications", website: "https://telnyx.com", regions: ["US", "EU", "APAC", "LATAM"], transport: "tls", registrationServer: "sip.telnyx.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600 },
        { name: "Plivo", slug: "plivo", description: "Voice and SMS API platform", website: "https://plivo.com", regions: ["US", "EU", "APAC"], transport: "udp", registrationServer: "sip.plivo.com", port: 5060, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, registrationExpiry: 3600 },
        { name: "Flowroute", slug: "flowroute", description: "Carrier-grade voice network", website: "https://flowroute.com", regions: ["US", "CA"], transport: "udp", registrationServer: "sip.flowroute.com", port: 5060, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, registrationExpiry: 300 },
        { name: "VoIP.ms", slug: "voipms", description: "Wholesale VoIP provider", website: "https://voip.ms", regions: ["US", "CA"], transport: "udp", registrationServer: "atlanta.voip.ms", outboundProxy: "atlanta.voip.ms", port: 5060, codecs: ["G.711u", "G.711a", "G.729", "GSM"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, registrationExpiry: 1800 },
        { name: "Lumen (CenturyLink)", slug: "lumen", description: "Enterprise SIP trunking", website: "https://lumen.com", regions: ["US"], transport: "tls", registrationServer: "sip.centurylink.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: false, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600 },
        { name: "Verizon Business", slug: "verizon", description: "Enterprise SIP services", website: "https://verizon.com/business", regions: ["US"], transport: "tls", registrationServer: "sip.verizon.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a"], dtmfMode: "rfc2833", natTraversal: false, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600 },
        { name: "AT&T Business", slug: "att", description: "AT&T IP Flexible Reach", website: "https://att.com/business", regions: ["US"], transport: "tls", registrationServer: "sbc.att.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: false, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600 },
        { name: "Comcast Business", slug: "comcast", description: "Business VoIP services", website: "https://business.comcast.com", regions: ["US"], transport: "udp", registrationServer: "sip.business.comcast.com", port: 5060, codecs: ["G.711u", "G.711a"], dtmfMode: "rfc2833", natTraversal: false, registrationExpiry: 3600 },
        { name: "Spectrum Enterprise", slug: "spectrum", description: "Enterprise voice solutions", website: "https://enterprise.spectrum.com", regions: ["US"], transport: "udp", registrationServer: "sip.spectrum.com", port: 5060, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: false, registrationExpiry: 3600 },
        { name: "RingCentral", slug: "ringcentral", description: "Cloud phone system", website: "https://ringcentral.com", regions: ["US", "EU", "APAC"], transport: "tls", registrationServer: "sip.ringcentral.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "Opus"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600 },
        { name: "8x8", slug: "8x8", description: "Cloud communications", website: "https://8x8.com", regions: ["US", "EU", "APAC"], transport: "tls", registrationServer: "sip.8x8.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "G.722", "Opus"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600 },
        { name: "Nextiva", slug: "nextiva", description: "Business phone service", website: "https://nextiva.com", regions: ["US"], transport: "tls", registrationServer: "sip.nextiva.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600 },
        { name: "Dialpad", slug: "dialpad", description: "AI-powered cloud phone", website: "https://dialpad.com", regions: ["US", "EU", "APAC"], transport: "tls", registrationServer: "sip.dialpad.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "Opus"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600 },
        { name: "Aircall", slug: "aircall", description: "Cloud call center", website: "https://aircall.io", regions: ["US", "EU"], transport: "tls", registrationServer: "sip.aircall.io", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "Opus"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 1800 },
        { name: "Avoxi", slug: "avoxi", description: "Global voice platform", website: "https://avoxi.com", regions: ["US", "EU", "APAC", "LATAM", "MEA"], transport: "udp", registrationServer: "sip.avoxi.com", port: 5060, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, registrationExpiry: 3600 },
        { name: "Callcentric", slug: "callcentric", description: "VoIP phone service", website: "https://callcentric.com", regions: ["US"], transport: "udp", registrationServer: "callcentric.com", port: 5060, codecs: ["G.711u", "G.711a", "G.729", "GSM", "iLBC"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, registrationExpiry: 300 },
        { name: "Sip.us", slug: "sipus", description: "SIP trunking service", website: "https://sip.us", regions: ["US"], transport: "udp", registrationServer: "proxy.sip.us", port: 5060, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, registrationExpiry: 1800 },
        { name: "Localphone", slug: "localphone", description: "International calling", website: "https://localphone.com", regions: ["US", "EU", "APAC"], transport: "udp", registrationServer: "sip.localphone.com", port: 5060, codecs: ["G.711u", "G.711a", "G.729", "GSM"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, registrationExpiry: 3600 },
        { name: "Anveo", slug: "anveo", description: "Wholesale VoIP provider", website: "https://anveo.com", regions: ["US"], transport: "udp", registrationServer: "sip.anveo.com", port: 5060, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, registrationExpiry: 1800 },
        { name: "Didlogic", slug: "didlogic", description: "Global DID provider", website: "https://didlogic.com", regions: ["US", "EU", "APAC"], transport: "udp", registrationServer: "sip.didlogic.com", port: 5060, codecs: ["G.711u", "G.711a", "G.729"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: false, registrationExpiry: 3600 },
        { name: "Sangoma", slug: "sangoma", description: "Enterprise communications", website: "https://sangoma.com", regions: ["US", "EU"], transport: "tls", registrationServer: "sip.sangoma.com", port: 5060, tlsPort: 5061, codecs: ["G.711u", "G.711a", "G.729", "G.722"], dtmfMode: "rfc2833", natTraversal: true, srtpEnabled: true, tlsEnabled: true, registrationExpiry: 3600 },
      ];
      for (const provider of sipProvidersData) {
        await this.createSipProvider(provider);
      }
    }

    // Seed Device Templates (100 handset/endpoint models)
    const existingTemplates = await this.getDeviceTemplates();
    if (existingTemplates.length === 0) {
      const deviceTemplatesData: InsertDeviceTemplate[] = [
        // Yealink phones (20 models)
        { manufacturer: "Yealink", model: "T21P E2", deviceType: "phone", firmwareVersion: "52.84.0.125", provisioningProtocol: "http", lineCount: 2, blfKeys: 2, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Yealink", model: "T23G", deviceType: "phone", firmwareVersion: "44.84.0.130", provisioningProtocol: "http", lineCount: 3, blfKeys: 3, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Yealink", model: "T27G", deviceType: "phone", firmwareVersion: "69.85.0.35", provisioningProtocol: "http", lineCount: 6, blfKeys: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T29G", deviceType: "phone", firmwareVersion: "46.83.0.130", provisioningProtocol: "http", lineCount: 16, blfKeys: 27, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T33G", deviceType: "phone", firmwareVersion: "124.85.0.50", provisioningProtocol: "http", lineCount: 4, blfKeys: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T43U", deviceType: "phone", firmwareVersion: "108.86.0.60", provisioningProtocol: "http", lineCount: 12, blfKeys: 21, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T46U", deviceType: "phone", firmwareVersion: "108.86.0.60", provisioningProtocol: "http", lineCount: 16, blfKeys: 27, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T48U", deviceType: "phone", firmwareVersion: "108.86.0.60", provisioningProtocol: "http", lineCount: 16, blfKeys: 29, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T53", deviceType: "phone", firmwareVersion: "96.86.0.60", provisioningProtocol: "http", lineCount: 12, blfKeys: 21, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T53W", deviceType: "phone", firmwareVersion: "96.86.0.60", provisioningProtocol: "http", lineCount: 12, blfKeys: 21, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T54W", deviceType: "phone", firmwareVersion: "96.86.0.60", provisioningProtocol: "http", lineCount: 16, blfKeys: 27, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T57W", deviceType: "phone", firmwareVersion: "96.86.0.60", provisioningProtocol: "http", lineCount: 16, blfKeys: 29, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "T58A", deviceType: "phone", firmwareVersion: "58.84.0.25", provisioningProtocol: "http", lineCount: 16, blfKeys: 27, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, hasCamera: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "VP59", deviceType: "video_phone", firmwareVersion: "91.86.0.25", provisioningProtocol: "http", lineCount: 16, blfKeys: 27, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, hasCamera: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus", "H.264"] },
        { manufacturer: "Yealink", model: "W73P", deviceType: "dect_base", firmwareVersion: "146.85.0.40", provisioningProtocol: "http", lineCount: 10, hasDisplay: false, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Yealink", model: "W76P", deviceType: "dect_base", firmwareVersion: "152.85.0.20", provisioningProtocol: "http", lineCount: 20, hasDisplay: false, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "CP920", deviceType: "conference", firmwareVersion: "78.84.0.35", provisioningProtocol: "http", lineCount: 1, hasDisplay: true, hasPoe: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "CP960", deviceType: "conference", firmwareVersion: "73.84.0.30", provisioningProtocol: "http", lineCount: 1, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "MP56", deviceType: "teams_phone", firmwareVersion: "122.15.0.45", provisioningProtocol: "http", lineCount: 4, blfKeys: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        { manufacturer: "Yealink", model: "MP58", deviceType: "teams_phone", firmwareVersion: "122.15.0.45", provisioningProtocol: "http", lineCount: 8, blfKeys: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        // Poly/Polycom phones (15 models)
        { manufacturer: "Poly", model: "VVX 150", deviceType: "phone", firmwareVersion: "6.4.3.0", provisioningProtocol: "https", lineCount: 2, blfKeys: 0, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Poly", model: "VVX 250", deviceType: "phone", firmwareVersion: "6.4.3.0", provisioningProtocol: "https", lineCount: 4, blfKeys: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Poly", model: "VVX 350", deviceType: "phone", firmwareVersion: "6.4.3.0", provisioningProtocol: "https", lineCount: 6, blfKeys: 6, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Poly", model: "VVX 450", deviceType: "phone", firmwareVersion: "6.4.3.0", provisioningProtocol: "https", lineCount: 12, blfKeys: 12, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Poly", model: "Edge E100", deviceType: "phone", firmwareVersion: "7.0.4.0", provisioningProtocol: "https", lineCount: 8, blfKeys: 0, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "Edge E220", deviceType: "phone", firmwareVersion: "7.0.4.0", provisioningProtocol: "https", lineCount: 16, blfKeys: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "Edge E320", deviceType: "phone", firmwareVersion: "7.0.4.0", provisioningProtocol: "https", lineCount: 16, blfKeys: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "Edge E350", deviceType: "phone", firmwareVersion: "7.0.4.0", provisioningProtocol: "https", lineCount: 16, blfKeys: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "Edge E400", deviceType: "phone", firmwareVersion: "7.0.4.0", provisioningProtocol: "https", lineCount: 34, blfKeys: 20, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "Edge E450", deviceType: "phone", firmwareVersion: "7.0.4.0", provisioningProtocol: "https", lineCount: 34, blfKeys: 24, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "Edge E500", deviceType: "phone", firmwareVersion: "7.0.4.0", provisioningProtocol: "https", lineCount: 34, blfKeys: 24, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, hasCamera: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "CCX 400", deviceType: "teams_phone", firmwareVersion: "7.3.1.0", provisioningProtocol: "https", lineCount: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "CCX 500", deviceType: "teams_phone", firmwareVersion: "7.3.1.0", provisioningProtocol: "https", lineCount: 6, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "CCX 600", deviceType: "teams_phone", firmwareVersion: "7.3.1.0", provisioningProtocol: "https", lineCount: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, hasCamera: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        { manufacturer: "Poly", model: "Trio 8500", deviceType: "conference", firmwareVersion: "7.2.2.0", provisioningProtocol: "https", lineCount: 1, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        // Cisco phones (15 models)
        { manufacturer: "Cisco", model: "IP Phone 6821", deviceType: "phone", firmwareVersion: "12.0.1", provisioningProtocol: "tftp", lineCount: 2, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729"] },
        { manufacturer: "Cisco", model: "IP Phone 6841", deviceType: "phone", firmwareVersion: "12.0.1", provisioningProtocol: "tftp", lineCount: 4, blfKeys: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Cisco", model: "IP Phone 6851", deviceType: "phone", firmwareVersion: "12.0.1", provisioningProtocol: "tftp", lineCount: 4, blfKeys: 6, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Cisco", model: "IP Phone 6861", deviceType: "phone", firmwareVersion: "12.0.1", provisioningProtocol: "tftp", lineCount: 4, blfKeys: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Cisco", model: "IP Phone 6871", deviceType: "phone", firmwareVersion: "12.0.1", provisioningProtocol: "tftp", lineCount: 6, blfKeys: 6, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Cisco", model: "IP Phone 7821", deviceType: "phone", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 2, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "iLBC"] },
        { manufacturer: "Cisco", model: "IP Phone 7841", deviceType: "phone", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "iLBC"] },
        { manufacturer: "Cisco", model: "IP Phone 7861", deviceType: "phone", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 16, blfKeys: 16, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "iLBC"] },
        { manufacturer: "Cisco", model: "IP Phone 8811", deviceType: "phone", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 5, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "iLBC", "Opus"] },
        { manufacturer: "Cisco", model: "IP Phone 8841", deviceType: "phone", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 5, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "iLBC", "Opus"] },
        { manufacturer: "Cisco", model: "IP Phone 8845", deviceType: "phone", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 5, hasDisplay: true, hasPoe: true, hasGigabit: true, hasCamera: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "iLBC", "Opus"] },
        { manufacturer: "Cisco", model: "IP Phone 8851", deviceType: "phone", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 5, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "iLBC", "Opus"] },
        { manufacturer: "Cisco", model: "IP Phone 8861", deviceType: "phone", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 10, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "iLBC", "Opus"] },
        { manufacturer: "Cisco", model: "IP Phone 8865", deviceType: "phone", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 10, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, hasCamera: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "iLBC", "Opus"] },
        { manufacturer: "Cisco", model: "IP Conference 8832", deviceType: "conference", firmwareVersion: "14.2.1", provisioningProtocol: "tftp", lineCount: 1, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        // Grandstream phones (15 models)
        { manufacturer: "Grandstream", model: "GXP1610", deviceType: "phone", firmwareVersion: "1.0.4.152", provisioningProtocol: "http", lineCount: 1, hasDisplay: true, hasPoe: false, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Grandstream", model: "GXP1615", deviceType: "phone", firmwareVersion: "1.0.4.152", provisioningProtocol: "http", lineCount: 2, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Grandstream", model: "GXP1620", deviceType: "phone", firmwareVersion: "1.0.4.152", provisioningProtocol: "http", lineCount: 2, blfKeys: 0, hasDisplay: true, hasPoe: false, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Grandstream", model: "GXP1625", deviceType: "phone", firmwareVersion: "1.0.4.152", provisioningProtocol: "http", lineCount: 2, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Grandstream", model: "GXP1628", deviceType: "phone", firmwareVersion: "1.0.4.152", provisioningProtocol: "http", lineCount: 2, blfKeys: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Grandstream", model: "GXP1630", deviceType: "phone", firmwareVersion: "1.0.4.152", provisioningProtocol: "http", lineCount: 3, blfKeys: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Grandstream", model: "GXP2130", deviceType: "phone", firmwareVersion: "1.0.11.40", provisioningProtocol: "http", lineCount: 3, blfKeys: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Grandstream", model: "GXP2135", deviceType: "phone", firmwareVersion: "1.0.11.40", provisioningProtocol: "http", lineCount: 8, blfKeys: 32, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Grandstream", model: "GXP2140", deviceType: "phone", firmwareVersion: "1.0.11.40", provisioningProtocol: "http", lineCount: 4, blfKeys: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Grandstream", model: "GXP2160", deviceType: "phone", firmwareVersion: "1.0.11.40", provisioningProtocol: "http", lineCount: 6, blfKeys: 24, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Grandstream", model: "GXP2170", deviceType: "phone", firmwareVersion: "1.0.11.40", provisioningProtocol: "http", lineCount: 12, blfKeys: 48, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Grandstream", model: "GRP2612", deviceType: "phone", firmwareVersion: "1.0.5.72", provisioningProtocol: "https", lineCount: 2, blfKeys: 16, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Grandstream", model: "GRP2614", deviceType: "phone", firmwareVersion: "1.0.5.72", provisioningProtocol: "https", lineCount: 4, blfKeys: 24, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Grandstream", model: "GRP2616", deviceType: "phone", firmwareVersion: "1.0.5.72", provisioningProtocol: "https", lineCount: 6, blfKeys: 24, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Grandstream", model: "GAC2500", deviceType: "conference", firmwareVersion: "1.0.3.66", provisioningProtocol: "https", lineCount: 6, hasDisplay: true, hasPoe: true, hasGigabit: true, hasWifi: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        // Fanvil phones (10 models)
        { manufacturer: "Fanvil", model: "X1SP", deviceType: "phone", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 2, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Fanvil", model: "X3S", deviceType: "phone", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 4, blfKeys: 6, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Fanvil", model: "X3SP", deviceType: "phone", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 4, blfKeys: 6, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Fanvil", model: "X4U", deviceType: "phone", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 12, blfKeys: 12, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Fanvil", model: "X5U", deviceType: "phone", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 16, blfKeys: 30, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Fanvil", model: "X6U", deviceType: "phone", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 20, blfKeys: 60, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Fanvil", model: "X7", deviceType: "phone", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 20, blfKeys: 112, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Fanvil", model: "X7A", deviceType: "phone", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 20, blfKeys: 127, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Fanvil", model: "X7C", deviceType: "video_phone", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 20, blfKeys: 112, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, hasCamera: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus", "H.264"] },
        { manufacturer: "Fanvil", model: "CS30", deviceType: "conference", firmwareVersion: "2.6.0.3", provisioningProtocol: "http", lineCount: 2, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        // Snom phones (10 models)
        { manufacturer: "Snom", model: "D120", deviceType: "phone", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 2, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Snom", model: "D315", deviceType: "phone", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 4, blfKeys: 10, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Snom", model: "D345", deviceType: "phone", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 12, blfKeys: 48, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Snom", model: "D385", deviceType: "phone", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 12, blfKeys: 48, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Snom", model: "D713", deviceType: "phone", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 4, blfKeys: 4, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Snom", model: "D717", deviceType: "phone", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 6, blfKeys: 6, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Snom", model: "D735", deviceType: "phone", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 12, blfKeys: 32, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Snom", model: "D785", deviceType: "phone", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 24, blfKeys: 48, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Snom", model: "D865", deviceType: "phone", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 12, blfKeys: 18, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Snom", model: "C620", deviceType: "conference", firmwareVersion: "10.1.54.13", provisioningProtocol: "https", lineCount: 1, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.722", "Opus"] },
        // Mitel phones (5 models)
        { manufacturer: "Mitel", model: "6863i", deviceType: "phone", firmwareVersion: "6.3.0.2007", provisioningProtocol: "tftp", lineCount: 2, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Mitel", model: "6865i", deviceType: "phone", firmwareVersion: "6.3.0.2007", provisioningProtocol: "tftp", lineCount: 9, blfKeys: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Mitel", model: "6867i", deviceType: "phone", firmwareVersion: "6.3.0.2007", provisioningProtocol: "tftp", lineCount: 9, blfKeys: 20, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Mitel", model: "6869i", deviceType: "phone", firmwareVersion: "6.3.0.2007", provisioningProtocol: "tftp", lineCount: 24, blfKeys: 48, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Mitel", model: "6873i", deviceType: "phone", firmwareVersion: "6.3.0.2007", provisioningProtocol: "tftp", lineCount: 24, blfKeys: 66, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        // Htek phones (5 models)
        { manufacturer: "Htek", model: "UC902", deviceType: "phone", firmwareVersion: "2.0.4.5.8", provisioningProtocol: "http", lineCount: 2, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Htek", model: "UC903", deviceType: "phone", firmwareVersion: "2.0.4.5.8", provisioningProtocol: "http", lineCount: 3, blfKeys: 10, hasDisplay: true, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Htek", model: "UC924", deviceType: "phone", firmwareVersion: "2.0.4.5.8", provisioningProtocol: "http", lineCount: 4, blfKeys: 8, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Htek", model: "UC926", deviceType: "phone", firmwareVersion: "2.0.4.5.8", provisioningProtocol: "http", lineCount: 6, blfKeys: 24, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        { manufacturer: "Htek", model: "UC927", deviceType: "phone", firmwareVersion: "2.0.4.5.8", provisioningProtocol: "http", lineCount: 8, blfKeys: 40, hasDisplay: true, hasPoe: true, hasGigabit: true, hasBluetooth: true, hasWifi: true, hasCamera: true, codecs: ["G.711u", "G.711a", "G.729", "G.722", "Opus"] },
        // Obihai/Poly ATAs (5 models)
        { manufacturer: "Poly", model: "OBi302", deviceType: "ata", firmwareVersion: "3.2.2.5909", provisioningProtocol: "http", lineCount: 2, hasDisplay: false, hasPoe: false, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Poly", model: "OBi504vs", deviceType: "ata", firmwareVersion: "3.2.2.5909", provisioningProtocol: "http", lineCount: 4, hasDisplay: false, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Poly", model: "OBi508vs", deviceType: "ata", firmwareVersion: "3.2.2.5909", provisioningProtocol: "http", lineCount: 8, hasDisplay: false, hasPoe: true, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Grandstream", model: "HT801", deviceType: "ata", firmwareVersion: "1.0.33.5", provisioningProtocol: "http", lineCount: 1, hasDisplay: false, hasPoe: false, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
        { manufacturer: "Grandstream", model: "HT802", deviceType: "ata", firmwareVersion: "1.0.33.5", provisioningProtocol: "http", lineCount: 2, hasDisplay: false, hasPoe: false, codecs: ["G.711u", "G.711a", "G.729", "G.722"] },
      ];
      for (const template of deviceTemplatesData) {
        await this.createDeviceTemplate(template);
      }
    }
  }
}

export const storage = new DatabaseStorage();
