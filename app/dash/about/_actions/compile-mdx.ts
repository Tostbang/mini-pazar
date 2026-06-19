"use server";

import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

export type CompileMdxError = { error: string };
export type CompileMdxResult = MDXRemoteSerializeResult;

export async function compileMdxAction(
  source: string,
): Promise<CompileMdxResult | CompileMdxError | null> {
  if (!source.trim()) return null;
  try {
    const result = await serialize(source, {
      mdxOptions: {
        format: "mdx",
      },
    });
    return result as CompileMdxResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MDX derlenemedi.";
    return { error: message };
  }
}
