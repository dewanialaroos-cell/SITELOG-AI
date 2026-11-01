-- SITELOG AI: allow company owners/admins to see and manage their own site's projects and reports.
-- Run this once in Supabase SQL Editor. It adds policies; it does not delete table data.

DROP POLICY IF EXISTS projects_company_admin_select ON public.projects;
CREATE POLICY projects_company_admin_select
ON public.projects
FOR SELECT
TO authenticated
USING (public.is_company_admin(company_id));

DROP POLICY IF EXISTS daily_reports_company_admin_select ON public.daily_reports;
CREATE POLICY daily_reports_company_admin_select
ON public.daily_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND public.is_company_admin(p.company_id)
  )
);

DROP POLICY IF EXISTS daily_reports_company_admin_insert ON public.daily_reports;
CREATE POLICY daily_reports_company_admin_insert
ON public.daily_reports
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND public.is_company_admin(p.company_id)
  )
);

DROP POLICY IF EXISTS daily_reports_company_admin_update ON public.daily_reports;
CREATE POLICY daily_reports_company_admin_update
ON public.daily_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND public.is_company_admin(p.company_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND public.is_company_admin(p.company_id)
  )
);

DROP POLICY IF EXISTS daily_reports_company_admin_delete ON public.daily_reports;
CREATE POLICY daily_reports_company_admin_delete
ON public.daily_reports
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND public.is_company_admin(p.company_id)
  )
);
