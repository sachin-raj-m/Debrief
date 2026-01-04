/**
 * Zod Validation Schemas - Pivots
 */

import { z } from "zod";

export const createPivotSchema = z.object({
  new_title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters")
    .trim()
    .optional(),
  new_description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters")
    .trim()
    .optional(),
  pivot_reason: z
    .string()
    .min(10, "Please explain why you're pivoting (min 10 characters)")
    .max(1000, "Pivot reason is too long (max 1000 characters)")
    .trim(),
}).refine(
  (data) => data.new_title || data.new_description,
  {
    message: "You must provide at least a new title or description",
    path: ["new_title"],
  }
);

export type CreatePivotInput = z.infer<typeof createPivotSchema>;
