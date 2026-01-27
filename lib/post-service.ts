"use client";

import { postSchema, type PostInput } from "@/lib/post-schema";
import type { ValidationIssue, ValidationResult } from "@/lib/post-types";
import { normalizePost as baseNormalizePost } from "@/lib/post-normalize";

// Re-export para uso en componentes cliente
export function normalizePost(input: PostInput): PostInput {
  return baseNormalizePost(input);
}

export function validatePost(input: PostInput): ValidationResult {
  // Normalizamos primero para agregar https:// a dominios simples y limpiar datos
  const normalized = normalizePost(input);
  const parsed = postSchema.safeParse(normalized);
  if (parsed.success) return { ok: true };
  const issues: ValidationIssue[] = parsed.error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return { ok: false, issues };
}

export async function saveDraft(input: PostInput): Promise<void> {
  const key = `post:draft:${input.slug}`;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(input));
    } else {
      console.log("[saveDraft]", key, input);
    }
  } catch (err) {
    console.warn("No se pudo guardar draft en localStorage", err);
  }
}
