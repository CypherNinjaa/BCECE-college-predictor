import { z } from "zod";

export const predictRequestSchema = z.object({
  subGroup: z.enum(["PCM", "PCB", "PCMB"]).optional(),
  category: z.enum(["UR", "BC", "EBC", "SC", "ST"]),
  rankType: z.enum(["PCM", "PCB"]),
  rankSubCategory: z.enum(["UR", "CAT", "RCG", "DQ", "SMQ"]),
  rankValue: z.coerce.number().int().positive(),
  branches: z.array(z.string()).optional(),
  institutes: z.array(z.string()).optional(),
});

export type PredictRequest = z.infer<typeof predictRequestSchema>;
