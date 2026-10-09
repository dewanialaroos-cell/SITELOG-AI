import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  LayoutDashboard, FolderKanban, Building2, FileText, Plus,
  Trash2, Edit3, LogOut, Save, Download, Share2, Camera, Mic, X, Menu
} from "lucide-react";

const STORAGE = {
  logged: "sitelog_logged",
  user: "sitelog_user",
  company: "sitelog_company",
  projects: "sitelog_projects",
  reports: "sitelog_reports",
};

const emptyReport = {
  projectName: "", projectCode: "", engineer: "",
  date: new Date().toISOString().slice(0, 10),
  weather: "", startTime: "", endTime: "", workDone: "",
  labour: "", materials: "", equipment: "", issues: "", notes: "", photos: []
};

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch { return fallback; }
}

function App() {
  const [logged, setLogged] = useState(localStorage.getItem(STORAGE.logged) === "true");
  const [user, setUser] = useState(load(STORAGE.user, { name: "", email: "" }));
  const [company, setCompany] = useState(load(STORAGE.company, { name: "", phone: "", email: "", address: "" }));
  const [projects, setProjects] = useState(load(STORAGE.projects, []));
  const [reports, setReports] = useState(load(STORAGE.reports, []));
  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: "", email: "" });
  const [projectForm, setProjectForm] = useState({ id: null, name: "", code: "", client: "", location: "" });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [reportForm, setReportForm] = useState(emptyReport);
  const [editingReport, setEditingReport] = useState(null);

  useEffect(() => localStorage.setItem(STORAGE.user, JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem(STORAGE.company, JSON.stringify(company)), [company]);
  useEffect(() => localStorage.setItem(STORAGE.projects, JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem(STORAGE.reports, JSON.stringify(reports)), [reports]);

  const recentReports = useMemo(() => [...reports].sort((a,b) => new Date(b.date || 0)-new Date(a.date || 0)).slice(0,5), [reports]);

  function login(e) {
    e.preventDefault();
    if (!loginForm.name.trim()) return alert("Please enter your name.");
    setUser({ name: loginForm.name.trim(), email: loginForm.email.trim() });
    localStorage.setItem(STORAGE.logged, "true");
    setLogged(true);
  }

  function logout() {
    localStorage.removeItem(STORAGE.logged);
    setLogged(false);
  }

  function saveCompany(e) {
    e.preventDefault();
    alert("Company profile saved.");
  }

  function resetProjectForm() {
    setProjectForm({ id: null, name: "", code: "", client: "", location: "" });
  }

  function saveProject(e) {
    e.preventDefault();
    if (!projectForm.name.trim()) return alert("Project name is required.");
    if (projectForm.id) {
      setProjects(prev => prev.map(p => p.id === projectForm.id ? { ...projectForm } : p));
    } else {
      setProjects(prev => [...prev, { ...projectForm, id: Date.now() }]);
    }
    resetProjectForm();
    setShowProjectForm(false);
  }

  function editProject(project) {
    setProjectForm(project);
    setShowProjectForm(true);
  }

  function deleteProject(id) {
    if (confirm("Delete this project?")) setProjects(prev => prev.filter(p => p.id !== id));
  }

  function openNewReport() {
    setEditingReport(null);
    setReportForm({ ...emptyReport, engineer: user.name || "" });
    setPage("reports");
  }

  function editReport(report) {
    setEditingReport(report.id);
    setReportForm({ ...emptyReport, ...report });
    setPage("reports");
  }

  function handlePhoto(event) {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setReportForm(prev => ({ ...prev, photos: [...prev.photos, reader.result] }));
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  }

  function removePhoto(index) {
    setReportForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  }

  function startVoice(field) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice typing is not supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = event => {
      const text = event.results[0][0].transcript;
      setReportForm(prev => ({ ...prev, [field]: prev[field] ? `${prev[field]} ${text}` : text }));
    };
    recognition.onerror = () => alert("Voice input could not start.");
    recognition.start();
  }

  function saveReport(e) {
    e.preventDefault();
    if (!reportForm.projectName.trim()) return alert("Please enter project name.");
    if (!reportForm.workDone.trim()) return alert("Please enter work completed.");

    if (editingReport) {
      setReports(prev => prev.map(r => r.id === editingReport ? { ...reportForm, id: editingReport, updatedAt: new Date().toISOString() } : r));
    } else {
      setReports(prev => [{ ...reportForm, id: Date.now(), createdAt: new Date().toISOString() }, ...prev]);
    }

    alert("Daily report saved successfully.");
    setEditingReport(null);
    setReportForm(emptyReport);
  }

  function deleteReport(id) {
    if (confirm("Delete this report?")) setReports(prev => prev.filter(r => r.id !== id));
  }

  function generatePDF(report) {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(20); doc.text("SITELOG AI", 20, y);
    y += 10; doc.setFontSize(14); doc.text("Daily Site Report", 20, y);
    y += 12; doc.setFontSize(10);

    const lines = [
      `Project: ${report.projectName || "-"}`,
      `Project Code: ${report.projectCode || "-"}`,
      `Engineer: ${report.engineer || "-"}`,
      `Date: ${report.date || "-"}`,
      `Weather: ${report.weather || "-"}`,
      `Working Hours: ${report.startTime || "-"} - ${report.endTime || "-"}`,
      "", "WORK COMPLETED", report.workDone || "-",
      "", "LABOUR", report.labour || "-",
      "", "MATERIALS", report.materials || "-",
      "", "EQUIPMENT", report.equipment || "-",
      "", "ISSUES / DELAYS", report.issues || "-",
      "", "NOTES", report.notes || "-"
    ];

    lines.forEach(line => {
      doc.splitTextToSize(line, 170).forEach(text => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(text, 20, y); y += 6;
      });
    });

    doc.save(`SITELOG-${report.projectName || "Report"}-${report.date || "Report"}.pdf`);
  }

  function shareReport(report) {
    const text = `SITELOG AI Daily Report
Project: ${report.projectName}
Date: ${report.date}
Engineer: ${report.engineer}

Work Completed:
${report.workDone}

Issues:
${report.issues || "-"}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function nav(target) {
    setPage(target);
    setMobileMenu(false);
  }

  if (!logged) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-box">
            <div className="brand-logo">S</div>
            <div><h1>SITELOG AI</h1><p>Construction Site Management</p></div>
          </div>
          <h2>Welcome</h2>
          <p className="muted">Login to manage your projects and site reports.</p>
          <form onSubmit={login}>
            <label>Your Name</label>
            <input value={loginForm.name} onChange={e => setLoginForm({...loginForm, name:e.target.value})} placeholder="Enter your name" />
            <label>Email</label>
            <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email:e.target.value})} placeholder="Enter your email" />
            <button className="primary-btn" type="submit">Login</button>
          </form>
          <p className="demo-note">Demo login — Cloud authentication will be added later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className={mobileMenu ? "sidebar open" : "sidebar"}>
        <div className="sidebar-brand">
          <div className="brand-logo small">S</div>
          <div><strong>SITELOG AI</strong><span>Construction</span></div>
        </div>
        <nav>
          <button className={page === "dashboard" ? "nav-active" : ""} onClick={() => nav("dashboard")}><LayoutDashboard size={19}/>Dashboard</button>
          <button className={page === "projects" ? "nav-active" : ""} onClick={() => nav("projects")}><FolderKanban size={19}/>Projects</button>
          <button className={page === "reports" ? "nav-active" : ""} onClick={() => nav("reports")}><FileText size={19}/>Daily Reports</button>
          <button className={page === "company" ? "nav-active" : ""} onClick={() => nav("company")}><Building2 size={19}/>Company</button>
        </nav>
        <button className="logout-btn" onClick={logout}><LogOut size={18}/>Logout</button>
      </aside>

      {mobileMenu && <div className="mobile-overlay" onClick={() => setMobileMenu(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileMenu(!mobileMenu)}><Menu/></button>
          <div>
            <h2>{page === "dashboard" ? "Dashboard" : page === "projects" ? "Projects" : page === "reports" ? "Daily Reports" : "Company Profile"}</h2>
            <span className="topbar-user">{user.name || "User"}</span>
          </div>
        </header>

        <section className="page-content">
          {page === "dashboard" && (
            <>
              <div className="welcome-card">
                <div><p>Welcome back</p><h1>{user.name || "User"} 👋</h1><span>Manage your construction projects and daily site reports.</span></div>
                <button className="primary-btn" onClick={openNewReport}><Plus size={18}/>New Daily Report</button>
              </div>
              <div className="stats-grid">
                <div className="stat-card"><FolderKanban/><span>Projects</span><strong>{projects.length}</strong></div>
                <div className="stat-card"><FileText/><span>Daily Reports</span><strong>{reports.length}</strong></div>
                <div className="stat-card"><Building2/><span>Company</span><strong>{company.name ? "Ready" : "Setup"}</strong></div>
              </div>
              <div className="section-card">
                <div className="section-title"><div><h3>Recent Reports</h3><p>Your latest site reports</p></div><button className="secondary-btn" onClick={() => nav("reports")}>View All</button></div>
                {recentReports.length === 0 ? (
                  <div className="empty-state"><FileText size={40}/><h3>No reports yet</h3><p>Create your first daily site report.</p><button className="primary-btn" onClick={openNewReport}>Create Report</button></div>
                ) : (
                  <div className="report-list">{recentReports.map(report => (
                    <div className="report-row" key={report.id}><div><strong>{report.projectName}</strong><span>{report.date} · {report.engineer}</span></div><button className="icon-btn" onClick={() => editReport(report)}><Edit3 size={17}/></button></div>
                  ))}</div>
                )}
              </div>
            </>
          )}

          {page === "projects" && (
            <>
              <div className="page-heading"><div><h1>Projects</h1><p>Create and manage your construction projects.</p></div><button className="primary-btn" onClick={() => {resetProjectForm();setShowProjectForm(true)}}><Plus size={18}/>Add Project</button></div>
              {showProjectForm && (
                <div className="section-card">
                  <div className="section-title"><div><h3>{projectForm.id ? "Edit Project" : "New Project"}</h3></div><button className="icon-btn" onClick={() => {setShowProjectForm(false);resetProjectForm()}}><X size={18}/></button></div>
                  <form className="form-grid" onSubmit={saveProject}>
                    <div><label>Project Name</label><input value={projectForm.name} onChange={e=>setProjectForm({...projectForm,name:e.target.value})} placeholder="e.g. Villa Construction"/></div>
                    <div><label>Project Code</label><input value={projectForm.code} onChange={e=>setProjectForm({...projectForm,code:e.target.value})} placeholder="e.g. PRJ-001"/></div>
                    <div><label>Client</label><input value={projectForm.client} onChange={e=>setProjectForm({...projectForm,client:e.target.value})} placeholder="Client name"/></div>
                    <div><label>Location</label><input value={projectForm.location} onChange={e=>setProjectForm({...projectForm,location:e.target.value})} placeholder="Project location"/></div>
                    <div className="form-actions"><button type="submit" className="primary-btn"><Save size={18}/>Save Project</button><button type="button" className="secondary-btn" onClick={()=>{setShowProjectForm(false);resetProjectForm()}}>Cancel</button></div>
                  </form>
                </div>
              )}
              <div className="project-grid">
                {projects.length === 0 ? <div className="section-card empty-state"><FolderKanban size={45}/><h3>No projects yet</h3><p>Add your first construction project.</p></div> :
                  projects.map(project => (
                    <div className="project-card" key={project.id}>
                      <div className="project-icon"><FolderKanban size={24}/></div><h3>{project.name}</h3><p>{project.code || "No project code"}</p>
                      <div className="project-meta"><span>Client: {project.client || "-"}</span><span>Location: {project.location || "-"}</span></div>
                      <div className="card-actions"><button className="secondary-btn" onClick={()=>editProject(project)}><Edit3 size={16}/>Edit</button><button className="danger-btn" onClick={()=>deleteProject(project.id)}><Trash2 size={16}/></button></div>
                    </div>
                  ))
                }
              </div>
            </>
          )}

          {page === "company" && (
            <>
              <div className="page-heading"><div><h1>Company Profile</h1><p>Add your company details for future branded reports.</p></div></div>
              <div className="section-card">
                <form onSubmit={saveCompany}>
                  <div className="form-grid">
                    <div><label>Company Name</label><input value={company.name} onChange={e=>setCompany({...company,name:e.target.value})} placeholder="Your construction company"/></div>
                    <div><label>Phone</label><input value={company.phone} onChange={e=>setCompany({...company,phone:e.target.value})} placeholder="+966..."/></div>
                    <div><label>Email</label><input type="email" value={company.email} onChange={e=>setCompany({...company,email:e.target.value})} placeholder="company@example.com"/></div>
                    <div><label>Address</label><input value={company.address} onChange={e=>setCompany({...company,address:e.target.value})} placeholder="Company address"/></div>
                  </div>
                  <div className="form-actions"><button type="submit" className="primary-btn"><Save size={18}/>Save Company</button></div>
                </form>
              </div>
            </>
          )}

          {page === "reports" && (
            <>
              <div className="page-heading"><div><h1>Daily Reports</h1><p>Create professional construction site reports.</p></div><button className="primary-btn" onClick={openNewReport}><Plus size={18}/>New Report</button></div>
              <div className="section-card report-editor">
                <div className="section-title"><div><h3>{editingReport ? "Edit Daily Report" : "Daily Site Report"}</h3><p>Complete the site information below.</p></div></div>
                <form onSubmit={saveReport}>
                  <div className="form-grid">
                    <div><label>Project Name *</label><input value={reportForm.projectName} onChange={e=>setReportForm({...reportForm,projectName:e.target.value})} placeholder="Project name"/></div>
                    <div><label>Project Code</label><input value={reportForm.projectCode} onChange={e=>setReportForm({...reportForm,projectCode:e.target.value})} placeholder="PRJ-001"/></div>
                    <div><label>Site Engineer</label><input value={reportForm.engineer} onChange={e=>setReportForm({...reportForm,engineer:e.target.value})} placeholder="Engineer name"/></div>
                    <div><label>Date</label><input type="date" value={reportForm.date} onChange={e=>setReportForm({...reportForm,date:e.target.value})}/></div>
                    <div><label>Weather</label><input value={reportForm.weather} onChange={e=>setReportForm({...reportForm,weather:e.target.value})} placeholder="Sunny / Cloudy / Rain"/></div>
                    <div><label>Working Hours</label><div className="time-row"><input type="time" value={reportForm.startTime} onChange={e=>setReportForm({...reportForm,startTime:e.target.value})}/><input type="time" value={reportForm.endTime} onChange={e=>setReportForm({...reportForm,endTime:e.target.value})}/></div></div>
                  </div>
                  <TextAreaField label="Work Completed *" value={reportForm.workDone} onChange={value=>setReportForm({...reportForm,workDone:value})} onVoice={()=>startVoice("workDone")}/>
                  <TextAreaField label="Labour" value={reportForm.labour} onChange={value=>setReportForm({...reportForm,labour:value})} onVoice={()=>startVoice("labour")}/>
                  <TextAreaField label="Materials" value={reportForm.materials} onChange={value=>setReportForm({...reportForm,materials:value})} onVoice={()=>startVoice("materials")}/>
                  <TextAreaField label="Equipment" value={reportForm.equipment} onChange={value=>setReportForm({...reportForm,equipment:value})} onVoice={()=>startVoice("equipment")}/>
                  <TextAreaField label="Issues / Delays" value={reportForm.issues} onChange={value=>setReportForm({...reportForm,issues:value})} onVoice={()=>startVoice("issues")}/>
                  <TextAreaField label="Notes" value={reportForm.notes} onChange={value=>setReportForm({...reportForm,notes:value})} onVoice={()=>startVoice("notes")}/>
                  <div className="photo-section"><label>Site Photos</label><label className="photo-upload"><Camera size={20}/>Add Photos<input type="file" accept="image/*" multiple onChange={handlePhoto}/></label>
                    {reportForm.photos.length > 0 && <div className="photo-grid">{reportForm.photos.map((photo,index)=><div className="photo-item" key={index}><img src={photo} alt={`Site ${index+1}`}/><button type="button" onClick={()=>removePhoto(index)}><X size={16}/></button></div>)}</div>}
                  </div>
                  <div className="form-actions"><button className="primary-btn" type="submit"><Save size={18}/>{editingReport ? "Update Report" : "Save Report"}</button><button type="button" className="secondary-btn" onClick={()=>{setEditingReport(null);setReportForm(emptyReport)}}>Clear</button></div>
                </form>
              </div>
              <div className="section-card">
                <div className="section-title"><div><h3>Saved Reports</h3><p>Reports saved on this device.</p></div></div>
                {reports.length === 0 ? <div className="empty-state"><FileText size={40}/><h3>No saved reports</h3></div> :
                  <div className="saved-report-grid">{reports.map(report=>(
                    <div className="saved-report-card" key={report.id}>
                      <div><h3>{report.projectName}</h3><p>{report.date} · {report.engineer || "No engineer"}</p></div>
                      <div className="card-actions"><button className="secondary-btn" onClick={()=>editReport(report)}><Edit3 size={16}/>Edit</button><button className="secondary-btn" onClick={()=>generatePDF(report)}><Download size={16}/>PDF</button><button className="secondary-btn" onClick={()=>shareReport(report)}><Share2 size={16}/>Share</button><button className="danger-btn" onClick={()=>deleteReport(report.id)}><Trash2 size={16}/></button></div>
                    </div>
                  ))}</div>
                }
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function TextAreaField({label,value,onChange,onVoice}) {
  return <div className="textarea-field"><div className="field-header"><label>{label}</label><button type="button" className="voice-btn" onClick={onVoice}><Mic size={17}/>Voice</button></div><textarea value={value} onChange={e=>onChange(e.target.value)} rows="4" placeholder={`Enter ${label.toLowerCase()}...`}/></div>;
}

export default App;
