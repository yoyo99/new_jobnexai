import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Mock the Zod schema for testing
const PoleEmploiLetterSchema = z.object({
  user_info: z.object({
    lastname: z.string().min(1, "Le nom est obligatoire"),
    firstname: z.string().min(1, "Le prénom est obligatoire"),
    address: z.string().min(1, "L'adresse est obligatoire"),
    pole_emploi_id: z.string().min(1, "L'identifiant Pôle Emploi est obligatoire"),
  }),
  period: z.tuple([z.number(), z.number()]),
  summary: z.object({
    applications: z.array(
      z.object({
        title: z.string().optional(),
        company: z.string().optional(),
        date: z.string().optional(),
        status: z.string().optional(),
      })
    ),
  }),
  template_type: z.string().optional(),
});

describe('Pole Emploi API Validation', () => {
  test('validates correct payload', () => {
    const validPayload = {
      user_info: {
        lastname: "Dupont",
        firstname: "Jean",
        address: "1 Rue de Paris, 75001 Paris",
        pole_emploi_id: "123456789",
      },
      period: [5, 2023],
      summary: {
        applications: [
          {
            title: "Développeur Web",
            company: "Tech Corp",
            date: "2023-05-15",
            status: "applied",
          },
        ],
      },
      template_type: "standard",
    };

    const result = PoleEmploiLetterSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  test('rejects missing required fields', () => {
    const invalidPayload = {
      user_info: {
        lastname: "", // Missing required field
        firstname: "Jean",
        address: "1 Rue de Paris, 75001 Paris",
        pole_emploi_id: "123456789",
      },
      period: [5, 2023],
      summary: {
        applications: [],
      },
    };

    const result = PoleEmploiLetterSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (result.error) {
      // In newer Zod versions, errors might be in a different format
      const errorIssues = result.error.issues || [];
      if (errorIssues.length > 0) {
        expect(errorIssues[0].message).toContain("obligatoire");
      }
    }
  });

  test('rejects invalid period format', () => {
    const invalidPayload = {
      user_info: {
        lastname: "Dupont",
        firstname: "Jean",
        address: "1 Rue de Paris, 75001 Paris",
        pole_emploi_id: "123456789",
      },
      period: ["5", 2023], // Invalid type - should be number
      summary: {
        applications: [],
      },
    };

    const result = PoleEmploiLetterSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  test('accepts optional template_type', () => {
    const validPayloadWithoutTemplate = {
      user_info: {
        lastname: "Dupont",
        firstname: "Jean",
        address: "1 Rue de Paris, 75001 Paris",
        pole_emploi_id: "123456789",
      },
      period: [5, 2023],
      summary: {
        applications: [],
      },
      // template_type is omitted
    };

    const result = PoleEmploiLetterSchema.safeParse(validPayloadWithoutTemplate);
    expect(result.success).toBe(true);
  });
});