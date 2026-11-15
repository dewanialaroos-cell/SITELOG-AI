import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return respond({ error: "Login required." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!url || !anonKey || !serviceKey) {
      return respond({ error: "Supabase Edge Function secrets are not configured." }, 500);
    }

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return respond({ error: "Invalid or expired login session." }, 401);

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const companyId = String(body.company_id || "");
    const projectId = String(body.project_id || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !companyId || !projectId) {
      return respond({ error: "Valid email, company and project are required." }, 400);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: membership, error: membershipError } = await admin
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return respond({ error: "Only this company's owner/admin can invite engineers." }, 403);
    }

    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("id, company_id")
      .eq("id", projectId)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project || project.company_id !== companyId) {
      return respond({ error: "Selected project does not belong to this company." }, 400);
    }

    // Resolve an already-registered engineer by email before attempting a new invite.
    let targetUser: any = null;
    const perPage = 1000;
    for (let page = 1; page <= 100; page += 1) {
      const { data, error: usersError } = await admin.auth.admin.listUsers({ page, perPage });
      if (usersError) throw usersError;
      targetUser = data.users.find((user: any) => user.email?.toLowerCase() === email) || null;
      if (targetUser || data.users.length < perPage) break;
    }

    let existingUser = Boolean(targetUser);
    if (targetUser) {
      // User-editable auth metadata is not a trusted authorization source.
      // Do not silently downgrade company owner/admin accounts.
      const { data: targetMemberships, error: targetMembershipError } = await admin
        .from("company_members")
        .select("role")
        .eq("user_id", targetUser.id);
      if (targetMembershipError) throw targetMembershipError;
      if ((targetMemberships || []).some((item: any) => ["owner", "admin"].includes(item.role))) {
        return respond({ error: "This email belongs to a company owner/admin account and cannot be assigned as an engineer." }, 409);
      }
    } else {
      const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
      if (inviteError) throw inviteError;
      targetUser = invited.user;
      if (!targetUser?.id) throw new Error("Supabase did not return the invited user ID.");
    }

    const userId = targetUser.id;
    const { data: currentCompanyMembership, error: currentCompanyMembershipError } = await admin
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .maybeSingle();
    if (currentCompanyMembershipError) throw currentCompanyMembershipError;

    if (!currentCompanyMembership) {
      const { error } = await admin.from("company_members").insert({
        company_id: companyId,
        user_id: userId,
        role: "engineer",
      });
      if (error && error.code !== "23505") throw error;
    }

    const { error: projectInsertError } = await admin
      .from("project_members")
      .insert({ project_id: projectId, user_id: userId, role: "engineer" });
    if (projectInsertError && projectInsertError.code !== "23505") throw projectInsertError;

    return respond({
      success: true,
      existing_user: existingUser,
      email_sent: !existingUser,
      assigned_email: email,
      message: existingUser
        ? "Existing engineer assigned to the selected project."
        : "Invitation email sent and project assigned.",
    });
  } catch (error) {
    console.error("invite-engineer failed:", error);
    return respond({ error: error instanceof Error ? error.message : "Invitation failed." }, 500);
  }
});
