
import { z } from "zod";

export const reservationSchema = z
  .object({
    resourceId: z.number().int().positive(
      "Please select a valid resource."
    ),

    reservedBy: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters.")
      .max(100, "Name must not exceed 100 characters."),

    purpose: z
      .string()
      .trim()
      .min(3, "Purpose must contain at least 3 characters.")
      .max(500, "Purpose must not exceed 500 characters."),

    startTime: z.string().datetime({
      message: "Please provide a valid start date and time.",
    }),

    endTime: z.string().datetime({
      message: "Please provide a valid end date and time.",
    }),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be later than start time.",
      });
    }
  });

export type ReservationInput = z.infer<
  typeof reservationSchema
>;
