
import { z } from "zod";

export const resourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(100, "Name must not exceed 100 characters."),

  type: z
    .string()
    .trim()
    .min(2, "Type must contain at least 2 characters.")
    .max(50, "Type must not exceed 50 characters."),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters.")
    .optional()
    .default(""),

  location: z
    .string()
    .trim()
    .max(150, "Location must not exceed 150 characters.")
    .optional()
    .default(""),
});

export type ResourceInput = z.infer<typeof resourceSchema>;
