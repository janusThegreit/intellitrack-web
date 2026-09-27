import React from "react";
import { formatPeso } from "../Utils/currency";

interface EquipmentItem {
  id: number;
  code: string;
  name: string;
  rental_rate: number | string;
  rental_unit: string;
  category?: string;
}

interface JobOrderItem {
  id: number;
  job_order_id: number;
  equipment_id: number;
  quantity: number;
  unit_price: number | string;
  unit: string;
  total_price: number | string;
  notes?: string;
  equipment?: EquipmentItem;
}

interface JobOrder {
  id: number;
  job_number: string;
  customer_name: string;
  customer?: {
    id: number;
    name: string;
    company_name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
  };
  description: string;
  status: string;
  total_amount: number;
  start_date?: string;
  scheduled_date?: string;
  due_date?: string;
  completion_date?: string;
  priority?: string;
  location?: string;
  notes?: string;
  job_order_items?: JobOrderItem[];
  created_at?: string;
  creator?: { name: string } | null;
}

interface WorkOrderPrintProps {
  job: JobOrder;
  onClose: () => void;
}

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "_______________";

const thS: React.CSSProperties = {
  padding: "7px 10px",
  textAlign: "left",
  fontSize: "7.5pt",
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  border: "1px solid #111827",
};

const tdS: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #e5e7eb",
  fontSize: "8.5pt",
  color: "#222",
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: "flex", gap: "6px", marginBottom: "4px", fontSize: "8.5pt" }}>
    <span style={{ color: "#888", minWidth: "110px", fontWeight: 600, flexShrink: 0 }}>{label}:</span>
    <span style={{ color: "#111", fontWeight: 500 }}>{value}</span>
  </div>
);

const SigBlock = ({ title, role, subtitle }: { title: string; role: string; subtitle: string }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "7.5pt", fontWeight: 800, textTransform: "uppercase", color: "#888", letterSpacing: "0.06em", marginBottom: "36px" }}>
      {title}
    </div>
    <div style={{ borderBottom: "1.5px solid #374151", marginBottom: "6px" }} />
    <div style={{ fontSize: "8pt", fontWeight: 700, color: "#111" }}>{role}</div>
    <div style={{ fontSize: "7pt", color: "#888", marginTop: "2px" }}>{subtitle}</div>
  </div>
);

const WorkOrderPrint: React.FC<WorkOrderPrintProps> = ({ job, onClose }) => {
  const statusColor = job.status === "completed"
    ? { bg: "#dcfce7", text: "#166534", border: "#86efac" }
    : job.status === "in-progress"
    ? { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" }
    : { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" };

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#wop-root) { display: none !important; }
          #wop-root { position: fixed !important; inset: 0 !important; background: white !important; overflow: visible !important; }
          .wop-controls { display: none !important; }
          @page { size: A4 portrait; margin: 15mm 18mm; }
        }
      `}</style>

      <div className="wop-controls" style={{ position: "fixed", top: 16, right: 24, zIndex: 10000, display: "flex", gap: 12 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "10px 20px", background: "#f59e0b", color: "#111", fontWeight: 800, borderRadius: 10, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(245,158,11,.4)" }}
        >Print / Save PDF</button>
        <button
          onClick={onClose}
          style={{ padding: "10px 20px", background: "white", color: "#333", fontWeight: 800, borderRadius: 10, fontSize: 13, border: "1px solid #ccc", cursor: "pointer" }}
        >Close</button>
      </div>

      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 9997 }}
        onClick={onClose}
        className="wop-controls"
      />

      <div
        id="wop-root"
        style={{ position: "fixed", inset: 0, zIndex: 9998, overflowY: "auto", display: "flex", justifyContent: "center", paddingTop: 56, paddingBottom: 40 }}
      >
        <div style={{ background: "white", width: "210mm", minHeight: "297mm", padding: "15mm 18mm", fontFamily: "'Arial','Helvetica Neue',sans-serif", fontSize: "10pt", color: "#111", boxShadow: "0 25px 60px rgba(0,0,0,.5)" }}>

          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "3px solid #f59e0b", paddingBottom: 12, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/images/intellitrack-logo.png" alt="IntelliTrack" style={{ height: 52, objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555" }}>Alibaton Heavy Equipment Corp.</div>
                <div style={{ fontSize: "7pt", color: "#888", marginTop: 2 }}>Heavy Lifting &amp; Tower Crane Services</div>
                <div style={{ fontSize: "7pt", color: "#888" }}>DOLE Accredited | ISO Compliant</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "20pt", fontWeight: 900, color: "#f59e0b", lineHeight: 1 }}>WORK ORDER</div>
              <div style={{ fontSize: "12pt", fontWeight: 800, fontFamily: "monospace", marginTop: 4 }}>{job.job_number}</div>
              <div style={{ fontSize: "7.5pt", color: "#777", marginTop: 4 }}>Date Issued: {fmt(job.created_at)}</div>
              <div style={{ display: "inline-block", marginTop: 6, padding: "2px 12px", borderRadius: 99, background: statusColor.bg, color: statusColor.text, fontSize: "7.5pt", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", border: `1px solid ${statusColor.border}` }}>
                {job.status.replace(/-/g, " ")}
              </div>
            </div>
          </div>

          {/* CLIENT + PROJECT */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", background: "#fafafa" }}>
              <div style={{ fontSize: "7pt", fontWeight: 800, textTransform: "uppercase", color: "#888", letterSpacing: "0.08em", borderBottom: "1px solid #e5e7eb", paddingBottom: 4, marginBottom: 8 }}>Client Information</div>
              <InfoRow label="Client / Company" value={job.customer?.company_name || job.customer_name} />
              {job.customer?.contact_person && <InfoRow label="Contact Person" value={job.customer.contact_person} />}
              {job.customer?.phone && <InfoRow label="Phone" value={job.customer.phone} />}
              {job.customer?.email && <InfoRow label="Email" value={job.customer.email} />}
              {(job.customer?.address || job.customer?.city) && <InfoRow label="Address" value={[job.customer?.address, job.customer?.city].filter(Boolean).join(", ")} />}
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", background: "#fafafa" }}>
              <div style={{ fontSize: "7pt", fontWeight: 800, textTransform: "uppercase", color: "#888", letterSpacing: "0.08em", borderBottom: "1px solid #e5e7eb", paddingBottom: 4, marginBottom: 8 }}>Project Details</div>
              <InfoRow label="Project Site" value={job.location || "—"} />
              <InfoRow label="Priority" value={job.priority ? job.priority.charAt(0).toUpperCase() + job.priority.slice(1) : "Medium"} />
              <InfoRow label="Mobilization Date" value={fmt(job.scheduled_date)} />
              <InfoRow label="Due Date" value={fmt(job.due_date)} />
              {job.completion_date && <InfoRow label="Completion Date" value={fmt(job.completion_date)} />}
              <InfoRow label="Issued By" value={job.creator?.name || "Sales Management"} />
            </div>
          </div>

          {/* SCOPE */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "7pt", fontWeight: 800, textTransform: "uppercase", color: "#888", letterSpacing: "0.08em", marginBottom: 6 }}>Scope of Work &amp; Project Directives</div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", background: "#fafafa", fontSize: "9pt", color: "#333", lineHeight: 1.6, minHeight: 44 }}>
              {job.description || "—"}
            </div>
          </div>

          {/* BOM TABLE */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "7pt", fontWeight: 800, textTransform: "uppercase", color: "#888", letterSpacing: "0.08em", marginBottom: 6 }}>Allocated Heavy Equipment &amp; Line Items (Bill of Materials)</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt" }}>
              <thead>
                <tr style={{ background: "#111827", color: "white" }}>
                  <th style={thS}>Code</th>
                  <th style={{ ...thS, textAlign: "left" }}>Equipment / Description</th>
                  <th style={{ ...thS, textAlign: "center" }}>Qty</th>
                  <th style={{ ...thS, textAlign: "center" }}>Unit</th>
                  <th style={{ ...thS, textAlign: "right" }}>Unit Rate</th>
                  <th style={{ ...thS, textAlign: "right" }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(!job.job_order_items || job.job_order_items.length === 0) ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 16, color: "#888", fontStyle: "italic", border: "1px solid #e5e7eb" }}>No equipment items listed.</td></tr>
                ) : job.job_order_items.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ ...tdS, fontFamily: "monospace", fontWeight: 700, color: "#d97706" }}>{item.equipment?.code || "EQUIP"}</td>
                    <td style={{ ...tdS, textAlign: "left" }}>
                      <div style={{ fontWeight: 600 }}>{item.equipment?.name || "Equipment Unit"}</div>
                      {item.notes && <div style={{ fontSize: "7.5pt", color: "#888", marginTop: 1 }}>{item.notes}</div>}
                    </td>
                    <td style={{ ...tdS, textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                    <td style={{ ...tdS, textAlign: "center", color: "#555" }}>{item.unit || "day"}</td>
                    <td style={{ ...tdS, textAlign: "right", fontFamily: "monospace" }}>{formatPeso(Number(item.unit_price))}</td>
                    <td style={{ ...tdS, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{formatPeso(Number(item.total_price))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f59e0b" }}>
                  <td colSpan={5} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, fontSize: "9pt", color: "#1c1917" }}>TOTAL CONTRACT VALUE:</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 900, fontSize: "11pt", color: "#1c1917", fontFamily: "monospace" }}>{formatPeso(job.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* NOTES */}
          {job.notes && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "7pt", fontWeight: 800, textTransform: "uppercase", color: "#888", letterSpacing: "0.08em", marginBottom: 6 }}>Site Safety, Gate Pass &amp; Logistical Notes</div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", background: "#fafafa", fontSize: "9pt", color: "#333", lineHeight: 1.6 }}>{job.notes}</div>
            </div>
          )}

          {/* TERMS */}
          <div style={{ marginBottom: 24, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, fontSize: "7.5pt", color: "#78350f" }}>
            <strong>Terms &amp; Conditions:</strong> This Work Order constitutes a binding service agreement upon the client countersignature. Payment: 50% Down Payment upon execution; 50% upon completion. DOLE safety and PPE requirements are mandatory on-site at all times.
          </div>

          {/* SIGNATURES */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }}>
            <SigBlock title="Prepared By" role="Sales Manager" subtitle="Sales & Commercial Department" />
            <SigBlock title="Authorized By" role="Operations Manager" subtitle="Operations & Dispatch Department" />
            <SigBlock title="Received & Accepted By" role="Client Representative" subtitle={job.customer?.company_name || job.customer_name} />
          </div>

          {/* FOOTER */}
          <div style={{ marginTop: 28, paddingTop: 10, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: "7pt", color: "#aaa" }}>
            <span>IntelliTrack Operations Management System</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#d97706" }}>{job.job_number}</span>
            <span>Printed: {new Date().toLocaleString("en-PH")}</span>
          </div>

        </div>
      </div>
    </>
  );
};

export default WorkOrderPrint;