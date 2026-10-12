import React, { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Activity, ArrowUpRight, Building2, CalendarDays, Camera, CheckCircle2,
  ChevronRight, Clock3, CloudSun, Download, Edit3, FileText, FolderKanban,
  HardHat, LayoutDashboard, LogIn, LogOut, MapPin, Mic, Plus, RefreshCw,
  Save, Share2, ShieldCheck, Trash2, UserPlus, Users, X
} from "lucide-react";
import { supabase } from "./supabase";

const EMPTY_COMPANY = { id: null, name: "", phone: "", email: "", address: "" };
const EMPTY_PROJECT = { id: null, name: "", code: "", client: "", location: "" };
const EMPTY_REPORT = {
  id: null, projectId: "", projectName: "", projectCode: "", engineer: "",
  date: new Date().toISOString().slice(0, 10), weather: "", startTime: "", endTime: "",
  workDone: "", labour: "", materials: "", equipment: "", issues: "", notes: "", photos: []
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "reports", label: "Daily Reports", icon: FileText },
  { id: "company", label: "Company", icon: Building2 }
];

function toProject(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name || "Untitled project",
    code: row.project_code || "",
    client: row.client || "",
    location: row.location || "",
    description: row.description || "",
    createdAt: row.created_at
  };
}

function toReport(row, projectMap = {}) {
  const project = projectMap[row.project_id] || {};
  return {
    id: row.id,
    projectId: row.project_id || "",
    projectName: project.name || "Project report",
    projectCode: row.project_code || project.code || "",
    engineer: row.engineer || "",
    date: row.report_date || "",
    weather: row.weather || "",
    startTime: row.start_time || "",
    endTime: row.end_time || "",
    workDone: row.work_description || "",
    labour: row.labour || "",
    materials: row.materials_used || "",
    equipment: row.equipment || "",
    issues: row.issues || "",
    notes: row.notes || "",
    photos: Array.isArray(row.photos) ? row.photos : [],
    createdAt: row.created_at,
    createdBy: row.created_by
  };
}

function dateLabel(value) {
  if (!value) return "Date not set";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric"
  });
}

function shortName(value = "") {
  return value.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "S";
}

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [authForm, setAuthForm] = useState({ name: "", company: "", email: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceRefresh, setWorkspaceRefresh] = useState(0);
  const [workspaceError, setWorkspaceError] = useState("");
  const [companyId, setCompanyId] = useState(null);
  const [companyRole, setCompanyRole] = useState("");
  const [company, setCompany] = useState(EMPTY_COMPANY);
  const [companySetupName, setCompanySetupName] = useState("");
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [projectSearch, setProjectSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [reportForm, setReportForm] = useState(EMPTY_REPORT);
  const [editingReportId, setEditingReportId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const isAdmin = companyRole === "owner" || companyRole === "admin";
  const userName = authUser?.user_metadata?.full_name || authUser?.email?.split("@")[0] || "Team member";

  const notify = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setNotice(""), 3600);
  }, []);

  // Keep the UI connected to the actual Supabase session, not browser-only demo login.
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setAuthMessage(error.message);
      setAuthUser(data?.session?.user || null);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
      setAuthReady(true);
      setAuthMessage("");
    });
    return () => {
      alive = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  // Load the signed-in user's company, projects, and reports from Supabase.
  useEffect(() => {
    let alive = true;
    async function loadWorkspace() {
      if (!authUser?.id) {
        setCompanyId(null);
        setCompanyRole("");
        setCompany(EMPTY_COMPANY);
        setProjects([]);
        setReports([]);
        setWorkspaceLoading(false);
        setWorkspaceError("");
        return;
      }

      setWorkspaceLoading(true);
      setWorkspaceError("");
      setCompanyId(null);
      setCompanyRole("");
      setCompany(EMPTY_COMPANY);
      setProjects([]);
      setReports([]);
      try {
        let membershipQuery = await supabase
          .from("company_members")
          .select("company_id, role, created_at")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: true });
        if (membershipQuery.error) throw membershipQuery.error;

        let memberships = membershipQuery.data || [];
        const metadataCompany = String(authUser.user_metadata?.company_name || "").trim();
        // New signups include company name in user metadata; create the owner workspace once.
        if (!memberships.length && metadataCompany) {
          const createResult = await supabase.rpc("create_company", { company_name: metadataCompany });
          if (createResult.error) throw createResult.error;
          membershipQuery = await supabase
            .from("company_members")
            .select("company_id, role, created_at")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: true });
          if (membershipQuery.error) throw membershipQuery.error;
          memberships = membershipQuery.data || [];
        }

        if (!alive) return;
        if (!memberships.length) {
          setCompanyId(null);
          setCompanyRole("");
          setCompany(EMPTY_COMPANY);
          setProjects([]);
          setReports([]);
          setPage("company");
          setWorkspaceLoading(false);
          return;
        }

        const membership = memberships[0];
        setCompanyId(membership.company_id);
        setCompanyRole(membership.role || "engineer");

        const companyResult = await supabase
          .from("companies")
          .select("id, name, phone, email, address, owner_id")
          .eq("id", membership.company_id)
          .maybeSingle();
        if (companyResult.error && !["PGRST116", "42501"].includes(companyResult.error.code)) {
          throw companyResult.error;
        }
        const companyRow = companyResult.data;
        if (companyRow) {
          setCompany({
            id: companyRow.id,
            name: companyRow.name || "",
            phone: companyRow.phone || "",
            email: companyRow.email || "",
            address: companyRow.address || ""
          });
        } else {
          setCompany({ ...EMPTY_COMPANY, id: membership.company_id, name: "Company workspace" });
        }

        const projectResult = await supabase
          .from("projects")
          .select("id, company_id, name, description, project_code, client, location, created_at")
          .eq("company_id", membership.company_id)
          .order("created_at", { ascending: false });
        if (projectResult.error) throw projectResult.error;
        const projectRows = (projectResult.data || []).map(toProject);
        if (!alive) return;
        setProjects(projectRows);

        const projectMap = Object.fromEntries(projectRows.map(project => [project.id, project]));
        const reportResult = await supabase
          .from("daily_reports")
          .select("id, project_id, created_by, report_date, work_description, workers_count, materials_used, issues, project_code, engineer, weather, start_time, end_time, labour, equipment, notes, photos, created_at")
          .order("report_date", { ascending: false });
        if (reportResult.error) throw reportResult.error;
        if (!alive) return;
        setReports((reportResult.data || []).map(row => toReport(row, projectMap)));
      } catch (error) {
        if (alive) {
          setWorkspaceError(error?.message || "Workspace load nahi ho saka.");
          setProjects([]);
          setReports([]);
        }
      } finally {
        if (alive) setWorkspaceLoading(false);
      }
    }
    loadWorkspace();
    return () => { alive = false; };
  }, [authUser?.id, workspaceRefresh]);

  const recentReports = useMemo(() => [...reports]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5), [reports]);

  const filteredProjects = useMemo(() => {
    const search = projectSearch.toLowerCase().trim();
    return projects.filter(project => !search || [project.name, project.code, project.client, project.location]
      .some(value => String(value || "").toLowerCase().includes(search)));
  }, [projects, projectSearch]);

  const filteredReports = useMemo(() => {
    const search = reportSearch.toLowerCase().trim();
    return reports.filter(report => !search || [report.projectName, report.projectCode, report.engineer, report.workDone, report.date]
      .some(value => String(value || "").toLowerCase().includes(search)));
  }, [reports, reportSearch]);

  const reportCountThisMonth = useMemo(() => {
    const now = new Date();
    return reports.filter(report => {
      if (!report.date) return false;
      const date = new Date(`${report.date}T12:00:00`);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }, [reports]);

  async function submitAuth(event) {
    event.preventDefault();
    setAuthMessage("");
    const email = authForm.email.trim().toLowerCase();
    if (!email || !authForm.password) {
      setAuthMessage("Email aur password enter karo.");
      return;
    }
    if (authMode === "signup" && (!authForm.name.trim() || !authForm.company.trim())) {
      setAuthMessage("Apna naam aur company ka naam bhi enter karo.");
      return;
    }
    setAuthBusy(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: authForm.password,
          options: { data: { full_name: authForm.name.trim(), company_name: authForm.company.trim() } }
        });
        if (error) throw error;
        if (!data.session) {
          setAuthMode("login");
          setAuthMessage("Account signup ho gaya. Apni email verify karo, phir login karo.");
        } else {
          setAuthMessage("Account create ho gaya. Workspace load ho raha hai...");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: authForm.password });
        if (error) throw error;
      }
    } catch (error) {
      setAuthMessage(error?.message || "Login/Signup complete nahi hua.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) notify(error.message);
    else {
      setPage("dashboard");
      setProjectForm(EMPTY_PROJECT);
      setReportForm(EMPTY_REPORT);
      notify("You have been signed out.");
    }
  }

  async function createWorkspace(event) {
    event.preventDefault();
    const name = companySetupName.trim();
    if (!name) return notify("Company ka naam enter karo.");
    setSaving(true);
    try {
      const { error } = await supabase.rpc("create_company", { company_name: name });
      if (error) throw error;
      setCompanySetupName("");
      setWorkspaceRefresh(value => value + 1);
      notify("Company workspace create ho gaya.");
    } catch (error) {
      notify(error?.message || "Company create nahi ho saki.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCompany(event) {
    event.preventDefault();
    if (!companyId) return notify("Pehle company workspace create karo.");
    if (!isAdmin) return notify("Company profile sirf owner/admin update kar sakta hai.");
    if (!company.name.trim()) return notify("Company name zaroori hai.");
    setSaving(true);
    try {
      const payload = {
        name: company.name.trim(), phone: company.phone.trim(),
        email: company.email.trim(), address: company.address.trim()
      };
      const { error } = await supabase.from("companies").update(payload).eq("id", companyId);
      if (error) throw error;
      notify("Company profile database mein save ho gaya.");
    } catch (error) {
      notify(error?.message || "Company profile save nahi hua.");
    } finally {
      setSaving(false);
    }
  }

  function resetProjectForm() { setProjectForm(EMPTY_PROJECT); }

  async function saveProject(event) {
    event.preventDefault();
    if (!companyId) return notify("Company workspace missing hai.");
    if (!isAdmin) return notify("Project create/edit karne ke liye owner/admin permission chahiye.");
    if (!projectForm.name.trim()) return notify("Project name zaroori hai.");
    setSaving(true);
    try {
      const payload = {
        company_id: companyId,
        name: projectForm.name.trim(),
        project_code: projectForm.code.trim() || null,
        client: projectForm.client.trim() || null,
        location: projectForm.location.trim() || null,
        description: projectForm.description.trim() || null,
        created_by: authUser.id
      };
      let query;
      if (projectForm.id) {
        const { created_by, company_id, ...updatePayload } = payload;
        query = await supabase.from("projects").update(updatePayload).eq("id", projectForm.id).select().single();
      } else {
        query = await supabase.from("projects").insert(payload).select().single();
      }
      if (query.error) throw query.error;
      const saved = toProject(query.data);
      setProjects(prev => projectForm.id ? prev.map(item => item.id === saved.id ? saved : item) : [saved, ...prev]);
      setShowProjectForm(false);
      resetProjectForm();
      notify(projectForm.id ? "Project updated." : "Project saved to database.");
    } catch (error) {
      notify(error?.message || "Project save nahi hua.");
    } finally {
      setSaving(false);
    }
  }

  function editProject(project) {
    setProjectForm({ id: project.id, name: project.name, code: project.code, client: project.client, location: project.location, description: project.description || "" });
    setShowProjectForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProject(id) {
    if (!isAdmin) return notify("Project delete permission nahi hai.");
    if (!window.confirm("Delete this project? Reports linked to it may prevent deletion.")) return;
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      setProjects(prev => prev.filter(project => project.id !== id));
      notify("Project deleted.");
    } catch (error) {
      notify(error?.message || "Project delete nahi hua. Is project ke reports pehle remove karne par sakte hain.");
    }
  }

  function openNewReport() {
    setEditingReportId(null);
    setReportForm({ ...EMPTY_REPORT, engineer: userName, projectId: projects[0]?.id || "", projectName: projects[0]?.name || "", projectCode: projects[0]?.code || "" });
    setPage("reports");
  }

  function updateReportField(field, value) {
    setReportForm(previous => ({ ...previous, [field]: value }));
  }

  function changeReportProject(projectId) {
    const project = projects.find(item => item.id === projectId);
    setReportForm(previous => ({
      ...previous,
      projectId,
      projectName: project?.name || "",
      projectCode: project?.code || ""
    }));
  }

  function editReport(report) {
    setEditingReportId(report.id);
    setReportForm({ ...EMPTY_REPORT, ...report, photos: Array.isArray(report.photos) ? report.photos : [] });
    setPage("reports");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function compressPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Photo read nahi hua: ${file.name}`));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error(`Photo open nahi hua: ${file.name}`));
        image.onload = () => {
          const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) return reject(new Error("Photo compression available nahi hai."));
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.76));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotos(event) {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith("image/")).slice(0, 8);
    event.target.value = "";
    if (!files.length) return;
    try {
      const compressed = await Promise.all(files.map(compressPhoto));
      setReportForm(previous => ({ ...previous, photos: [...previous.photos, ...compressed].slice(0, 8) }));
      notify("Site photos attached.");
    } catch (error) {
      notify(error?.message || "Photo attach nahi ho saki.");
    }
  }

  function startVoice(field) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return notify("Voice typing is not supported by this browser.");
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = event => {
      const spoken = event.results?.[0]?.[0]?.transcript || "";
      setReportForm(previous => ({ ...previous, [field]: previous[field] ? `${previous[field]} ${spoken}` : spoken }));
    };
    recognition.onerror = () => notify("Voice input start nahi ho saka.");
    recognition.start();
  }

  async function saveReport(event) {
    event.preventDefault();
    if (!companyId) return notify("Company workspace missing hai.");
    if (!reportForm.projectId) return notify("Pehle Projects section mein project create karo, phir report banao.");
    if (!reportForm.workDone.trim()) return notify("Work Completed field fill karo.");
    setSaving(true);
    try {
      const payload = {
        project_id: reportForm.projectId,
        created_by: authUser.id,
        report_date: reportForm.date || new Date().toISOString().slice(0, 10),
        work_description: reportForm.workDone.trim(),
        workers_count: 0,
        materials_used: reportForm.materials.trim() || null,
        issues: reportForm.issues.trim() || null,
        project_code: reportForm.projectCode.trim() || null,
        engineer: reportForm.engineer.trim() || userName,
        weather: reportForm.weather.trim() || null,
        start_time: reportForm.startTime || null,
        end_time: reportForm.endTime || null,
        labour: reportForm.labour.trim() || null,
        equipment: reportForm.equipment.trim() || null,
        notes: reportForm.notes.trim() || null,
        photos: reportForm.photos
      };
      let result;
      if (editingReportId) {
        const { created_by, ...updatePayload } = payload;
        result = await supabase.from("daily_reports").update(updatePayload).eq("id", editingReportId).select().single();
      } else {
        result = await supabase.from("daily_reports").insert(payload).select().single();
      }
      if (result.error) throw result.error;
      const selectedProject = projects.find(project => project.id === reportForm.projectId);
      const normalized = toReport(result.data, selectedProject ? { [selectedProject.id]: selectedProject } : {});
      setReports(previous => editingReportId
        ? previous.map(report => report.id === editingReportId ? normalized : report)
        : [normalized, ...previous]);
      setEditingReportId(null);
      setReportForm({ ...EMPTY_REPORT, engineer: userName, projectId: projects[0]?.id || "", projectName: projects[0]?.name || "", projectCode: projects[0]?.code || "" });
      notify(editingReportId ? "Daily report updated." : "Daily report saved to database.");
    } catch (error) {
      notify(error?.message || "Daily report save nahi hua.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteReport(report) {
    if (!window.confirm("Delete this daily report?")) return;
    try {
      const { error } = await supabase.from("daily_reports").delete().eq("id", report.id);
      if (error) throw error;
      setReports(previous => previous.filter(item => item.id !== report.id));
      notify("Report deleted.");
    } catch (error) {
      notify(error?.message || "Report delete nahi hua. Database permission check karo.");
    }
  }

  function generatePDF(report) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 18;
    const maxWidth = 174;
    let y = 18;
    const pageHeight = 282;
    const addText = (value, size = 10, style = "normal", color = [42, 51, 64]) => {
      doc.setFont("helvetica", style);
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(String(value || "-"), maxWidth);
      lines.forEach(line => {
        if (y > pageHeight) { doc.addPage(); y = 18; }
        doc.text(line, margin, y);
        y += size >= 16 ? 8 : 5.5;
      });
    };
    doc.setFillColor(12, 22, 35);
    doc.rect(0, 0, 210, 42, "F");
    doc.setTextColor(255, 219, 145);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.text("SITELOG AI", margin, 19);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(company.name || "Construction Site Management", margin, 29);
    doc.setFontSize(15);
    doc.text("DAILY SITE REPORT", 210 - margin, 19, { align: "right" });
    y = 53;
    addText("PROJECT DETAILS", 12, "bold", [161, 105, 22]);
    addText(`Project: ${report.projectName}`);
    addText(`Project Code: ${report.projectCode || "-"}`);
    addText(`Engineer: ${report.engineer || "-"}`);
    addText(`Date: ${dateLabel(report.date)}`);
    addText(`Weather: ${report.weather || "-"}`);
    addText(`Working Hours: ${report.startTime || "-"} to ${report.endTime || "-"}`);
    const sections = [
      ["WORK COMPLETED", report.workDone], ["LABOUR", report.labour],
      ["MATERIALS", report.materials], ["EQUIPMENT", report.equipment],
      ["ISSUES / DELAYS", report.issues], ["NOTES", report.notes]
    ];
    sections.forEach(([heading, value]) => {
      y += 3;
      if (y > pageHeight - 15) { doc.addPage(); y = 18; }
      addText(heading, 11, "bold", [161, 105, 22]);
      addText(value || "-");
    });
    if (company.phone || company.email || company.address) {
      y += 6;
      addText("COMPANY CONTACT", 11, "bold", [161, 105, 22]);
      [company.phone, company.email, company.address].filter(Boolean).forEach(line => addText(line, 9));
    }
    const safeName = String(report.projectName || "Report").replace(/[^a-z0-9-_]+/gi, "-").slice(0, 45);
    doc.save(`SITELOG-${safeName}-${report.date || "Report"}.pdf`);
  }

  function shareReport(report) {
    const text = `${company.name || "SITELOG AI"} — Daily Site Report\nProject: ${report.projectName}\nProject Code: ${report.projectCode || "-"}\nDate: ${dateLabel(report.date)}\nEngineer: ${report.engineer || "-"}\nWeather: ${report.weather || "-"}\n\nWork Completed:\n${report.workDone || "-"}\n\nLabour: ${report.labour || "-"}\nMaterials: ${report.materials || "-"}\nIssues: ${report.issues || "-"}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  function navigate(target) {
    setPage(target);
    setNotice("");
  }

  if (!authReady || (authUser && workspaceLoading)) {
    return <div className="login-wrap"><div className="login-card"><div className="login-brand"><div className="brand-mark">S</div><div><h1>SITELOG AI</h1><p>Construction management workspace</p></div></div><div className="empty"><RefreshCw size={24} className="spin-icon" /><p>Secure workspace load ho raha hai...</p></div></div></div>;
  }

  if (!authUser) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-mark">S</div>
            <div><h1>SITELOG AI</h1><p>Construction Site Management</p></div>
          </div>
          <div className="auth-kicker"><ShieldCheck size={15} /> Secure company workspace</div>
          <h2>{authMode === "signup" ? "Build your workspace" : "Welcome back"}</h2>
          <p>{authMode === "signup" ? "Apni construction company, projects aur site reports aik jagah manage karein." : "Apne secure SITELOG AI account mein login karein."}</p>
          <form className="login-form" onSubmit={submitAuth}>
            {authMode === "signup" && <>
              <div className="field"><label>Full name</label><input required autoComplete="name" value={authForm.name} onChange={event => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Your full name" /></div>
              <div className="field"><label>Company name</label><input required autoComplete="organization" value={authForm.company} onChange={event => setAuthForm({ ...authForm, company: event.target.value })} placeholder="Construction company" /></div>
            </>}
            <div className="field"><label>Email address</label><input required type="email" autoComplete="email" value={authForm.email} onChange={event => setAuthForm({ ...authForm, email: event.target.value })} placeholder="you@company.com" /></div>
            <div className="field"><label>Password</label><input required minLength={6} type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={authForm.password} onChange={event => setAuthForm({ ...authForm, password: event.target.value })} placeholder="At least 6 characters" /></div>
            {authMessage && <div className="inline-message" role="status">{authMessage}</div>}
            <button className="btn btn-primary" type="submit" disabled={authBusy}>{authBusy ? <RefreshCw size={17} /> : authMode === "signup" ? <UserPlus size={17} /> : <LogIn size={17} />}{authBusy ? "Please wait..." : authMode === "signup" ? "Create company account" : "Login securely"}</button>
          </form>
          <div className="auth-switch">{authMode === "signup" ? "Already have an account?" : "New to SITELOG AI?"}<button type="button" className="text-button" onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthMessage(""); }}>{authMode === "signup" ? "Login" : "Create account"}</button></div>
          <div className="security-foot"><ShieldCheck size={14} /> Your data is connected to your Supabase account.</div>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-brand"><div className="brand-mark">S</div><div><h1>Set up your workspace</h1><p>One company workspace for your project team.</p></div></div>
          {workspaceError && <div className="inline-message">{workspaceError}</div>}
          <form className="login-form" onSubmit={createWorkspace}>
            <div className="field"><label>Company name</label><input required value={companySetupName} onChange={event => setCompanySetupName(event.target.value)} placeholder="Your construction company" /></div>
            <button className="btn btn-primary" type="submit" disabled={saving}><Building2 size={17} />{saving ? "Creating workspace..." : "Create company workspace"}</button>
          </form>
          <button className="btn btn-dark" type="button" onClick={logout}><LogOut size={16} />Sign out</button>
        </div>
      </div>
    );
  }

  const pageTitles = {
    dashboard: ["Overview", "A clear picture of your active construction work."],
    projects: ["Projects", "Plan, track and organise your construction projects."],
    reports: ["Daily site reports", "Capture work progress and keep site records organised."],
    company: ["Company profile", "Manage the company details used on your site reports."]
  };
  const [pageTitle, pageSubtitle] = pageTitles[page] || pageTitles.dashboard;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-copy"><strong>SITELOG AI</strong><span>Construction operations</span></div>
        </div>
        <div className="topbar-actions">
          <span className="user-chip"><span className="avatar-mini">{shortName(userName)}</span><span>{userName}</span></span>
          <button className="btn btn-dark btn-small" onClick={logout}><LogOut size={16} />Sign out</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="nav-label">WORKSPACE</div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-btn ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}><Icon size={19} /><span>{item.label}</span>{page === item.id && <ChevronRight className="nav-chevron" size={15} />}</button>;
          })}
          <div className="sidebar-company card card-pad">
            <div className="company-symbol"><HardHat size={19} /></div>
            <div className="sidebar-company-copy"><strong>{company.name || "Company workspace"}</strong><span>{companyRole || "Team member"}</span></div>
            <CheckCircle2 size={16} className="connected-mark" />
          </div>
          <div className="sidebar-footer"><ShieldCheck size={14} /> Secure cloud workspace</div>
        </aside>

        <main className="main">
          <div className="page-head">
            <div><div className="eyebrow"><Activity size={14} /> SITE OPERATIONS</div><h1 className="page-title">{pageTitle}</h1><p className="page-subtitle">{pageSubtitle}</p></div>
            <div className="actions">
              {page === "dashboard" && <button className="btn btn-primary" onClick={openNewReport}><Plus size={17} />New daily report</button>}
              {page === "projects" && isAdmin && <button className="btn btn-primary" onClick={() => { resetProjectForm(); setShowProjectForm(true); }}><Plus size={17} />Add project</button>}
              {page === "reports" && <button className="btn btn-primary" onClick={openNewReport}><Plus size={17} />New report</button>}
            </div>
          </div>

          {workspaceError && <div className="inline-message workspace-error"><Activity size={16} />{workspaceError}<button className="text-button" onClick={() => setWorkspaceRefresh(value => value + 1)}>Retry</button></div>}

          {page === "dashboard" && <>
            <div className="welcome-panel card">
              <div className="welcome-content"><div className="welcome-label"><span className="live-dot" /> YOUR WORKSPACE IS READY</div><h2>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {userName.split(" ")[0]}.</h2><p>Keep projects moving with organised site updates, daily records and shareable reports.</p><div className="welcome-meta"><span><Building2 size={15} />{company.name || "Company workspace"}</span><span><CalendarDays size={15} />{new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span></div></div>
              <div className="welcome-art" aria-hidden="true"><div className="art-sun" /><div className="art-building building-one"><span /><span /><span /><span /></div><div className="art-building building-two"><span /><span /><span /></div><div className="art-ground" /><div className="art-label"><HardHat size={16} /> SITE INTELLIGENCE</div></div>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon"><FolderKanban size={21} /></div><div className="stat-label">Total projects</div><div className="stat-value">{projects.length}</div><div className="stat-foot"><span>In your workspace</span><ArrowUpRight size={15} /></div></div>
              <div className="stat-card"><div className="stat-icon"><FileText size={21} /></div><div className="stat-label">Daily reports</div><div className="stat-value">{reports.length}</div><div className="stat-foot"><span>Saved in the cloud</span><ArrowUpRight size={15} /></div></div>
              <div className="stat-card"><div className="stat-icon"><CalendarDays size={21} /></div><div className="stat-label">This month</div><div className="stat-value">{reportCountThisMonth}</div><div className="stat-foot"><span>Reports this month</span><ArrowUpRight size={15} /></div></div>
              <div className="stat-card"><div className="stat-icon"><ShieldCheck size={21} /></div><div className="stat-label">Workspace status</div><div className="stat-value status-value">Connected</div><div className="stat-foot"><span>Supabase cloud sync</span><CheckCircle2 size={15} /></div></div>
            </div>

            <div className="grid two-col dashboard-grid">
              <section className="card card-pad">
                <div className="section-title"><div><h3>Recent daily reports</h3><p>Latest updates recorded by your site team.</p></div><button className="btn btn-dark btn-small" onClick={() => navigate("reports")}>View all <ChevronRight size={14} /></button></div>
                {recentReports.length ? <div className="list">{recentReports.map(report => <div className="list-row" key={report.id}><div className="list-main"><div className="list-icon"><FileText size={17} /></div><div><div className="list-title">{report.projectName}</div><div className="list-meta">{dateLabel(report.date)} <span>•</span> {report.engineer || "Engineer not listed"}</div></div></div><div className="list-end"><span className="badge badge-green">Saved</span><button className="icon-action" aria-label="Edit report" onClick={() => editReport(report)}><Edit3 size={16} /></button></div></div>)}</div> : <div className="empty"><FileText size={30} /><h3>No site reports yet</h3><p>Your saved reports will appear here.</p><button className="btn btn-primary btn-small" onClick={openNewReport}><Plus size={15} />Create first report</button></div>}
              </section>
              <section className="card card-pad quick-panel">
                <div className="section-title"><div><h3>Quick actions</h3><p>Common tasks in one place.</p></div></div>
                <button className="quick-action" onClick={() => { navigate("projects"); setShowProjectForm(isAdmin); }}><span className="quick-icon"><FolderKanban size={19} /></span><span><strong>Create a project</strong><small>Set up a new site or contract</small></span><ChevronRight size={17} /></button>
                <button className="quick-action" onClick={openNewReport}><span className="quick-icon"><FileText size={19} /></span><span><strong>Record site progress</strong><small>Prepare today's daily report</small></span><ChevronRight size={17} /></button>
                <button className="quick-action" onClick={() => navigate("company")}><span className="quick-icon"><Building2 size={19} /></span><span><strong>Company details</strong><small>Update report branding details</small></span><ChevronRight size={17} /></button>
                <div className="sync-note"><CheckCircle2 size={16} /><span><strong>Cloud-connected workspace</strong><small>Data access is controlled by your signed-in account and database policies.</small></span></div>
              </section>
            </div>
          </>}

          {page === "projects" && <>
            {showProjectForm && <section className="card card-pad form-card">
              <div className="section-title"><div><h3>{projectForm.id ? "Edit project details" : "Create a project"}</h3><p>Enter the core information for this construction site.</p></div><button className="icon-action" aria-label="Close project form" onClick={() => { setShowProjectForm(false); resetProjectForm(); }}><X size={18} /></button></div>
              {!isAdmin && <div className="inline-message">Only company owners and admins can create or edit projects.</div>}
              <form onSubmit={saveProject}>
                <div className="form-grid">
                  <div className="field"><label>Project name *</label><input required value={projectForm.name} onChange={event => setProjectForm({ ...projectForm, name: event.target.value })} placeholder="e.g. North Riyadh Villa" /></div>
                  <div className="field"><label>Project code</label><input value={projectForm.code} onChange={event => setProjectForm({ ...projectForm, code: event.target.value })} placeholder="e.g. PRJ-001" /></div>
                  <div className="field"><label>Client</label><input value={projectForm.client} onChange={event => setProjectForm({ ...projectForm, client: event.target.value })} placeholder="Client or developer" /></div>
                  <div className="field"><label>Location</label><input value={projectForm.location} onChange={event => setProjectForm({ ...projectForm, location: event.target.value })} placeholder="City, district or site address" /></div>
                  <div className="field full"><label>Project description</label><textarea rows="3" value={projectForm.description || ""} onChange={event => setProjectForm({ ...projectForm, description: event.target.value })} placeholder="Scope or notes about this project..." /></div>
                </div>
                <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving || !isAdmin}><Save size={16} />{saving ? "Saving..." : projectForm.id ? "Save changes" : "Save project"}</button><button className="btn btn-dark" type="button" onClick={() => { setShowProjectForm(false); resetProjectForm(); }}>Cancel</button></div>
              </form>
            </section>}
            <section className="card card-pad">
              <div className="section-title"><div><h3>Project portfolio</h3><p>{projects.length} project{projects.length === 1 ? "" : "s"} available in this workspace.</p></div><div className="search-control"><Activity size={16} /><input value={projectSearch} onChange={event => setProjectSearch(event.target.value)} placeholder="Search projects" aria-label="Search projects" /></div></div>
              {filteredProjects.length ? <div className="project-grid grid three-col">{filteredProjects.map(project => <article className="card project-tile" key={project.id}><div className="project-tile-head"><div className="project-icon"><HardHat size={21} /></div><span className="badge">{project.code || "NO CODE"}</span></div><h3>{project.name}</h3><p className="project-desc">{project.description || "Construction project workspace and daily site records."}</p><div className="project-details"><div><Users size={14} /><span>{project.client || "Client not set"}</span></div><div><MapPin size={14} /><span>{project.location || "Location not set"}</span></div></div><div className="project-tile-actions"><button className="btn btn-dark btn-small" onClick={() => { setReportForm({ ...EMPTY_REPORT, projectId: project.id, projectName: project.name, projectCode: project.code, engineer: userName }); setEditingReportId(null); navigate("reports"); }}><FileText size={15} />New report</button>{isAdmin && <button className="btn btn-dark btn-small" onClick={() => editProject(project)}><Edit3 size={15} />Edit</button>}{isAdmin && <button className="btn btn-danger btn-small" aria-label={`Delete ${project.name}`} onClick={() => deleteProject(project.id)}><Trash2 size={15} /></button>}</div></article>)}</div> : <div className="empty"><FolderKanban size={34} /><h3>{projectSearch ? "No matching projects" : "No projects created"}</h3><p>{projectSearch ? "Try another project name, client or location." : "Create your first project to start logging site reports."}</p>{isAdmin && <button className="btn btn-primary btn-small" onClick={() => setShowProjectForm(true)}><Plus size={15} />Add first project</button>}</div>}
            </section>
          </>}

          {page === "reports" && <>
            <section className="card card-pad form-card">
              <div className="section-title"><div><h3>{editingReportId ? "Edit daily report" : "Daily site report"}</h3><p>Record work completed, resources used, site conditions and delays.</p></div>{editingReportId && <button className="btn btn-dark btn-small" type="button" onClick={() => { setEditingReportId(null); setReportForm(EMPTY_REPORT); }}><X size={15} />Cancel edit</button>}</div>
              {!projects.length && <div className="inline-message"><FolderKanban size={16} /> No projects available. Create a project first to attach this report to the correct site.</div>}
              <form onSubmit={saveReport}>
                <div className="form-grid form-grid-3">
                  <div className="field"><label>Project *</label><select required value={reportForm.projectId} onChange={event => changeReportProject(event.target.value)}><option value="">Select project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}{project.code ? ` (${project.code})` : ""}</option>)}</select></div>
                  <div className="field"><label>Site engineer</label><input value={reportForm.engineer} onChange={event => updateReportField("engineer", event.target.value)} placeholder="Engineer name" /></div>
                  <div className="field"><label>Report date *</label><input required type="date" value={reportForm.date} onChange={event => updateReportField("date", event.target.value)} /></div>
                  <div className="field"><label>Weather</label><select value={reportForm.weather} onChange={event => updateReportField("weather", event.target.value)}><option value="">Select weather</option><option>Sunny</option><option>Hot</option><option>Cloudy</option><option>Windy</option><option>Rain</option><option>Dusty</option></select></div>
                  <div className="field"><label>Start time</label><input type="time" value={reportForm.startTime} onChange={event => updateReportField("startTime", event.target.value)} /></div>
                  <div className="field"><label>End time</label><input type="time" value={reportForm.endTime} onChange={event => updateReportField("endTime", event.target.value)} /></div>
                </div>
                <div className="field full report-textarea"><div className="field-heading"><label>Work completed *</label><button className="voice-action" type="button" onClick={() => startVoice("workDone")}><Mic size={14} />Voice input</button></div><textarea required rows="4" value={reportForm.workDone} onChange={event => updateReportField("workDone", event.target.value)} placeholder="Describe today's completed work, quantities and milestones..." /></div>
                <div className="form-grid form-grid-3">
                  <div className="field"><div className="field-heading"><label>Labour / manpower</label><button className="voice-action" type="button" onClick={() => startVoice("labour")}><Mic size={13} /></button></div><textarea rows="3" value={reportForm.labour} onChange={event => updateReportField("labour", event.target.value)} placeholder="e.g. 8 masons, 4 helpers" /></div>
                  <div className="field"><div className="field-heading"><label>Materials</label><button className="voice-action" type="button" onClick={() => startVoice("materials")}><Mic size={13} /></button></div><textarea rows="3" value={reportForm.materials} onChange={event => updateReportField("materials", event.target.value)} placeholder="Materials received or used" /></div>
                  <div className="field"><div className="field-heading"><label>Equipment</label><button className="voice-action" type="button" onClick={() => startVoice("equipment")}><Mic size={13} /></button></div><textarea rows="3" value={reportForm.equipment} onChange={event => updateReportField("equipment", event.target.value)} placeholder="Equipment on site" /></div>
                  <div className="field"><div className="field-heading"><label>Issues / delays</label><button className="voice-action" type="button" onClick={() => startVoice("issues")}><Mic size={13} /></button></div><textarea rows="3" value={reportForm.issues} onChange={event => updateReportField("issues", event.target.value)} placeholder="Safety issues, blockers or delays" /></div>
                  <div className="field"><div className="field-heading"><label>Additional notes</label><button className="voice-action" type="button" onClick={() => startVoice("notes")}><Mic size={13} /></button></div><textarea rows="3" value={reportForm.notes} onChange={event => updateReportField("notes", event.target.value)} placeholder="Instructions and follow-up" /></div>
                  <div className="field"><label>Site photos</label><label className="upload-tile"><Camera size={20} /><strong>Add site photos</strong><small>Up to 8 images; compressed for easier saving</small><input type="file" accept="image/*" multiple onChange={handlePhotos} /></label></div>
                </div>
                {reportForm.photos.length > 0 && <div className="photo-grid">{reportForm.photos.map((photo, index) => <div className="photo-item" key={`${index}-${photo.slice(0, 22)}`}><img src={photo} alt={`Site photograph ${index + 1}`} /><button type="button" aria-label="Remove photo" onClick={() => updateReportField("photos", reportForm.photos.filter((_, photoIndex) => photoIndex !== index))}><X size={15} /></button></div>)}</div>}
                <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving || !projects.length}><Save size={16} />{saving ? "Saving report..." : editingReportId ? "Update report" : "Save daily report"}</button><button className="btn btn-dark" type="button" onClick={() => { setEditingReportId(null); setReportForm({ ...EMPTY_REPORT, engineer: userName, projectId: projects[0]?.id || "", projectName: projects[0]?.name || "", projectCode: projects[0]?.code || "" }); }}>Clear form</button></div>
              </form>
            </section>
            <section className="card card-pad">
              <div className="section-title"><div><h3>Saved reports</h3><p>{reports.length} daily report{reports.length === 1 ? "" : "s"} stored in the cloud.</p></div><div className="search-control"><Activity size={16} /><input value={reportSearch} onChange={event => setReportSearch(event.target.value)} placeholder="Search reports" aria-label="Search reports" /></div></div>
              {filteredReports.length ? <div className="report-library">{filteredReports.map(report => <article className="card report-card" key={report.id}><div className="report-head"><div><div className="report-title">{report.projectName}</div><div className="report-date"><CalendarDays size={13} /> {dateLabel(report.date)} <span>•</span> {report.engineer || "No engineer"}</div><p className="report-summary">{report.workDone || "No work description entered."}</p></div><span className="badge badge-green"><CheckCircle2 size={13} /> Cloud saved</span></div><div className="report-facts"><span><CloudSun size={14} />{report.weather || "Weather not set"}</span><span><Clock3 size={14} />{report.startTime || "--:--"} – {report.endTime || "--:--"}</span><span><Camera size={14} />{report.photos.length} photo{report.photos.length === 1 ? "" : "s"}</span></div><div className="report-actions"><button className="btn btn-dark btn-small" onClick={() => editReport(report)}><Edit3 size={15} />Edit</button><button className="btn btn-dark btn-small" onClick={() => generatePDF(report)}><Download size={15} />PDF</button><button className="btn btn-dark btn-small" onClick={() => shareReport(report)}><Share2 size={15} />WhatsApp</button><button className="btn btn-danger btn-small" onClick={() => deleteReport(report)}><Trash2 size={15} />Delete</button></div></article>)}</div> : <div className="empty"><FileText size={32} /><h3>{reportSearch ? "No matching reports" : "No reports saved yet"}</h3><p>{reportSearch ? "Try a different search." : "Complete the form above and save a daily site report."}</p></div>}
            </section>
          </>}

          {page === "company" && <>
            {!isAdmin && <div className="inline-message"><ShieldCheck size={16} /> Company profile editing is restricted to company owners and admins. Your account role is <strong>{companyRole || "team member"}</strong>.</div>}
            <div className="grid two-col company-layout">
              <section className="card card-pad">
                <div className="section-title"><div><h3>Company information</h3><p>These details can be added to generated PDF reports.</p></div><div className="company-large-icon"><Building2 size={24} /></div></div>
                <form onSubmit={saveCompany}>
                  <div className="form-grid">
                    <div className="field full"><label>Company name *</label><input required disabled={!isAdmin} value={company.name} onChange={event => setCompany({ ...company, name: event.target.value })} placeholder="Your construction company" /></div>
                    <div className="field"><label>Business phone</label><input disabled={!isAdmin} value={company.phone} onChange={event => setCompany({ ...company, phone: event.target.value })} placeholder="+966..." /></div>
                    <div className="field"><label>Business email</label><input disabled={!isAdmin} type="email" value={company.email} onChange={event => setCompany({ ...company, email: event.target.value })} placeholder="office@company.com" /></div>
                    <div className="field full"><label>Company address</label><textarea disabled={!isAdmin} rows="3" value={company.address} onChange={event => setCompany({ ...company, address: event.target.value })} placeholder="Office address or registered location" /></div>
                  </div>
                  <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving || !isAdmin}><Save size={16} />{saving ? "Saving..." : "Save company profile"}</button></div>
                </form>
              </section>
              <section className="card card-pad company-summary">
                <div className="section-title"><div><h3>Workspace details</h3><p>Account and access status.</p></div></div>
                <div className="company-profile-mark"><div className="brand-mark">{shortName(company.name)}</div><div><strong>{company.name || "Company workspace"}</strong><span>Construction workspace</span></div></div>
                <div className="detail-line"><span>Signed-in user</span><strong>{authUser.email}</strong></div>
                <div className="detail-line"><span>Workspace role</span><strong className="role-pill">{companyRole || "Team member"}</strong></div>
                <div className="detail-line"><span>Projects</span><strong>{projects.length}</strong></div>
                <div className="detail-line"><span>Reports</span><strong>{reports.length}</strong></div>
                <div className="security-note"><ShieldCheck size={18} /><div><strong>Access-controlled cloud data</strong><p>Company, project and report access is enforced by Supabase policies. Team invitations and per-project assignment need a separate setup before use.</p></div></div>
              </section>
            </div>
          </>}

          <footer className="app-footer"><span>SITELOG AI <span className="footer-dot">•</span> Construction operations</span><span><ShieldCheck size={13} /> Signed in as {authUser.email}</span></footer>
        </main>
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}

export default App;
