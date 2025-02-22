import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Supabase client
  const supabase = createClient();

  const { type, data } = payload as WebhookEvent;

  // Handle user creation
  if (type === "user.created") {
    const { id, email_addresses, first_name, last_name } = data;
    const email = email_addresses[0]?.email_address;
    const full_name = [first_name, last_name].filter(Boolean).join(" ");

    // Insert the new user into our profiles table
    const { error } = await supabase.from("profiles").insert({
      clerk_id: id,
      email: email,
      full_name: full_name,
      experience_level: "beginner", // default value
    });

    if (error) {
      console.error("Error creating profile:", error);
      return new Response("Error creating profile", {
        status: 500,
      });
    }
  }

  return new Response("Webhook received", {
    status: 200,
  });
}
