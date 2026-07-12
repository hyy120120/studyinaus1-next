"use client";

// Client-side PDF report builder — replaces the Python/ReportLab backend
// (backend/pdf_report.py). Generates and downloads the same Subclass 500
// Visa Probability Report, entirely in the browser.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BREAKDOWN_LABELS } from "./scoring";

const PRIMARY = "#C55B43";
const SECONDARY = "#1A362B";
const MUTED = "#5C6A64";
const SURFACE = "#F1EFEB";
const INK = "#121815";
const BORDER = "#E3E0D8";

function fmtNumber(n) {
    const v = Number(n || 0);
    return v.toLocaleString("en-IN");
}

function loadPdfImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

export async function downloadVisaReportPdf(record) {
    const form = record.form || {};
    const score = record.score ?? 0;
    const tier = record.tier || "";
    const breakdown = record.breakdown || {};

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const marginX = 18;
    let y = 18;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - marginX * 2;

    // Header band
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(PRIMARY);
    doc.text("GOSTUDYINAUSTRALIA  ·  ONTRACK EDUCATION", marginX, y);
    // Cover the legacy text mark and place the same green site logo in its place.
    doc.setFillColor("#FFFFFF");
    doc.rect(marginX, y - 5, 70, 8, "F");
    try {
        const logo = await loadPdfImage("/gostudyustraliaGreen.png");
        doc.addImage(logo, "PNG", marginX, y - 10, 12, 12, undefined, "NONE");
    } catch {
        // Keep the report usable if the static image is temporarily unavailable.
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), pageWidth - marginX, y, { align: "right" });
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(SECONDARY);
    doc.text("Subclass 500 Visa Probability Report", marginX, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(MUTED);
    doc.text(`Prepared for ${form.full_name || "-"}  ·  ${form.email || ""}`, marginX, y);
    y += 10;

    // Score card
    const cardH = 34;
    doc.setFillColor(SURFACE);
    doc.setDrawColor(BORDER);
    doc.roundedRect(marginX, y, contentWidth, cardH, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor(PRIMARY);
    doc.text(String(score), pageWidth / 2, y + 18, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text("out of 100", pageWidth / 2, y + 24, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(PRIMARY);
    doc.text(`${tier.toUpperCase()} PROBABILITY`, pageWidth / 2, y + 30, { align: "center" });
    y += cardH + 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(INK);
    const summaryLines = doc.splitTextToSize(record.summary || "", contentWidth);
    doc.text(summaryLines, marginX, y);
    y += summaryLines.length * 5 + 6;

    // Breakdown table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(SECONDARY);
    doc.text("Score breakdown", marginX, y);
    y += 4;

    const breakdownRows = Object.entries(BREAKDOWN_LABELS).map(([k, meta]) => [
        meta.label,
        String(breakdown[k] ?? 0),
        String(meta.max),
    ]);
    autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX },
        head: [["Section", "Score", "Out of"]],
        body: breakdownRows,
        theme: "plain",
        styles: { fontSize: 9.5, cellPadding: 2.2, textColor: INK },
        headStyles: { fillColor: SECONDARY, textColor: "#FFFFFF", fontStyle: "bold" },
        alternateRowStyles: { fillColor: SURFACE },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    });
    y = doc.lastAutoTable.finalY + 8;

    const ensureSpace = (needed) => {
        if (y + needed > 280) {
            doc.addPage();
            y = 18;
        }
    };

    const section = (title, items, color) => {
        ensureSpace(16 + items.length * 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(SECONDARY);
        doc.text(title, marginX, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        if (!items.length) {
            doc.setTextColor(MUTED);
            doc.text("—", marginX, y);
            y += 6;
            return;
        }
        items.forEach((it) => {
            const lines = doc.splitTextToSize(it, contentWidth - 6);
            ensureSpace(lines.length * 5 + 2);
            doc.setTextColor(color);
            doc.text("•", marginX, y);
            doc.setTextColor(INK);
            doc.text(lines, marginX + 5, y);
            y += lines.length * 5 + 1.5;
        });
        y += 2;
    };

    section("Strengths", record.strengths || [], "#2D6C4A");
    section("Areas to improve", record.weaknesses || [], "#DD8226");
    section("Recommended next actions", record.recommendations || [], PRIMARY);

    // Profile snapshot (new page)
    doc.addPage();
    y = 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(SECONDARY);
    doc.text("Profile snapshot", marginX, y);
    y += 4;

    const education = (form.education || []).filter((item) => item.applicable).map((item) => { const percentage = Number(item.marks_total) ? ((Number(item.marks_obtained) / Number(item.marks_total)) * 100).toFixed(1) : "—"; return `${item.label}: ${item.marks_obtained}/${item.marks_total} (${percentage}%)`; }).join("; ");
    const employment = (form.employment_records || []).map((item) => `${item.status}${item.employer ? ` — ${item.employer}` : ""}`).join("; ");
    const sponsors = (form.sponsors || []).filter((item) => item.applicable);
    const sponsorSummary = sponsors.map((item) => `${item.relation} (${item.employment_type}): INR ${fmtNumber(item.annual_income_inr)}`).join("; ");
    const sponsorDocuments = sponsors.flatMap((item) => (item.docs || []).filter((doc) => doc.status === "yes").map((doc) => `${item.relation}: ${doc.label}`)).join("; ");
    const snapFields = [
        ["Age", form.age],
        ["Date of birth", form.dob],
        ["Nationality", form.nationality],
        ["Highest qualification", form.highest_qualification],
        ["Academic records", education],
        ["English test", `${form.english_test || ""} ${form.overall_score ?? ""}`],
        ["Exam attempts", form.exam_attempts],
        ["Marital status", form.is_married ? "Married" : "Not married"],
        ["Spouse accompanying", form.is_married ? (form.spouse_will_accompany ? "Yes" : "No") : "—"],
        ["Employment records", employment || "—"],
        ["Work relevant to course", form.work_relevant_to_course ? "Yes" : "No"],
        ["Intended course", form.intended_course],
        ["Intended university", form.intended_university || "—"],
        ["Intake year", form.intake_year],
        ["Course in line with education", form.course_in_line_with_previous_education ? "Yes" : "No"],
        ["Sponsors", sponsorSummary],
        ["Total annual sponsor income (INR)", fmtNumber(sponsors.reduce((total, item) => total + (Number(item.annual_income_inr) || 0), 0))],
        ["Sponsor documents available", sponsorDocuments],
        ["Savings (INR)", fmtNumber(form.savings_amount_inr)],
        ["Fixed deposits (INR)", fmtNumber(form.fixed_deposits_amount_inr)],
        ["Investments (INR)", fmtNumber(form.investments_amount_inr)],
        ["Other funds (INR)", fmtNumber(form.other_funds_amount_inr)],
        ["Education loan required", form.education_loan_required ? `Yes (${form.loan_type || ""}, INR ${fmtNumber(form.loan_amount_inr)})` : "No"],
        ["Previous visa refusal", form.previous_visa_refusal ? "Yes" : "No"],
        ["Refusal country", form.refusal_country || "—"],
    ].map(([k, v]) => [k, String(v ?? "—")]);

    autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX },
        body: snapFields,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2.2 },
        columnStyles: {
            0: { textColor: MUTED, cellWidth: 70 },
            1: { textColor: INK, fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: SURFACE },
    });
    y = doc.lastAutoTable.finalY + 8;

    ensureSpace(16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED);
    const disclaimer = doc.splitTextToSize(
        "This report is a guidance estimate based on self-reported information and Ontrack Education's " +
        "internal scoring framework. It is not a guarantee of a visa outcome. Final approval is at the sole " +
        "discretion of the Australian Department of Home Affairs.",
        contentWidth
    );
    doc.text(disclaimer, marginX, y);

    const filename = `Visa-Report-${(form.full_name || "student").replace(/\s+/g, "_")}.pdf`;
    doc.save(filename);
}
