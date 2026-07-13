import { z } from "zod";

const uuid = z.string().uuid();
const playToken = z.string().min(40).max(1024);

export const generateBodySchema = z.object({
  template: z.string().min(1).max(32),
  prompt: z.string().min(1).max(240),
  lang: z.enum(["zh", "en"]).optional(),
}).strict();

export const workshopBodySchema = z.object({
  prompt: z.string().min(1).max(600),
  lang: z.enum(["zh", "en"]).optional(),
  title: z.string().max(60).optional(),
}).strict();

export const playEventBodySchema = z.object({
  event: z.enum(["view", "complete", "share", "creator_link_click", "creator_card_click", "creator_profile_view"]),
  playToken: playToken.optional(),
}).strict();

export const playResultBodySchema = z.object({
  label: z.string().max(60).optional(),
  score: z.number().int().min(-1_000_000_000).max(1_000_000_000).nullable().optional(),
  playToken,
}).strict();

export const reportBodySchema = z.object({ reason: z.string().max(200).optional() }).strict();
export const followBodySchema = z.object({ handle: z.string().min(1).max(24), active: z.boolean() }).strict();
export const funnelBodySchema = z.object({ event: z.literal("workshop_enter"), microappId: uuid }).strict();
