import React, { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Camera, ClipboardList, Download, FileText, Mic, MicOff,
  Plus, Save, Share2, Trash2, Upload, X
} from "lucide-react";

const emptyReport = {
  id: "",
  projectName: "",
  projectCode: "",
  engineer: "",
  date: new Date().toISOString().slice(0, 10),
  weather: "Clear",
  startTime: "08:00",
  endTime: "17:00",
  workDone: "",
  labour: "",
  materials: "",
  equipment: "",
  issues: "",
  notes: "",
  photos: []
};

function loadReports() {
  try { return JSON.parse(localStorage.getItem("sitelog_reports") || "[]"); }
  catch { return []; }
}

function App() {
  const [report, setReport] = useState(emptyReport);
  const [reports, setReports] = useState(loadReports);
  const [saved, setSaved] = useState(false);
  const [recording, setRecording] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);

  const totalReports = reports.length;

  useEffect(() => {
    localStorage.setItem("sitelog_reports", JSON.stringify(reports));
  }, [reports]);

  function update(key, value) {
    setReport(r => ({ ...r, [key]: value }));
    setSaved(false);
  }

  function newReport() {
    setReport({ ...emptyReport, date: new Date().toISOString().slice(0, 10) });
    setSaved(false);
  }

  function saveReport() {
    if (!report.projectName.trim()) {
      showToast("Project name is required.");
      return;
    }
    const item = { ...report, id: report.id || crypto.randomUUID() };
    setReports(prev => [item, ...prev.filter(x => x.id !== item.id)]);
    setReport(item);
    setSaved(true);
    showToast("Daily report saved.");
  }

  function deleteReport(id) {
    if (!confirm("Delete this report?")) return;
    setReports(prev => prev.filter(x => x.id !== id));
    if (report.id === id) newReport();
    showToast("Report deleted.");
  }

  function openReport(item) {
    setReport(item);
    setSaved(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  async function addPhotos(event) {
    const files = Array.from(event.target.files || []);
    const images = await Promise.all(files.slice(0, 8).map(fileToDataUrl));
    update("photos", [...report.photos, ...images].slice(0, 8));
    event.target.value = "";
  }

  function removePhoto(index) {
    update("photos", report.photos.filter((_, i) => i !== index));
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Voice-to-text is not supported in this browser.");
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = e => {
      const text = Array.from(e.results).slice(e.resultIndex)
        .map(r => r[0].transcript).join(" ");
      update("workDone", `${report.workDone}${report.workDone ? " " : ""}${text}`.trim());
    };
    recognition.onerror = () => {
      setRecording(false);
      showToast("Voice recognition stopped.");
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    showToast("Speak your site work notes...");
  }

  async function generatePdf() {
    if (!report.projectName.trim()) {
      showToast("Add a project name first.");
      return;
    }

    const doc = new jsPDF();
    const margin = 14;
    let y = 18;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SITELOG AI", margin, y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Daily Site Report", margin, y + 6);

    y += 18;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Project Information", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    y = pdfLine(doc, "Project", report.projectName, y);
    y = pdfLine(doc, "Project Code", report.projectCode || "-", y);
    y = pdfLine(doc, "Engineer", report.engineer || "-", y);
    y = pdfLine(doc, "Date", report.date, y);
    y = pdfLine(doc, "Weather", report.weather, y);
    y = pdfLine(doc, "Working Hours", `${report.startTime} - ${report.endTime}`, y);

    y += 5;
    y = pdfSection(doc, "Work Completed", report.workDone, y);
    y = pdfSection(doc, "Labour", report.labour, y);
    y = pdfSection(doc, "Materials", report.materials, y);
    y = pdfSection(doc, "Equipment", report.equipment, y);
    y = pdfSection(doc, "Issues / Delays", report.issues, y);
    y = pdfSection(doc, "Additional Notes", report.notes, y);

    if (report.photos.length) {
      if (y > 240) { doc.addPage(); y = 18; }
      doc.setFont("helvetica", "bold");
      doc.text("Site Photos", margin, y);
      y += 6;

      let x = margin;
      let rowHeight = 68;
      for (let i = 0; i < report.photos.length; i++) {
        if (x > 110) { x = margin; y += rowHeight; }
        if (y > 220) { doc.addPage(); y = 18; x = margin; }
        try { doc.addImage(report.photos[i], "JPEG", x, y, 82, 58); }
        catch {}
        x += 92;
      }
      y += rowHeight;
    }

    if (y > 255) { doc.addPage(); y = 18; }
    doc.setDrawColor(180);
    doc.line(margin, y, 196, y);
    doc.setFontSize(9);
    doc.text("Generated by SITELOG AI", margin, y + 7);

    const filename = `SiteReport_${report.date}_${safeName(report.projectName)}.pdf`;
    doc.save(filename);
    showToast("PDF generated.");
  }

  async function shareReport() {
    const text = `SITELOG AI Daily Report
Project: ${report.projectName}
Date: ${report.date}
Work: ${report.workDone || "-"}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Daily Site Report", text });
        return;
      } catch {}
    }
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  const recent = useMemo(() => reports.slice(0, 10), [reports]);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">SITELOG <span>AI</span></div>
          <div className="subtitle">Construction Daily Reporting</div>
        </div>
        <button className="primary" onClick={newReport}><Plus size={18}/> New Report</button>
      </header>

      <main className="container">
        <section className="stats">
          <div className="stat"><strong>{totalReports}</strong><span>Saved Reports</span></div>
          <div className="stat"><strong>{report.photos.length}</strong><span>Photos in Current</span></div>
          <div className="stat"><strong>{saved ? "Saved" : "Draft"}</strong><span>Current Status</span></div>
        </section>

        <section className="card">
          <div className="cardTitle">
            <div><ClipboardList size={20}/><h2>Daily Site Report</h2></div>
            {saved && <span className="saved">Saved</span>}
          </div>

          <div className="grid two">
            <Field label="Project Name *">
              <input value={report.projectName} onChange={e=>update("projectName",e.target.value)} placeholder="e.g. Riyadh Villa Project"/>
            </Field>
            <Field label="Project Code">
              <input value={report.projectCode} onChange={e=>update("projectCode",e.target.value)} placeholder="e.g. RV-001"/>
            </Field>
            <Field label="Site Engineer">
              <input value={report.engineer} onChange={e=>update("engineer",e.target.value)} placeholder="Engineer name"/>
            </Field>
            <Field label="Date">
              <input type="date" value={report.date} onChange={e=>update("date",e.target.value)}/>
            </Field>
            <Field label="Weather">
              <select value={report.weather} onChange={e=>update("weather",e.target.value)}>
                <option>Clear</option><option>Cloudy</option><option>Rain</option>
                <option>Dusty</option><option>Hot</option><option>Windy</option>
              </select>
            </Field>
            <Field label="Working Hours">
              <div className="inline">
                <input type="time" value={report.startTime} onChange={e=>update("startTime",e.target.value)}/>
                <span>to</span>
                <input type="time" value={report.endTime} onChange={e=>update("endTime",e.target.value)}/>
              </div>
            </Field>
          </div>

          <Field label="Work Completed">
            <div className="textareaWrap">
              <textarea rows="5" value={report.workDone} onChange={e=>update("workDone",e.target.value)}
                placeholder="Describe today's work, progress, completed activities..."/>
              <button className={`voice ${recording ? "active" : ""}`} onClick={toggleVoice}>
                {recording ? <MicOff size={18}/> : <Mic size={18}/>}
                {recording ? "Stop" : "Voice"}
              </button>
            </div>
          </Field>

          <div className="grid two">
            <Field label="Labour / Workforce">
              <textarea rows="4" value={report.labour} onChange={e=>update("labour",e.target.value)}
                placeholder="e.g. 8 masons, 4 helpers, 2 electricians"/>
            </Field>
            <Field label="Materials">
              <textarea rows="4" value={report.materials} onChange={e=>update("materials",e.target.value)}
                placeholder="e.g. Cement 30 bags, blocks 500 pcs"/>
            </Field>
            <Field label="Equipment / Machinery">
              <textarea rows="4" value={report.equipment} onChange={e=>update("equipment",e.target.value)}
                placeholder="e.g. Excavator, crane, mixer"/>
            </Field>
            <Field label="Issues / Delays">
              <textarea rows="4" value={report.issues} onChange={e=>update("issues",e.target.value)}
                placeholder="Any delay, safety issue, inspection problem..."/>
            </Field>
          </div>

          <Field label="Additional Notes">
            <textarea rows="3" value={report.notes} onChange={e=>update("notes",e.target.value)}
              placeholder="Any other important information"/>
          </Field>

          <div className="photoHeader">
            <label className="fieldLabel">Site Photos (max 8)</label>
            <button className="secondary" onClick={()=>fileRef.current?.click()}><Camera size={17}/> Add Photos</button>
            <input ref={fileRef} hidden type="file" accept="image/*" multiple onChange={addPhotos}/>
          </div>

          <div className="photos">
            {report.photos.map((src, i) => (
              <div className="photo" key={i}>
                <img src={src} alt={`Site ${i+1}`}/>
                <button onClick={()=>removePhoto(i)}><X size={15}/></button>
              </div>
            ))}
            {!report.photos.length && <div className="emptyPhoto"><Upload size={22}/><span>No photos added yet</span></div>}
          </div>

          <div className="actions">
            <button className="primary large" onClick={saveReport}><Save size={18}/> Save Report</button>
            <button className="secondary large" onClick={generatePdf}><Download size={18}/> Generate PDF</button>
            <button className="secondary large" onClick={shareReport}><Share2 size={18}/> Share / WhatsApp</button>
          </div>
        </section>

        <section className="card">
          <div className="cardTitle">
            <div><FileText size={20}/><h2>Recent Reports</h2></div>
          </div>
          {!recent.length && <div className="empty">No saved reports yet.</div>}
          {recent.map(item => (
            <div className="reportRow" key={item.id}>
              <div onClick={()=>openReport(item)} className="reportMain">
                <strong>{item.projectName}</strong>
                <span>{item.date} · {item.engineer || "No engineer"} · {item.photos.length} photos</span>
              </div>
              <button className="iconBtn danger" onClick={()=>deleteReport(item.id)}><Trash2 size={17}/></button>
            </div>
          ))}
        </section>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Field({label, children}) {
  return <div className="field"><label className="fieldLabel">{label}</label>{children}</div>;
}

function pdfLine(doc, label, value, y) {
  doc.setFont("helvetica","bold"); doc.text(`${label}:`, 14, y);
  doc.setFont("helvetica","normal"); doc.text(String(value || "-"), 52, y);
  return y + 6;
}

function pdfSection(doc, title, text, y) {
  if (y > 260) { doc.addPage(); y = 18; }
  doc.setFont("helvetica","bold"); doc.text(title, 14, y); y += 5;
  doc.setFont("helvetica","normal");
  const lines = doc.splitTextToSize(text || "-", 182);
  doc.text(lines, 14, y);
  return y + lines.length * 5 + 4;
}

function safeName(value) {
  return String(value || "Project").replace(/[^a-z0-9_-]+/gi, "_").slice(0, 40);
}

export default App;