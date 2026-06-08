import { z } from "zod";

export const importUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.string().optional(),
});

export type ImportUrlFormValues = z.infer<typeof importUrlSchema>;

export const feedSchema = z.object({
  name: z.string().min(1, "Feed name is required"),
  url: z.string().url("Please enter a valid URL"),
  category: z.string().optional(),
  tags: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type FeedFormValues = z.infer<typeof feedSchema>;

export const savedQuerySchema = z.object({
  title: z.string().min(1, "Title is required"),
  query: z.string().min(1, "Query is required"),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  active: z.boolean().default(true),
});

export type SavedQueryFormValues = z.infer<typeof savedQuerySchema>;
