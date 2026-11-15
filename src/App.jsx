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


const ARABIC_TEXT = {
  "Overview":"نظرة عامة","Projects":"المشاريع","Daily Reports":"التقارير اليومية","Company":"الشركة",
  "Construction operations":"إدارة الإنشاءات","Construction management workspace":"مساحة إدارة الإنشاءات",
  "Construction Site Management":"إدارة مواقع البناء","Secure company workspace":"مساحة عمل آمنة للشركة",
  "Create your SITELOG AI account":"إنشاء حساب SITELOG AI","Welcome back":"مرحباً بعودتك",
  "Choose your account type.":"اختر نوع الحساب.","Sign in to your secure SITELOG AI account.":"سجّل الدخول إلى حسابك الآمن في SITELOG AI.",
  "Company Sign Up":"تسجيل الشركة","Engineer Sign Up":"تسجيل المهندس","Full name":"الاسم الكامل","Company name":"اسم الشركة",
  "Email address":"البريد الإلكتروني","Password":"كلمة المرور","Your full name":"اكتب اسمك الكامل","Construction company":"شركة مقاولات",
  "At least 6 characters":"6 أحرف على الأقل","Please wait...":"يرجى الانتظار...","Create company account":"إنشاء حساب شركة",
  "Create engineer account":"إنشاء حساب مهندس","Login securely":"تسجيل الدخول بأمان","Already have an account?":"لديك حساب بالفعل؟",
  "New to SITELOG AI?":"جديد في SITELOG AI؟","Login":"تسجيل الدخول","Create account":"إنشاء حساب",
  "Your data is connected to your Supabase account.":"بياناتك مرتبطة بحساب Supabase الخاص بك.",
  "Set up your workspace":"إعداد مساحة العمل","One company workspace for your project team.":"مساحة شركة واحدة لفريق مشاريعك.",
  "Company workspace":"مساحة الشركة","Team member":"عضو الفريق","Sign out":"تسجيل الخروج","Create company workspace":"إنشاء مساحة الشركة",
  "WORKSPACE":"مساحة العمل","Secure cloud workspace":"مساحة عمل سحابية آمنة","SITE OPERATIONS":"عمليات الموقع",
  "New daily report":"تقرير يومي جديد","Add project":"إضافة مشروع","New report":"تقرير جديد","Retry":"إعادة المحاولة",
  "YOUR WORKSPACE IS READY":"مساحة العمل جاهزة","Good morning":"صباح الخير","Good afternoon":"مساء الخير","Good evening":"مساء الخير",
  "Keep projects moving with organised site updates, daily records and shareable reports.":"تابع مشاريعك من خلال تحديثات الموقع والسجلات اليومية والتقارير القابلة للمشاركة.",
  "SITE INTELLIGENCE":"ذكاء الموقع","Total projects":"إجمالي المشاريع","Daily reports":"التقارير اليومية","This month":"هذا الشهر",
  "Workspace status":"حالة مساحة العمل","In your workspace":"في مساحة عملك","Saved in the cloud":"محفوظة في السحابة",
  "Reports this month":"تقارير هذا الشهر","Connected":"متصل","Supabase cloud sync":"مزامنة Supabase السحابية",
  "Recent daily reports":"أحدث التقارير اليومية","Latest updates recorded by your site team.":"أحدث التحديثات المسجلة بواسطة فريق الموقع.",
  "View all":"عرض الكل","Saved":"محفوظ","Edit report":"تعديل التقرير","No site reports yet":"لا توجد تقارير للموقع بعد",
  "Your saved reports will appear here.":"ستظهر تقاريرك المحفوظة هنا.","Create first report":"إنشاء أول تقرير",
  "Quick actions":"إجراءات سريعة","Common tasks in one place.":"المهام الشائعة في مكان واحد.",
  "Create a project":"إنشاء مشروع","Set up a new site or contract":"إعداد موقع أو عقد جديد",
  "Record site progress":"تسجيل تقدم الموقع","Prepare today's daily report":"إعداد التقرير اليومي لهذا اليوم",
  "Company details":"تفاصيل الشركة","Update report branding details":"تحديث بيانات الشركة في التقارير",
  "Cloud-connected workspace":"مساحة عمل متصلة بالسحابة",
  "Data access is controlled by your signed-in account and database policies.":"يتم التحكم في الوصول إلى البيانات من خلال حسابك وسياسات قاعدة البيانات.",
  "Edit project details":"تعديل تفاصيل المشروع","Create a project":"إنشاء مشروع",
  "Enter the core information for this construction site.":"أدخل المعلومات الأساسية لموقع البناء.",
  "Close project form":"إغلاق نموذج المشروع","Only company owners and admins can create or edit projects.":"يمكن لمالك الشركة أو المسؤول فقط إنشاء المشاريع أو تعديلها.",
  "Project name *":"اسم المشروع *","Project code":"رمز المشروع","Client":"العميل","Location":"الموقع",
  "Project description":"وصف المشروع","Save changes":"حفظ التغييرات","Save project":"حفظ المشروع","Cancel":"إلغاء",
  "Project portfolio":"محفظة المشاريع","Search projects":"البحث عن المشاريع","NO CODE":"بدون رمز",
  "Construction project workspace and daily site records.":"مساحة مشروع البناء وسجلات الموقع اليومية.",
  "Client not set":"لم يتم تحديد العميل","Location not set":"لم يتم تحديد الموقع","Edit":"تعديل",
  "No matching projects":"لا توجد مشاريع مطابقة","No projects created":"لم يتم إنشاء مشاريع",
  "Try another project name, client or location.":"جرّب اسم مشروع أو عميلاً أو موقعاً آخر.",
  "Create your first project to start logging site reports.":"أنشئ مشروعك الأول لبدء تسجيل تقارير الموقع.",
  "Add first project":"إضافة أول مشروع","Edit daily report":"تعديل التقرير اليومي","Daily site report":"تقرير الموقع اليومي",
  "Record work completed, resources used, site conditions and delays.":"سجّل الأعمال المنجزة والموارد المستخدمة وظروف الموقع والتأخيرات.",
  "Cancel edit":"إلغاء التعديل","No projects available. Create a project first to attach this report to the correct site.":"لا توجد مشاريع. أنشئ مشروعاً أولاً لربط التقرير بالموقع الصحيح.",
  "Project *":"المشروع *","Site engineer":"مهندس الموقع","Report date *":"تاريخ التقرير *","Weather":"الطقس",
  "Select project":"اختر المشروع","Select weather":"اختر حالة الطقس","Sunny":"مشمس","Hot":"حار","Cloudy":"غائم",
  "Windy":"عاصف","Rain":"ممطر","Dusty":"مغبر","Start time":"وقت البدء","End time":"وقت الانتهاء",
  "Work completed *":"الأعمال المنجزة *","Voice input":"إدخال صوتي",
  "Describe today's completed work, quantities and milestones...":"صف الأعمال المنجزة اليوم والكميات ومراحل الإنجاز...",
  "Labour / manpower":"العمالة / القوى العاملة","Materials":"المواد","Equipment":"المعدات",
  "Issues / delays":"المشكلات / التأخيرات","Additional notes":"ملاحظات إضافية",
  "e.g. 8 masons, 4 helpers":"مثال: 8 بنّائين و4 مساعدين","Materials received or used":"المواد المستلمة أو المستخدمة",
  "Equipment on site":"المعدات الموجودة في الموقع","Safety issues, blockers or delays":"مشكلات السلامة أو العوائق أو التأخيرات",
  "Instructions and follow-up":"التعليمات والمتابعة","Site photos":"صور الموقع","Add site photos":"إضافة صور الموقع",
  "Up to 8 images; compressed for easier saving":"حتى 8 صور؛ يتم ضغطها لتسهيل الحفظ",
  "Remove photo":"إزالة الصورة","Saving report...":"جارٍ حفظ التقرير...","Update report":"تحديث التقرير",
  "Save daily report":"حفظ التقرير اليومي","Clear form":"مسح النموذج","Saved reports":"التقارير المحفوظة",
  "Search reports":"البحث في التقارير","Edit":"تعديل","PDF":"PDF","WhatsApp":"واتساب","Delete":"حذف",
  "No matching reports":"لا توجد تقارير مطابقة","No reports saved yet":"لم يتم حفظ تقارير بعد",
  "Try a different search.":"جرّب كلمات بحث أخرى.","Complete the form above and save a daily site report.":"أكمل النموذج أعلاه واحفظ تقرير الموقع اليومي.",
  "Company profile":"ملف الشركة","Manage the company details used on your site reports.":"إدارة بيانات الشركة المستخدمة في تقارير الموقع.",
  "Company information":"معلومات الشركة","These details can be added to generated PDF reports.":"يمكن إضافة هذه البيانات إلى تقارير PDF المُنشأة.",
  "Business phone":"هاتف الشركة","Business email":"البريد الإلكتروني للشركة","Company address":"عنوان الشركة",
  "Your construction company":"اسم شركة المقاولات","Save company profile":"حفظ ملف الشركة",
  "Invite an engineer":"دعوة مهندس","Send an email invitation and assign the engineer to one project.":"أرسل دعوة بالبريد الإلكتروني وعيّن المهندس لمشروع واحد.",
  "Engineer email *":"البريد الإلكتروني للمهندس *","Assign project *":"تعيين المشروع *","Send invitation":"إرسال الدعوة",
  "Sending invitation...":"جارٍ إرسال الدعوة...","Workspace details":"تفاصيل مساحة العمل","Account and access status.":"حالة الحساب والوصول.",
  "Construction workspace":"مساحة عمل الإنشاءات","Signed-in user":"المستخدم المسجل","Workspace role":"دور مساحة العمل",
  "Projects":"المشاريع","Reports":"التقارير","Access-controlled cloud data":"بيانات سحابية محمية",
  "Company, project and report access is enforced by Supabase policies. Engineers can access only projects assigned to their account.":"تُدار صلاحيات الشركة والمشاريع والتقارير عبر سياسات Supabase. يمكن للمهندسين الوصول إلى المشاريع المعيّنة لحساباتهم فقط.",
  "Construction operations":"عمليات الإنشاءات","Secure cloud workspace":"مساحة عمل سحابية آمنة",
  "Email":"البريد الإلكتروني","Forgot password?":"هل نسيت كلمة المرور؟","Send reset link":"إرسال رابط إعادة التعيين",
  "Password reset email sent. Check your inbox.":"تم إرسال رسالة إعادة تعيين كلمة المرور. تحقق من بريدك الوارد."
};
Object.assign(ARABIC_TEXT, {
  "Untitled project": "مشروع بدون عنوان",
  "Project report": "تقرير المشروع",
  "Date not set": "لم يتم تحديد التاريخ",
  "Engineer not listed": "لم يتم تحديد المهندس",
  "No engineer": "لا يوجد مهندس",
  "Cloud saved": "محفوظ في السحابة",
  "Weather not set": "لم يتم تحديد الطقس",
  "No work description entered.": "لم يتم إدخال وصف للعمل.",
  "Daily site reports": "تقارير الموقع اليومية",
  "Capture work progress and keep site records organised.": "سجّل تقدم العمل وحافظ على تنظيم سجلات الموقع.",
  "Plan, track and organise your construction projects.": "خطط لمشاريع البناء وتابعها ونظّمها.",
  "A clear picture of your active construction work.": "نظرة واضحة على أعمال البناء الجارية.",
  "Your engineer account is active, but it has not been assigned to a company or project yet. Please wait for an invitation or assignment from your company administrator.": "حساب المهندس نشط، ولكن لم يتم تعيينه لشركة أو مشروع بعد. يرجى انتظار دعوة أو تعيين من مسؤول الشركة.",
  "Enter your email and password.": "أدخل البريد الإلكتروني وكلمة المرور.",
  "Valid engineer email enter karein.": "أدخل بريداً إلكترونياً صحيحاً للمهندس.",
  "Invitation email sent successfully.": "تم إرسال دعوة البريد الإلكتروني بنجاح.",
  "Invitation email sent and project assigned.": "تم إرسال الدعوة وتعيين المشروع بنجاح.",
  "Workspace could not be loaded.": "تعذر تحميل مساحة العمل.",
  "Create a company workspace first.": "أنشئ مساحة الشركة أولاً.",
  "Create at least one project before inviting an engineer.": "أنشئ مشروعاً واحداً على الأقل قبل دعوة مهندس.",
  "Project name is required.": "اسم المشروع مطلوب.",
  "Company name is required.": "اسم الشركة مطلوب.",
});
Object.assign(ARABIC_TEXT, {
  "Workspace could not be loaded.": "تعذر تحميل مساحة العمل.",
  "Engineer account created. Verify your email and sign in; then wait for your company admin to assign a project.": "تم إنشاء حساب المهندس. أكد بريدك الإلكتروني وسجّل الدخول، ثم انتظر مسؤول الشركة لتعيين مشروع لك.",
  "Company account created. Verify your email, then sign in.": "تم إنشاء حساب الشركة. أكد بريدك الإلكتروني ثم سجّل الدخول.",
  "Account created. Loading your workspace...": "تم إنشاء الحساب. جارٍ تحميل مساحة العمل...",
  "Sending invitation request...": "جارٍ إرسال طلب الدعوة...",
  "Only a company owner or admin can invite an engineer.": "يمكن لمالك الشركة أو المسؤول فقط دعوة مهندس.",
  "Select a project for the engineer.": "اختر مشروعاً للمهندس.",
  "Invitation email sent and project assigned.": "تم إرسال الدعوة وتعيين المشروع.",
  "Invitation email sent successfully.": "تم إرسال دعوة البريد الإلكتروني بنجاح.",
  "Could not send invitation:": "تعذر إرسال الدعوة:",
  "Could not send engineer invitation.": "تعذر إرسال دعوة المهندس.",
});
Object.assign(ARABIC_TEXT, {
  "Choose your account type.": "اختر نوع الحساب.",
  "Sign in to your secure SITELOG AI account.": "سجّل الدخول إلى حسابك الآمن في SITELOG AI.",
  "Your engineer account is active, but it has not been assigned to a company or project yet. Please wait for an invitation or assignment from your company administrator.": "حساب المهندس نشط، ولكن لم يتم تعيينه لشركة أو مشروع بعد. يرجى انتظار دعوة أو تعيين من مسؤول الشركة.",
});
const LANGUAGE_LABELS = { ar: "العربية", en: "English" };
function translateNode(node, language) {
  if (language !== "ar") return node;
  if (typeof node === "string") { const key = node.trim(); const translated = ARABIC_TEXT[key]; return translated ? node.replace(key, translated) : node; }
  if (Array.isArray(node)) return node.map(child => translateNode(child, language));
  if (!React.isValidElement(node)) return node;
  const props = { ...node.props };
  ["placeholder", "aria-label", "title"].forEach(key => {
    if (typeof props[key] === "string") props[key] = ARABIC_TEXT[props[key]] || props[key];
  });
  if (props.children !== undefined) props.children = translateNode(props.children, language);
  return React.cloneElement(node, props);
}
function Localized({ language, children }) {
  return <div lang={language} dir={language === "ar" ? "rtl" : "ltr"} className={language === "ar" ? "localized-app is-arabic" : "localized-app"}>{translateNode(children, language)}</div>;
}

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
  const [language, setLanguage] = useState(() => { try { return localStorage.getItem("sitelog-language") || "ar"; } catch { return "ar"; } });
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [signupRole, setSignupRole] = useState("company");
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteProjectId, setInviteProjectId] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  const isAdmin = companyRole === "owner" || companyRole === "admin";
  useEffect(() => {
    try { localStorage.setItem("sitelog-language", language); } catch { /* storage may be unavailable */ }
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const languagePicker = <label className="language-picker"><span>{language === "ar" ? "اللغة" : "Language"}</span><select aria-label="Language" value={language} onChange={event => setLanguage(event.target.value)}><option value="ar">العربية</option><option value="en">English</option></select></label>;
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
        const signupRole = String(authUser.user_metadata?.signup_role || "company");
        // Only company-owner signups create a workspace automatically. Engineer signups wait for assignment.
        if (!memberships.length && metadataCompany && signupRole === "company") {
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

        let allowedProjectIds = [];
        if (!["owner", "admin"].includes(membership.role || "")) {
          const assignmentResult = await supabase
            .from("project_members")
            .select("project_id")
            .eq("user_id", authUser.id);
          if (assignmentResult.error) throw assignmentResult.error;
          allowedProjectIds = (assignmentResult.data || []).map(item => item.project_id);
        }
        let projectQuery = supabase
          .from("projects")
          .select("id, company_id, name, description, project_code, client, location, created_at")
          .order("created_at", { ascending: false });
        projectQuery = ["owner", "admin"].includes(membership.role || "")
          ? projectQuery.eq("company_id", membership.company_id)
          : allowedProjectIds.length ? projectQuery.in("id", allowedProjectIds) : null;
        const projectResult = projectQuery ? await projectQuery : { data: [], error: null };
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
          setWorkspaceError(error?.message || "Workspace could not be loaded.");
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
      setAuthMessage("Enter your email and password.");
      return;
    }
    if (authMode === "signup" && (!authForm.name.trim() || (signupRole === "company" && !authForm.company.trim()))) {
      setAuthMessage(signupRole === "company" ? "Enter your name and company name." : "Enter your full name.");
      return;
    }
    setAuthBusy(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: authForm.password,
          options: { data: { full_name: authForm.name.trim(), preferred_language: language, signup_role: signupRole, ...(signupRole === "company" ? { company_name: authForm.company.trim() } : {}) } }
        });
        if (error) throw error;
        if (!data.session) {
          setAuthMode("login");
          setAuthMessage(signupRole === "engineer" ? "Engineer account created. Verify your email and sign in; then wait for your company admin to assign a project." : "Company account created. Verify your email, then sign in.");
        } else {
          setAuthMessage("Account created. Loading your workspace...");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: authForm.password });
        if (error) throw error;
      }
    } catch (error) {
      setAuthMessage(error?.message || "Login or sign-up could not be completed.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function requestPasswordReset() {
    const email = authForm.email.trim().toLowerCase();
    if (!email) {
      setAuthMessage(language === "ar" ? "أدخل بريدك الإلكتروني أولاً." : "Enter your email address first.");
      return;
    }
    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      setAuthMessage(language === "ar"
        ? "تم إرسال رابط إعادة تعيين كلمة المرور. تحقق من بريدك الوارد."
        : "Password reset email sent. Check your inbox.");
    } catch (error) {
      setAuthMessage(error?.message || (language === "ar"
        ? "تعذر إرسال رسالة إعادة التعيين."
        : "Could not send password reset email."));
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
    if (!name) return notify("Enter the company name.");
    setSaving(true);
    try {
      const { error } = await supabase.rpc("create_company", { company_name: name });
      if (error) throw error;
      setCompanySetupName("");
      setWorkspaceRefresh(value => value + 1);
      notify("Company workspace created.");
    } catch (error) {
      notify(error?.message || "Could not create the company.");
    } finally {
      setSaving(false);
    }
  }

  async function inviteEngineer(event) {
    event?.preventDefault?.();
    setInviteMessage("Sending invitation request...");
    const email = inviteEmail.trim().toLowerCase();
    if (!isAdmin || !companyId) { setInviteMessage("Only a company owner or admin can invite an engineer."); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setInviteMessage("Valid engineer email enter karein."); return; }
    if (!inviteProjectId) { setInviteMessage("Select a project for the engineer."); return; }
    setInviteBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-engineer", {
        body: { email, company_id: companyId, project_id: inviteProjectId }
      });
      if (error) {
        let detail = error.message || "Invitation request failed.";
        try { if (error.context?.json) { const payload = await error.context.json(); detail = payload?.error || payload?.message || detail; } } catch { /* keep original message */ }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      setInviteEmail("");
      setInviteProjectId("");
      setInviteMessage("Invitation email sent and project assigned.");
      notify("Invitation email sent successfully.");
      setWorkspaceRefresh(value => value + 1);
    } catch (error) {
      setInviteMessage(`Could not send invitation: ${error?.message || "Unknown error"}`);
      notify(error?.message || "Could not send engineer invitation.");
    } finally {
      setInviteBusy(false);
    }
  }

  async function saveCompany(event) {
    event.preventDefault();
    if (!companyId) return notify("Create a company workspace first.");
    if (!isAdmin) return notify("Only the company owner or admin can update the profile.");
    if (!company.name.trim()) return notify("Company name is required.");
    setSaving(true);
    try {
      const payload = {
        name: company.name.trim(), phone: company.phone.trim(),
        email: company.email.trim(), address: company.address.trim()
      };
      const { error } = await supabase.from("companies").update(payload).eq("id", companyId);
      if (error) throw error;
      notify("Company profile saved.");
    } catch (error) {
      notify(error?.message || "Could not save the company profile.");
    } finally {
      setSaving(false);
    }
  }

  function resetProjectForm() { setProjectForm(EMPTY_PROJECT); }

  async function saveProject(event) {
    event.preventDefault();
    if (!companyId) return notify("Company workspace is missing.");
    if (!isAdmin) return notify("Owner or admin permission is required to manage projects.");
    if (!projectForm.name.trim()) return notify("Project name is required.");
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
      notify(projectForm.id ? "Project updated." : "Project saved.");
    } catch (error) {
      notify(error?.message || "Could not save the project.");
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
    if (!isAdmin) return notify("You do not have permission to delete this project.");
    if (!window.confirm("Delete this project? Reports linked to it may prevent deletion.")) return;
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      setProjects(prev => prev.filter(project => project.id !== id));
      notify("Project deleted.");
    } catch (error) {
      notify(error?.message || "Could not delete the project. Remove linked reports first if required.");
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
      reader.onerror = () => reject(new Error(`Could not read photo: ${file.name}`));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error(`Could not open photo: ${file.name}`));
        image.onload = () => {
          const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) return reject(new Error("Photo compression is unavailable."));
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
      notify(error?.message || "Could not attach photos.");
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
    recognition.onerror = () => notify("Could not start voice input.");
    recognition.start();
  }

  async function saveReport(event) {
    event.preventDefault();
    if (!companyId) return notify("Company workspace is missing.");
    if (!reportForm.projectId) return notify("Create a project first, then prepare a report.");
    if (!reportForm.workDone.trim()) return notify("Complete the Work Completed field.");
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
      notify(editingReportId ? "Daily report updated." : "Daily report saved.");
    } catch (error) {
      notify(error?.message || "Could not save the daily report.");
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
      notify(error?.message || "Could not delete the report. Check database permissions.");
    }
  }

  function buildReportPDF(report) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 18;
    const maxWidth = 174;
    const pageHeight = 282;
    let y = 52;

    const drawPageHeader = () => {
      doc.setFillColor(12, 22, 35);
      doc.rect(0, 0, 210, 39, "F");
      doc.setTextColor(255, 219, 145);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(21);
      doc.text("SITELOG AI", margin, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(company.name || "Construction Site Management", margin, 27);
      doc.setFontSize(13);
      doc.text("DAILY SITE REPORT", 192, 18, { align: "right" });
      doc.setFontSize(8);
      doc.text(dateLabel(report.date), 192, 27, { align: "right" });
    };

    const newPage = () => {
      doc.addPage();
      drawPageHeader();
      y = 50;
    };

    const ensureSpace = (height) => {
      if (y + height > pageHeight) newPage();
    };

    const addHeading = (value) => {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(161, 105, 22);
      doc.text(String(value).toUpperCase(), margin, y);
      y += 7;
    };

    const addParagraph = (value, size = 9) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.setTextColor(42, 51, 64);
      const lines = doc.splitTextToSize(String(value || "-"), maxWidth);
      const lineHeight = size * 0.42 + 1.5;
      lines.forEach((line) => {
        ensureSpace(lineHeight + 1);
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += 2;
    };

    drawPageHeader();
    addHeading("Project details");
    addParagraph(`Project: ${report.projectName}`);
    addParagraph(`Project code: ${report.projectCode || "-"}`);
    addParagraph(`Client: ${projects.find(item => item.id === report.projectId)?.client || "-"}`);
    addParagraph(`Location: ${projects.find(item => item.id === report.projectId)?.location || "-"}`);
    addParagraph(`Engineer: ${report.engineer || "-"}`);
    addParagraph(`Date: ${dateLabel(report.date)}`);
    addParagraph(`Weather: ${report.weather || "-"}`);
    addParagraph(`Working hours: ${report.startTime || "-"} to ${report.endTime || "-"}`);

    const sections = [
      ["Work completed", report.workDone],
      ["Labour / manpower", report.labour],
      ["Materials", report.materials],
      ["Equipment", report.equipment],
      ["Issues / delays", report.issues],
      ["Additional notes", report.notes]
    ];
    sections.forEach(([heading, value]) => {
      addHeading(heading);
      addParagraph(value);
    });

    if (company.phone || company.email || company.address) {
      addHeading("Company contact");
      [company.phone, company.email, company.address].filter(Boolean).forEach(line => addParagraph(line, 8));
    }

    const photos = Array.isArray(report.photos) ? report.photos.filter(photo => typeof photo === "string" && photo.startsWith("data:image/")) : [];
    if (photos.length) {
      newPage();
      addHeading(`Site photographs (${photos.length})`);
      photos.forEach((photo, index) => {
        try {
          const props = doc.getImageProperties(photo);
          const maxW = 174;
          const maxH = 88;
          const ratio = Math.min(maxW / props.width, maxH / props.height);
          const width = props.width * ratio;
          const height = props.height * ratio;
          if (y + height + 12 > pageHeight) newPage();
          doc.setDrawColor(220, 224, 230);
          doc.roundedRect(margin - 1, y - 1, width + 2, height + 2, 2, 2, "S");
          doc.addImage(photo, margin, y, width, height);
          y += height + 6;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(90, 98, 110);
          doc.text(`Site photo ${index + 1} of ${photos.length}`, margin, y);
          y += 10;
        } catch (error) {
          console.warn("Could not add a site photo to the PDF.", error);
        }
      });
    }

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(220, 224, 230);
      doc.line(margin, 287, 192, 287);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 128, 140);
      doc.text("Generated by SITELOG AI", margin, 292);
      doc.text(`Page ${page} of ${pageCount}`, 192, 292, { align: "right" });
    }
    return doc;
  }

  function reportFileName(report) {
    const safeName = String(report.projectName || "Report").replace(/[^a-z0-9-_]+/gi, "-").slice(0, 45);
    return `SITELOG-${safeName}-${report.date || "Report"}.pdf`;
  }

  function generatePDF(report) {
    const doc = buildReportPDF(report);
    doc.save(reportFileName(report));
    notify("Formatted PDF with photos is downloading.");
  }

  async function shareReport(report) {
    const doc = buildReportPDF(report);
    const blob = doc.output("blob");
    const file = new File([blob], reportFileName(report), { type: "application/pdf" });
    const shareText = `${company.name || "SITELOG AI"} — Daily Site Report for ${report.projectName}`;

    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "SITELOG AI Daily Site Report", text: shareText });
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.warn("Native PDF sharing was unavailable.", error);
    }

    doc.save(reportFileName(report));
    const whatsappText = `${shareText}\nThe PDF has been downloaded. Please attach it in this WhatsApp chat and send it.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank", "noopener,noreferrer");
    notify(language === "ar" ? "تم تنزيل ملف PDF. افتح واتساب وأرفق الملف في المحادثة." : "PDF downloaded. Open WhatsApp and attach the file to your chat.");
  }

  function navigate(target) {
    setPage(target);
    setNotice("");
  }

  if (!authReady || (authUser && workspaceLoading)) {
    return <Localized language={language}><div className="login-wrap"><div className="login-card"><div className="login-brand"><div className="brand-mark">S</div><div><h1>SITELOG AI</h1><p>Construction management workspace</p></div></div><div className="empty"><RefreshCw size={24} className="spin-icon" /><p>Secure workspace is loading...</p></div></div>{languagePicker}</div></Localized>;
  }

  if (!authUser) {
    return (
      <Localized language={language}><div className="login-wrap">
        <div className="login-card">
          {languagePicker}
          <div className="login-brand">
            <div className="brand-mark">S</div>
            <div><h1>SITELOG AI</h1><p>Construction Site Management</p></div>
          </div>
          <div className="auth-kicker"><ShieldCheck size={15} /> Secure company workspace</div>
          <h2>{authMode === "signup" ? "Create your SITELOG AI account" : "Welcome back"}</h2>
          <p>{authMode === "signup" ? "Apni account type select karein." : "Apne secure SITELOG AI account mein login karein."}</p>
          {authMode === "signup" && <div className="form-grid">
            <button type="button" className={`btn ${signupRole === "company" ? "btn-primary" : "btn-dark"}`} onClick={() => { setSignupRole("company"); setAuthMessage(""); }}>Company Sign Up</button>
            <button type="button" className={`btn ${signupRole === "engineer" ? "btn-primary" : "btn-dark"}`} onClick={() => { setSignupRole("engineer"); setAuthMessage(""); }}>Engineer Sign Up</button>
          </div> }
          <form className="login-form" onSubmit={submitAuth}>
            {authMode === "signup" && <>
              <div className="field"><label>Full name</label><input required autoComplete="name" value={authForm.name} onChange={event => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Your full name" /></div>
              {signupRole === "company" && <div className="field"><label>Company name</label><input required autoComplete="organization" value={authForm.company} onChange={event => setAuthForm({ ...authForm, company: event.target.value })} placeholder="Construction company" /></div>}
            </>}
            <div className="field"><label>Email address</label><input required type="email" autoComplete="email" value={authForm.email} onChange={event => setAuthForm({ ...authForm, email: event.target.value })} placeholder="you@company.com" /></div>
            <div className="field"><label>Password</label><input required minLength={6} type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={authForm.password} onChange={event => setAuthForm({ ...authForm, password: event.target.value })} placeholder="At least 6 characters" /></div>
            {authMode === "login" && <button type="button" className="text-button forgot-password" onClick={requestPasswordReset} disabled={authBusy}>{language === "ar" ? "هل نسيت كلمة المرور؟" : "Forgot password?"}</button>}
            {authMessage && <div className="inline-message" role="status">{authMessage}</div>}
            <button className="btn btn-primary" type="submit" disabled={authBusy}>{authBusy ? <RefreshCw size={17} /> : authMode === "signup" ? <UserPlus size={17} /> : <LogIn size={17} />}{authBusy ? "Please wait..." : authMode === "signup" ? (signupRole === "company" ? "Create company account" : "Create engineer account") : "Login securely"}</button>
          </form>
          <div className="auth-switch">{authMode === "signup" ? "Already have an account?" : "New to SITELOG AI?"}<button type="button" className="text-button" onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthMessage(""); }}>{authMode === "signup" ? "Login" : "Create account"}</button></div>
          <div className="security-foot"><ShieldCheck size={14} /> Your data is connected to your Supabase account.</div>
        </div>
      </div></Localized>
    );
  }

  if (!companyId) {
    return (
      <Localized language={language}><div className="login-wrap">
        <div className="login-card">
          {languagePicker}
          <div className="login-brand"><div className="brand-mark">S</div><div><h1>Set up your workspace</h1><p>One company workspace for your project team.</p></div></div>
          {workspaceError && <div className="inline-message">{workspaceError}</div>}
          {authUser.user_metadata?.signup_role === "engineer" ? <div className="inline-message" role="status">Engineer account active hai, lekin abhi kisi company/project se assign nahi hua. Company admin se invitation ya assignment ka intezar karein. Apna login safe rakhein.</div> : <form className="login-form" onSubmit={createWorkspace}>
            <div className="field"><label>Company name</label><input required value={companySetupName} onChange={event => setCompanySetupName(event.target.value)} placeholder="Your construction company" /></div>
            <button className="btn btn-primary" type="submit" disabled={saving}><Building2 size={17} />{saving ? "Creating workspace..." : "Create company workspace"}</button>
          </form>}
          <button className="btn btn-dark" type="button" onClick={logout}><LogOut size={16} />Sign out</button>
        </div>
      </div></Localized>
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
    <Localized language={language}><div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-copy"><strong>SITELOG AI</strong><span>Construction operations</span></div>
        </div>
        <div className="topbar-actions">
          {languagePicker}
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
              <div className="stat-card" style={{cursor:"pointer"}} onClick={() => navigate("projects")}><div className="stat-icon"><FolderKanban size={21} /></div><div className="stat-label">Total projects</div><div className="stat-value">{projects.length}</div><div className="stat-foot"><span>In your workspace</span><ArrowUpRight size={15} /></div></div>
              <div className="stat-card" style={{cursor:"pointer"}} onClick={() => navigate("reports")}><div className="stat-icon"><FileText size={21} /></div><div className="stat-label">Daily reports</div><div className="stat-value">{reports.length}</div><div className="stat-foot"><span>Saved in the cloud</span><ArrowUpRight size={15} /></div></div>
              <div className="stat-card" style={{cursor:"pointer"}} onClick={() => navigate("reports")}><div className="stat-icon"><CalendarDays size={21} /></div><div className="stat-label">This month</div><div className="stat-value">{reportCountThisMonth}</div><div className="stat-foot"><span>Reports this month</span><ArrowUpRight size={15} /></div></div>
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
              {isAdmin && <section className="card card-pad">
                <div className="section-title"><div><h3>Invite an engineer</h3><p>Send an email invitation and assign the engineer to one project.</p></div><UserPlus size={22} /></div>
                {!projects.length ? <div className="inline-message">Create at least one project before inviting an engineer.</div> : <form onSubmit={inviteEngineer}>
                  <div className="form-grid">
                    <div className="field full"><label>Engineer email *</label><input required type="email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} placeholder="engineer@example.com" /></div>
                    <div className="field full"><label>Assign project *</label><select required value={inviteProjectId} onChange={event => setInviteProjectId(event.target.value)}><option value="">Select project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}{project.code ? ` (${project.code})` : ""}</option>)}</select></div>
                  </div>
                  <div className="form-actions"><button className="btn btn-primary" type="button" onClick={() => inviteEngineer()} disabled={inviteBusy || !projects.length}><UserPlus size={16} />{inviteBusy ? "Sending invitation..." : "Send invitation"}</button></div>
                  {inviteMessage && <div className="inline-message" role="status" aria-live="polite">{inviteMessage}</div>}
                </form>}
              </section>}
              <section className="card card-pad company-summary">
                <div className="section-title"><div><h3>Workspace details</h3><p>Account and access status.</p></div></div>
                <div className="company-profile-mark"><div className="brand-mark">{shortName(company.name)}</div><div><strong>{company.name || "Company workspace"}</strong><span>Construction workspace</span></div></div>
                <div className="detail-line"><span>Signed-in user</span><strong>{authUser.email}</strong></div>
                <div className="detail-line"><span>Workspace role</span><strong className="role-pill">{companyRole || "Team member"}</strong></div>
                <div className="detail-line"><span>Projects</span><strong>{projects.length}</strong></div>
                <div className="detail-line"><span>Reports</span><strong>{reports.length}</strong></div>
                <div className="security-note"><ShieldCheck size={18} /><div><strong>Access-controlled cloud data</strong><p>Company, project and report access is enforced by Supabase policies. Engineers can access only projects assigned to their account.</p></div></div>
              </section>
            </div>
          </>}

          <footer className="app-footer"><span>SITELOG AI <span className="footer-dot">•</span> Construction operations</span><span><ShieldCheck size={13} /> Signed in as {authUser.email}</span></footer>
        </main>
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </div></Localized>
  );
}

export default App;
