import { auth } from "@clerk/nextjs/server";

export async function getAuthenticatedUser() {
  const { userId } = await auth.protect();

  return { id: userId };
}
