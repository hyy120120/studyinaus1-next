"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Plus,
  Check,
  ChevronsUpDown,
  Mail,
  ShieldCheck,
  Upload,
  FileText,
  User,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { computeScore, EDUCATION_LEVELS } from "@/lib/scoring";
import {
  educationCompletionYear,
  educationTimeline,
  educationYears,
  isSchoolQualification,
  normaliseEducationTimeline,
} from "@/lib/educationTimeline";
import {
  englishExamDateBounds,
  validateEnglishExamDate,
} from "@/lib/englishExamTimeline";
import { db, isFirebaseConfigured, COLLECTIONS } from "@/lib/firebase";
import {
  EMAIL_RE,
  isTenDigitPhone,
  validateCalculatorStep,
  validateCalculatorForm,
} from "@/lib/validation";
import { POLICY_VERSIONS } from "@/lib/policies";
import { COURSES } from "@/data/courses";
import MiniMarksheetScanner from "@/components/MarksheetOCR/MiniMarksheetScanner";
import SponsorSection from "@/components/sponsor/SponsorSection";
import UniversityPicker from "../university/UniversityPicker";
import { australianUniversities } from "@/lib/data/australianUniversities";

const STEPS = [
  "Personal Details",
  "Academic Details",
  "English Language Test",
  "Marital Details",
  "Work Details",
  "Additional Details",
  "Sponsor Income",
  "Sponsor Proof",
  "Financial Details",
  "Review & Submit",
];

const CURRENT_YEAR = new Date().getFullYear();
const EMPLOYMENT_STATUSES = [
  "Employed",
  "Self-employed",
  "Not Applicable",
  "Unemployed",
  "Student",
];
const SALARY_MODES = ["Bank Transfer", "Cash", "Cheque"];
const SPONSOR_RELATIONS = [
  "Father",
  "Mother",
  "Uncle",
  "Aunt",
  "Brother",
  "Sister",
  "Self",
  "Spouse",
  "Grandparent",
  "Other",
];
const SPONSOR_OCCUPATIONS = [
  "Salaried",
  "Business",
  "Agriculture",
  "Retired",
  "Other",
];

const createEmploymentRecord = () => ({
  id: `employment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  status: "Not Applicable",
  employer: "",
  date_of_joining: "",
  last_working_day: "",
  currently_working: true,
  itr_filed: false,
  salary_mode: "Bank Transfer",
});

const gradeFor = (obtained, total) => {
  const percentage =
    Number(total) > 0 ? (Number(obtained) / Number(total)) * 100 : null;
  if (percentage === null || !Number.isFinite(percentage)) return null;
  const grade =
    percentage >= 85
      ? "High Distinction"
      : percentage >= 75
        ? "Distinction"
        : percentage >= 65
          ? "Credit"
          : percentage >= 50
            ? "Pass"
            : "Below pass";
  return { percentage: percentage.toFixed(1), grade };
};

// ── Intended-course level filtering ─────────────────────────────────────────
// Courses carry no explicit level field, so the level is detected from the
// course title. Titles that match nothing (level === null) are always shown,
// so admin-managed courses never disappear silently.
const COURSE_LEVEL_PATTERNS = [
  { level: "doctorate", pattern: /(ph\.?\s?d|doctorate|doctoral)/i },
  {
    level: "postgraduate",
    pattern:
      /(master|mba|m\.?\s?sc|m\.?\s?tech|m\.?\s?e\b|mphil|postgraduate|graduate\s+(certificate|diploma)|pg\s?dip)/i,
  },
  {
    level: "undergraduate",
    pattern:
      /(bachelor|b\.?\s?sc|b\.?\s?tech|b\.?\s?e\b|bba|bca|b\.?\s?com|undergraduate|associate degree)/i,
  },
  { level: "diploma", pattern: /(diploma|certificate|foundation)/i },
];

const detectCourseLevel = (title = "") => {
  for (const { level, pattern } of COURSE_LEVEL_PATTERNS) {
    if (pattern.test(title)) return level;
  }
  return null;
};

// Which course levels make sense as the *next* step for each completed
// qualification (keys from EDUCATION_LEVELS).
const COURSE_LEVELS_AFTER = {
  y10: ["undergraduate", "diploma"],
  y12: ["undergraduate", "diploma"],
  graduate: ["postgraduate", "doctorate"],
  postgraduate: ["postgraduate", "doctorate"],
  phd: null, // PhD holders can aim anywhere — no filter
};

const QUALIFICATION_LEVEL_HINT = {
  y10: "Showing Bachelor / diploma-level courses — the usual next step after 10th.",
  y12: "Showing Bachelor-level courses — the usual next step after 12th.",
  graduate:
    "Showing Master / PhD-level courses — the usual next step after graduation.",
  postgraduate: "Showing Master / PhD-level courses.",
};

const filterCoursesForQualification = (courses, qualificationKey) => {
  const allowed = COURSE_LEVELS_AFTER[qualificationKey];
  if (!allowed) return courses;
  return courses.filter((course) => {
    const level = detectCourseLevel(course.title);
    return level === null || allowed.includes(level);
  });
};

const ACCEPT_DOC_UPLOAD = ".pdf,.jpg,.jpeg,.png";

const INITIAL = {
  // Personal
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  dob: "",
  age: 0,
  nationality: "Indian",
  has_passport: false,
  passport_issue_date: "",
  passport_expiry_date: "",
  intended_course: "",
  intended_university: "",
  intake_year: CURRENT_YEAR + 1,
  highest_qualification: "",
  privacy_consent: false,
  terms_consent: false,

  // Academic
  education: EDUCATION_LEVELS.map((l) => ({
    key: l.key,
    label: l.label,
    applicable: false,
    stream: "",
    marks_obtained: "",
    marks_total: "",
    start_year: "",
    end_year: "",
    passout_year: "",
    has_backlogs: false,
    backlog_count: "",
    backlogs_cleared: true,
    marksheet_url: "",
  })),

  // English
  english_test: "IELTS",
  exam_date: "",
  tentative_exam_date: "",
  listening: "",
  reading: "",
  writing: "",
  speaking: "",
  overall_score: "",
  exam_attempts: "",

  // Sponsors & income proof
  sponsors: SPONSOR_RELATIONS.map((relation) => ({
    id: relation.toLowerCase(),
    relation,
    applicable: false,
    employment_type: "",
    other_occupation: "",
    itr_timely: false,
    itr_3yr: false,
    annual_income_inr: "",
    docs: [],
  })),

  // Work
  work1_status: "Not Applicable",
  work1_employer: "",
  work1_date_of_joining: "",
  work1_last_working_day: "",
  work1_currently_working: true,
  work1_itr_filed: false,
  work1_salary_mode: "Bank Transfer",
  work2_status: "",
  work2_employer: "",
  work2_date_of_joining: "",
  work2_last_working_day: "",
  work2_currently_working: true,
  work2_itr_filed: false,
  work2_salary_mode: "Bank Transfer",
  has_second_employment: false,
  employment_records: [createEmploymentRecord()],
  work_relevant_to_course: false,
  work_verification_done: false,
  work_verification_contact_name: "",
  work_verification_contact_phone: "",
  work_verification_contact_email: "",
  work_relevance_explanation: "",

  // Visa & loan
  course_in_line_with_previous_education: true,
  course_change_reason: "",
  applied_visa_before: "None",
  previous_visa_refusal: false,
  refusal_country: "",
  refusal_reason: "",
  education_loan_required: false,
  loan_sponsor_id: "",
  loan_amount_inr: "",
  savings_available: false,
  savings_amount_inr: "",
  fixed_deposits_available: false,
  fixed_deposits_amount_inr: "",
  investments_available: false,
  investments_amount_inr: "",
  other_funds_available: false,
  other_funds_amount_inr: "",
  mist_account_holder_name: "",
  mist_account_holder_relation: "",
  mist_fund_source: "",
  mist_amount_inr: "",
  mist_transfer_timeline: "",

  // Marital
  is_married: false,
  has_child: false,
  child_count: "",
  spouse_will_accompany: false,
  spouse_qualification: "",
  spouse_activity: "",
};

function Field({ label, children, hint, error, testId }) {
  return (
    <div className="space-y-2" data-testid={testId}>
      <Label className="text-sm font-medium text-secondary">{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function previousEducationEnd(education, key) {
  const index = education.findIndex((level) => level.key === key);
  const previousLevel = education
    .slice(0, index)
    .filter((level) => level.applicable && educationCompletionYear(level))
    .at(-1);
  return educationCompletionYear(previousLevel) || "";
}

const OTHER_YEAR_OPTION = "__other_year__";

// Shared year picker for education dates. Shows only the most realistic
// years (see educationYears) plus an "Other year…" escape hatch that reveals
// a type-in field, so unusual cases (older applicants, long gap years) are
// never blocked. Validation still checks the full realistic DOB range, so a
// typed year like 2009 for someone born in 1980 is accepted.
function EducationYearPicker({
  dob,
  range,
  value,
  onChange,
  placeholder,
  testId,
  noYearsHint,
}) {
  const [otherMode, setOtherMode] = useState(false);

  if (!dob) {
    return (
      <p className="px-2 py-1.5 text-sm text-muted-foreground">
        Select your date of birth in the first step to see the available
        years.
      </p>
    );
  }

  const years = educationYears(range);
  const valueIsOther = Boolean(value) && !years.includes(String(value));
  const showOther = otherMode || valueIsOther;

  if (years.length === 0) {
    return (
      <p className="px-2 py-1.5 text-sm text-muted-foreground">{noYearsHint}</p>
    );
  }

  return (
    <div className="space-y-2">
      <Select
        value={showOther ? OTHER_YEAR_OPTION : value}
        onValueChange={(selected) => {
          if (selected === OTHER_YEAR_OPTION) {
            setOtherMode(true);
            return;
          }
          setOtherMode(false);
          onChange(selected);
        }}
      >
        <SelectTrigger data-testid={testId}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
          <SelectItem value={OTHER_YEAR_OPTION}>Other year…</SelectItem>
        </SelectContent>
      </Select>
      {showOther && (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your year, e.g. 2009"
          data-testid={`${testId}-other`}
        />
      )}
    </div>
  );
}

function PassoutYearSelect({ level, dob, education, onChange }) {
  const noEligibleYears =
    level.key === "y12"
      ? "No valid 12th passout year is available for this DOB and 10th passout year."
      : "No valid passout year is available for this date of birth.";
  return (
    <EducationYearPicker
      dob={dob}
      range={
        educationTimeline(
          dob,
          level.key,
          "",
          previousEducationEnd(education, level.key),
        ).passout
      }
      value={level.passout_year}
      onChange={onChange}
      placeholder="Select passout year"
      testId={`select-edu_passout_${level.key}`}
      noYearsHint={noEligibleYears}
    />
  );
}

function YesNo({ value, onChange, testId, yesLabel = "Yes", noLabel = "No" }) {
  return (
    <RadioGroup
      value={String(value)}
      onValueChange={(v) => onChange(v === "true")}
      className="flex gap-6"
    >
      <div className="flex items-center gap-2">
        <RadioGroupItem
          value="true"
          id={`${testId}-yes`}
          data-testid={`${testId}-yes`}
        />
        <Label htmlFor={`${testId}-yes`}>{yesLabel}</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem
          value="false"
          id={`${testId}-no`}
          data-testid={`${testId}-no`}
        />
        <Label htmlFor={`${testId}-no`}>{noLabel}</Label>
      </div>
    </RadioGroup>
  );
}

function calcAge(dobStr) {
  if (!dobStr) return 0;
  const dob = new Date(dobStr);
  if (isNaN(dob)) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function CalculatorClient({ today: initialToday }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [today, setToday] = useState(initialToday);
  const [managedCourses, setManagedCourses] = useState(null);
  const [otherCourseFields, setOtherCourseFields] = useState({});
  const [docUploading, setDocUploading] = useState({});
  const [calculatorUnlocked, setCalculatorUnlocked] = useState(false);

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const markTouched = (...keys) =>
    setTouched((current) => ({
      ...current,
      ...Object.fromEntries(keys.map((key) => [key, true])),
    }));
  const set = (k, v) => {
    markTouched(k);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const setDob = (dob) => {
    markTouched("dob");
    setForm((f) => ({
      ...f,
      dob,
      age: calcAge(dob),
      education: normaliseEducationTimeline(f.education, dob),
      exam_date: validateEnglishExamDate(f.exam_date, dob, f.english_test)
        ? ""
        : f.exam_date,
      tentative_exam_date: validateEnglishExamDate(
        f.tentative_exam_date,
        dob,
        f.english_test,
        { tentative: true, today },
      )
        ? ""
        : f.tentative_exam_date,
    }));
  };

  const updateEducation = (key, field, value) => {
    const errorKey = {
      stream: `edu_${key}_stream`,
      marks_obtained: `edu_${key}`,
      marks_total: `edu_${key}`,
      start_year: `edu_${key}_start`,
      end_year: `edu_${key}_end`,
      passout_year: `edu_${key}_passout`,
      backlog_count: `edu_${key}_bl`,
    }[field];
    if (errorKey) markTouched(errorKey);
    setForm((f) => ({
      ...f,
      education: normaliseEducationTimeline(
        f.education.map((l) => (l.key === key ? { ...l, [field]: value } : l)),
        f.dob,
      ),
    }));
  };

  const updateSponsor = (id, field, value) => {
    if (field === "annual_income_inr" || field === "employment_type")
      markTouched(`sponsor_${id}`);
    setForm((f) => ({
      ...f,
      sponsors: f.sponsors.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const updateEmployment = (id, field, value) => {
    if (field === "employer") markTouched(`employment_${id}_employer`);
    if (field === "date_of_joining") markTouched(`employment_${id}_joining`);
    setForm((f) => ({
      ...f,
      employment_records: f.employment_records.map((record) =>
        record.id === id ? { ...record, [field]: value } : record,
      ),
    }));
  };
  const addEmployment = () =>
    setForm((f) => ({
      ...f,
      employment_records: [...f.employment_records, createEmploymentRecord()],
    }));
  const removeEmployment = (id) =>
    setForm((f) => ({
      ...f,
      employment_records:
        f.employment_records.length > 1
          ? f.employment_records.filter((record) => record.id !== id)
          : f.employment_records,
    }));
  const addSponsor = (relation) =>
    setForm((f) => ({
      ...f,
      sponsors: f.sponsors.map((s) =>
        s.relation === relation ? { ...s, applicable: true } : s,
      ),
    }));
  const removeSponsor = (id) => updateSponsor(id, "applicable", false);

  const selectHighestQualification = (key) => {
    markTouched("highest_qualification");
    setForm((f) => {
      const education = f.education.map((level, index) => ({
        ...level,
        applicable:
          index <= EDUCATION_LEVELS.findIndex((item) => item.key === key),
      }));
      return {
        ...f,
        highest_qualification: key,
        education: normaliseEducationTimeline(education, f.dob),
      };
    });
  };

  const updateSponsorEmployment = (id, employment_type) => {
    markTouched(`sponsor_${id}`);
    setForm((f) => ({
      ...f,
      sponsors: f.sponsors.map((s) =>
        s.id === id
          ? {
              ...s,
              employment_type,
              docs: documentsForSponsor({ employment_type }).map((doc) => ({
                ...doc,
                status: "",
                year_established: "",
                remarks: "",
                file_url: "",
                file_name: "",
              })),
            }
          : s,
      ),
    }));
  };

  const updateSponsorDoc = (id, docKey, field, value) => {
    markTouched(
      field === "year_established"
        ? `sponsor_doc_year_${id}_${docKey}`
        : field === "file_url"
          ? `sponsor_doc_file_${id}_${docKey}`
          : `sponsor_doc_${id}_${docKey}`,
    );
    setForm((f) => ({
      ...f,
      sponsors: f.sponsors.map((s) =>
        s.id === id
          ? {
              ...s,
              docs: s.docs.map((doc) =>
                doc.key === docKey ? { ...doc, [field]: value } : doc,
              ),
            }
          : s,
      ),
    }));
  };

  const uploadSponsorDocument = async (sponsorId, docKey, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large — maximum 10 MB.");
      return;
    }
    const uploadKey = `${sponsorId}_${docKey}`;
    setDocUploading((current) => ({ ...current, [uploadKey]: true }));
    try {
      // Documents are stored in Cloudinary (see app/api/upload/route.js).
      const body = new FormData();
      body.append("document", file);
      body.append("folder", "sponsor_documents");
      const response = await fetch("/api/upload", { method: "POST", body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.fileUrl) {
        throw new Error(result.error || "Upload failed. Please try again.");
      }
      updateSponsorDoc(sponsorId, docKey, "file_url", result.fileUrl);
      updateSponsorDoc(sponsorId, docKey, "file_name", file.name);
      toast.success(`${file.name} uploaded.`);
    } catch (error) {
      toast.error(error?.message || "Upload failed. Please try again.");
    } finally {
      setDocUploading((current) => ({ ...current, [uploadKey]: false }));
    }
  };

  const totalSponsorIncome = useMemo(
    () =>
      form.sponsors
        .filter((s) => s.applicable)
        .reduce((total, s) => total + (Number(s.annual_income_inr) || 0), 0),
    [form.sponsors],
  );

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    getDocs(collection(db, COLLECTIONS.COURSES))
      .then((snapshot) =>
        setManagedCourses(
          snapshot.docs.map((course) => ({ id: course.id, ...course.data() })),
        ),
      )
      .catch((err) => {
        console.warn(
          "Could not load managed courses, using local catalog:",
          err,
        );
        setManagedCourses([]);
      });
  }, []);

  // Fall back to the built-in catalog whenever the managed (Firestore) list
  // is unavailable or empty, so the picker is never blank.
  const courseCatalog = useMemo(
    () =>
      managedCourses && managedCourses.length > 0 ? managedCourses : COURSES,
    [managedCourses],
  );

  // Intended-course list adapts to the highest completed qualification:
  // 10th/12th → Bachelor-level courses, Graduation → Master/PhD-level courses.
  const intendedCourseCatalog = useMemo(
    () =>
      filterCoursesForQualification(courseCatalog, form.highest_qualification),
    [courseCatalog, form.highest_qualification],
  );
  const courseLevelHint = QUALIFICATION_LEVEL_HINT[form.highest_qualification];

  useEffect(() => {
    if (Object.keys(touched).length === 0) return;
    const stepErrors = validateCalculatorStep(step, form);
    setErrors((current) => {
      const next = { ...current };
      Object.keys(touched).forEach((key) => {
        if (stepErrors[key]) next[key] = stepErrors[key];
        else delete next[key];
      });
      return next;
    });
  }, [form, step, touched]);

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  const completedExamDateBounds = useMemo(
    () => englishExamDateBounds(form.dob, form.english_test, { today }),
    [form.dob, form.english_test, today],
  );
  const tentativeExamDateBounds = useMemo(
    () =>
      englishExamDateBounds(form.dob, form.english_test, {
        tentative: true,
        today,
      }),
    [form.dob, form.english_test, today],
  );

  const goNext = () => {
    const stepErrors = validateCalculatorStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error("Please fix the highlighted fields before continuing.");
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const submit = async () => {
    const allErrors = validateCalculatorForm(form);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast.error("Please fix the highlighted fields before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const formForScoring = {
        ...form,
        full_name: `${form.first_name} ${form.last_name}`.trim(),
      };
      const context = await fetch("/api/client-context", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : {}))
        .catch(() => ({}));
      formForScoring.consent = {
        status: "accepted",
        accepted_at: new Date().toISOString(),
        privacy_policy_version: POLICY_VERSIONS.privacy,
        terms_version: POLICY_VERSIONS.terms,
        consent_policy_version: POLICY_VERSIONS.consent,
        privacy_consent: form.privacy_consent,
        terms_consent: form.terms_consent,
        ip_address: context.ipAddress || null,
      };
      const scoring = computeScore(formForScoring);
      const created_at = new Date().toISOString();
      const result = { form: formForScoring, ...scoring, created_at };

      let id;
      if (isFirebaseConfigured) {
        const ref = await addDoc(
          collection(db, COLLECTIONS.VISA_APPLICATIONS),
          {
            ...result,
            created_at: serverTimestamp(),
          },
        );
        id = ref.id;
        await addDoc(collection(db, COLLECTIONS.CONSENT_AUDIT_LOGS), {
          source: "visa_calculator",
          user_id: id,
          applicant_name: formForScoring.full_name,
          email: formForScoring.email,
          mobile: formForScoring.phone,
          ip_address: formForScoring.consent.ip_address,
          consent_status: "accepted",
          privacy_policy_version: POLICY_VERSIONS.privacy,
          terms_version: POLICY_VERSIONS.terms,
          accepted_at: serverTimestamp(),
          last_updated_at: serverTimestamp(),
        });
      } else {
        id = `local-${Date.now()}`;
      }

      const data = { id, ...result };
      sessionStorage.setItem("gsa_last_result", JSON.stringify(data));
      router.push(`/result/${id}`);
    } catch (e) {
      toast.error(e?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const unlockCalculator = ({ name, email, phone }) => {
    const [first_name = "", ...lastNameParts] = name.trim().split(/\s+/);
    setForm((current) => ({
      ...current,
      first_name,
      last_name: lastNameParts.join(" "),
      email: email.trim(),
      phone,
      privacy_consent: true,
      terms_consent: true,
    }));
    setCalculatorUnlocked(true);
  };

  if (!calculatorUnlocked)
    return <CalculatorVerificationGate onVerified={unlockCalculator} />;

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 10);

  const max = maxDate.toISOString().split("T")[0];

  return (
    <div data-testid="calculator-page" className="bg-background min-h-screen">
      <section className="gsa-container pt-12 md:pt-16 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="gsa-overline mb-3">Visa Probability Calculator</div>
          <h1 className="gsa-h2 mb-2">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </h1>
          <p className="text-muted-foreground text-sm">
            All your answers stay private. We use them only to compute your
            score.
          </p>

          {step === 0 && (
            <div className="mt-6 text-sm leading-relaxed text-muted-foreground border-l-2 border-primary/40 pl-4">
              <p className="mb-3">
                This is a detailed profile-readiness check, built on the same
                intake questions our counsellors use internally — personal
                details, academics & backlogs, English, sponsor income &
                documentation, work history, visa/loan details, and marital
                status.
              </p>
              <p>
                Nothing here is a guarantee — only the relevant immigration
                authority can grant a visa — but this score tells you exactly
                where to invest effort before applying.
              </p>
            </div>
          )}

          <div
            className="h-2 bg-surface-alt rounded-full overflow-hidden mt-6"
            data-testid="progress-bar"
          >
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <section className="gsa-container pb-20">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="bg-white p-8 md:p-12 rounded-2xl border border-border shadow-sm"
            >
              {/* STEP 0 — PERSONAL */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Field
                      label="First name"
                      error={errors.first_name}
                      testId="field-first_name"
                    >
                      <Input
                        data-testid="input-first_name"
                        value={form.first_name}
                        onChange={(e) => set("first_name", e.target.value)}
                        placeholder="Rudra"
                      />
                    </Field>
                    <Field
                      label="Last name"
                      error={errors.last_name}
                      testId="field-last_name"
                    >
                      <Input
                        data-testid="input-last_name"
                        value={form.last_name}
                        onChange={(e) => set("last_name", e.target.value)}
                        placeholder="Kapadia"
                      />
                    </Field>
                    <Field
                      label="Email address"
                      error={errors.email}
                      testId="field-email"
                    >
                      <Input
                        data-testid="input-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="you@example.com"
                      />
                    </Field>
                    <Field
                      label="Contact number"
                      error={errors.phone}
                      testId="field-phone"
                    >
                      <Input
                        data-testid="input-phone"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) =>
                          set(
                            "phone",
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder="10-digit phone number"
                      />
                    </Field>
                    <Field
                      label="Date of birth"
                      hint={form.dob ? `Age: ${form.age}` : undefined}
                      error={errors.dob}
                      testId="field-dob"
                    >
                      <Input
                        data-testid="input-dob"
                        type="date"
                        value={form.dob}
                        onChange={(e) => setDob(e.target.value)}
                        max={today}
                      />
                    </Field>
                    <Field
                      label="Nationality"
                      error={errors.nationality}
                      testId="field-nationality"
                    >
                      <Input
                        data-testid="input-nationality"
                        value={form.nationality}
                        onChange={(e) => set("nationality", e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Do you have a valid passport?"
                      error={errors.has_passport}
                      testId="field-has_passport"
                    >
                      <YesNo
                        value={form.has_passport}
                        onChange={(v) => {
                          set("has_passport", v);
                          if (!v) {
                            set("passport_issue_date", "");
                            set("passport_expiry_date", "");
                          }
                        }}
                        testId="radio-has_passport"
                      />
                    </Field>
                    {form.has_passport && (
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border bg-muted/40 p-4">
                        <Field
                          label="Passport issue date"
                          error={errors.passport_issue_date}
                          testId="field-passport_issue_date"
                        >
                          <Input
                            data-testid="input-passport_issue_date"
                            type="date"
                            value={form.passport_issue_date}
                            onChange={(e) =>
                              set("passport_issue_date", e.target.value)
                            }
                            max={today}
                          />
                        </Field>
                        <Field
                          label="Passport expiry date"
                          error={errors.passport_expiry_date}
                          testId="field-passport_expiry_date"
                        >
                          <Input
                            data-testid="input-passport_expiry_date"
                            type="date"
                            value={form.passport_expiry_date}
                            onChange={(e) =>
                              set("passport_expiry_date", e.target.value)
                            }
                            min={today}
                            max={max}
                          />
                        </Field>
                      </div>
                    )}
                    <Field
                      label="Intended intake year"
                      error={errors.intake_year}
                      testId="field-intake_year"
                    >
                      <Input
                        data-testid="input-intake_year"
                        type="number"
                        value={form.intake_year}
                        onChange={(e) => set("intake_year", +e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Highest completed qualification"
                      error={errors.highest_qualification}
                      testId="field-highest_qualification"
                    >
                      <Select
                        value={form.highest_qualification}
                        onValueChange={selectHighestQualification}
                      >
                        <SelectTrigger data-testid="select-highest_qualification">
                          <SelectValue placeholder="Select qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_LEVELS.map((level) => (
                            <SelectItem key={level.key} value={level.key}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field
                      label="Intended university (optional)"
                      testId="field-intended_university"
                    >
                      <UniversityPicker
                        universities={australianUniversities}
                        value={form.intended_university}
                        onChange={(value) => set("intended_university", value)}
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field
                        label="Intended course"
                        hint={courseLevelHint}
                        error={errors.intended_course}
                        testId="field-intended_course"
                      >
                        <CoursePicker
                          courses={intendedCourseCatalog}
                          value={form.intended_course}
                          onChange={(value) => set("intended_course", value)}
                          isOther={Boolean(otherCourseFields.intended_course)}
                          onOtherChange={(isOther) =>
                            setOtherCourseFields((current) => ({
                              ...current,
                              intended_course: isOther,
                            }))
                          }
                          testId="select-intended_course"
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1 — ACADEMIC (Marks, Grading & Backlogs) */}
              {step === 1 && (
                <div className="space-y-6">
                  {errors.education && (
                    <p className="text-xs text-destructive">
                      {errors.education}
                    </p>
                  )}

                  {form.education
                    .filter((lvl) => lvl.applicable)
                    .map((lvl) => (
                      <div
                        key={lvl.key}
                        className="border border-border rounded-xl p-5"
                        data-testid={`edu-card-${lvl.key}`}
                      >
                        {/* ── Card header ──────────────────────────────────────────── */}
                        <div className="mb-4">
                          <span className="font-display font-bold text-secondary">
                            {lvl.label}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed qualification
                          </p>
                        </div>

                        {/* ── Fields grid ──────────────────────────────────────────── */}
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Stream / Course */}
                          {!["y10", "y12"].includes(lvl.key) && (
                            <Field
                              label="Stream / Course"
                              error={errors[`edu_${lvl.key}_stream`]}
                              testId={`field-edu_stream_${lvl.key}`}
                            >
                              <CoursePicker
                                courses={courseCatalog}
                                value={lvl.stream}
                                onChange={(value) =>
                                  updateEducation(lvl.key, "stream", value)
                                }
                                isOther={Boolean(
                                  otherCourseFields[`edu_${lvl.key}_stream`],
                                )}
                                onOtherChange={(isOther) =>
                                  setOtherCourseFields((cur) => ({
                                    ...cur,
                                    [`edu_${lvl.key}_stream`]: isOther,
                                  }))
                                }
                                testId={`select-edu_stream_${lvl.key}`}
                              />
                            </Field>
                          )}

                          {/* Marks obtained */}
                          <Field
                            label="Marks obtained"
                            error={errors[`edu_${lvl.key}`]}
                            testId={`field-edu_marks_${lvl.key}`}
                          >
                            <Input
                              type="number"
                              value={lvl.marks_obtained}
                              onChange={(e) =>
                                updateEducation(
                                  lvl.key,
                                  "marks_obtained",
                                  e.target.value,
                                )
                              }
                              data-testid={`input-edu_marks_obtained_${lvl.key}`}
                            />
                          </Field>

                          {/* Total marks */}
                          <Field
                            label="Total marks"
                            testId={`field-edu_total_${lvl.key}`}
                          >
                            <Input
                              type="number"
                              value={lvl.marks_total}
                              onChange={(e) =>
                                updateEducation(
                                  lvl.key,
                                  "marks_total",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g. 100"
                              data-testid={`input-edu_marks_total_${lvl.key}`}
                            />
                          </Field>

                          {/* Year fields */}
                          {isSchoolQualification(lvl.key) ? (
                            <Field
                              label="Passout year"
                              error={errors[`edu_${lvl.key}_passout`]}
                              testId={`field-edu_passout_${lvl.key}`}
                            >
                              <PassoutYearSelect
                                level={lvl}
                                dob={form.dob}
                                education={form.education}
                                onChange={(value) =>
                                  updateEducation(
                                    lvl.key,
                                    "passout_year",
                                    value,
                                  )
                                }
                              />
                            </Field>
                          ) : (
                            <>
                              <Field
                                label="Start year"
                                error={errors[`edu_${lvl.key}_start`]}
                                testId={`field-edu_start_${lvl.key}`}
                              >
                                <EducationYearPicker
                                  dob={form.dob}
                                  range={
                                    educationTimeline(
                                      form.dob,
                                      lvl.key,
                                      lvl.start_year,
                                      previousEducationEnd(
                                        form.education,
                                        lvl.key,
                                      ),
                                    ).start
                                  }
                                  value={lvl.start_year}
                                  onChange={(value) =>
                                    updateEducation(
                                      lvl.key,
                                      "start_year",
                                      value,
                                    )
                                  }
                                  placeholder="Select start year"
                                  testId={`select-edu_start_${lvl.key}`}
                                  noYearsHint="No valid start year is available for this date of birth."
                                />
                              </Field>

                              <Field
                                label="End year"
                                error={errors[`edu_${lvl.key}_end`]}
                                testId={`field-edu_end_${lvl.key}`}
                              >
                                <EducationYearPicker
                                  dob={form.dob}
                                  range={
                                    educationTimeline(
                                      form.dob,
                                      lvl.key,
                                      lvl.start_year,
                                      previousEducationEnd(
                                        form.education,
                                        lvl.key,
                                      ),
                                    ).end
                                  }
                                  value={lvl.end_year}
                                  onChange={(value) =>
                                    updateEducation(lvl.key, "end_year", value)
                                  }
                                  placeholder="Select end year"
                                  testId={`select-edu_end_${lvl.key}`}
                                  noYearsHint="No valid end year is available for this date of birth."
                                />
                              </Field>
                            </>
                          )}

                          {/* Calculated result box — UNCHANGED UI */}
                          <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                              Calculated result
                            </p>
                            {gradeFor(lvl.marks_obtained, lvl.marks_total) ? (
                              <p className="font-semibold text-secondary mt-1">
                                {
                                  gradeFor(lvl.marks_obtained, lvl.marks_total)
                                    .percentage
                                }
                                % &nbsp;·&nbsp;
                                {
                                  gradeFor(lvl.marks_obtained, lvl.marks_total)
                                    .grade
                                }
                              </p>
                            ) : (
                              <p className="text-muted-foreground mt-1">
                                Enter marks to calculate
                              </p>
                            )}
                          </div>

                          {/* Backlogs */}
                          <Field
                            label="Backlogs?"
                            testId={`field-edu_bl_${lvl.key}`}
                          >
                            <YesNo
                              value={lvl.has_backlogs}
                              onChange={(v) =>
                                updateEducation(lvl.key, "has_backlogs", v)
                              }
                              testId={`radio-edu_bl_${lvl.key}`}
                            />
                          </Field>

                          {lvl.has_backlogs && (
                            <>
                              <Field
                                label="No. of backlogs"
                                error={errors[`edu_${lvl.key}_bl`]}
                                testId={`field-edu_blcount_${lvl.key}`}
                              >
                                <Input
                                  type="number"
                                  value={lvl.backlog_count}
                                  onChange={(e) =>
                                    updateEducation(
                                      lvl.key,
                                      "backlog_count",
                                      e.target.value,
                                    )
                                  }
                                  data-testid={`input-edu_blcount_${lvl.key}`}
                                />
                              </Field>

                              <Field
                                label="Cleared?"
                                testId={`field-edu_blcleared_${lvl.key}`}
                              >
                                <YesNo
                                  value={lvl.backlogs_cleared}
                                  onChange={(v) =>
                                    updateEducation(
                                      lvl.key,
                                      "backlogs_cleared",
                                      v,
                                    )
                                  }
                                  testId={`radio-edu_blcleared_${lvl.key}`}
                                />
                              </Field>
                            </>
                          )}

                          {/* ── OCR Scanner — full width, last in grid ──────────────── */}
                          <MiniMarksheetScanner
                            levelKey={lvl.key}
                            levelLabel={lvl.label}
                            onDataExtracted={(extracted) => {
                              // ── Auto-fill marks ───────────────────────────────────
                              if (extracted.marks_obtained) {
                                updateEducation(
                                  lvl.key,
                                  "marks_obtained",
                                  String(extracted.marks_obtained),
                                );
                              }
                              if (extracted.marks_total) {
                                updateEducation(
                                  lvl.key,
                                  "marks_total",
                                  String(extracted.marks_total),
                                );
                              }

                              // ── Auto-fill passout / end year ─────────────────────
                              if (extracted.passout_year) {
                                if (isSchoolQualification(lvl.key)) {
                                  updateEducation(
                                    lvl.key,
                                    "passout_year",
                                    extracted.passout_year,
                                  );
                                } else {
                                  updateEducation(
                                    lvl.key,
                                    "end_year",
                                    extracted.passout_year,
                                  );
                                }
                              }

                              // ── Save file URL into education record ──────────────
                              if (extracted.fileUrl) {
                                updateEducation(
                                  lvl.key,
                                  "marksheet_url",
                                  extracted.fileUrl,
                                );
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}

                  {!form.highest_qualification && (
                    <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                      Select your highest completed qualification in Personal
                      Details to add only the education records relevant to you.
                    </p>
                  )}
                </div>
              )}
              {/* STEP 2 — ENGLISH */}
              {step === 2 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Field
                    label="Exam name"
                    error={errors.english_test}
                    testId="field-english_test"
                  >
                    <Select
                      value={form.english_test}
                      onValueChange={(v) => {
                        markTouched(
                          "english_test",
                          "exam_date",
                          "overall_score",
                          "exam_attempts",
                          "listening",
                          "reading",
                          "writing",
                          "speaking",
                          "tentative_exam_date",
                        );
                        setForm((f) => ({
                          ...f,
                          english_test: v,
                          listening: "",
                          reading: "",
                          writing: "",
                          speaking: "",
                          overall_score: "",
                          exam_date: "",
                        }));
                      }}
                    >
                      <SelectTrigger data-testid="select-english_test">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["IELTS", "PTE", "TOEFL", "Duolingo", "Tentative"].map(
                          (t) => (
                            <SelectItem key={t} value={t}>
                              {t === "Tentative"
                                ? "Tentative exam date (not yet taken)"
                                : t}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                  {form.english_test === "Tentative" ? (
                    <Field
                      label="Tentative exam date"
                      error={errors.tentative_exam_date}
                      testId="field-tentative_exam_date"
                    >
                      <Input
                        data-testid="input-tentative_exam_date"
                        type="date"
                        value={form.tentative_exam_date}
                        onChange={(e) =>
                          set("tentative_exam_date", e.target.value)
                        }
                        min={tentativeExamDateBounds.min}
                      />
                    </Field>
                  ) : (
                    <>
                      <Field
                        label="Number of attempts"
                        error={errors.exam_attempts}
                        testId="field-exam_attempts"
                      >
                        <Input
                          data-testid="input-exam_attempts"
                          type="number"
                          min="1"
                          value={form.exam_attempts}
                          onChange={(e) => set("exam_attempts", e.target.value)}
                        />
                      </Field>
                      <Field
                        label="Exam date"
                        error={errors.exam_date}
                        testId="field-exam_date"
                      >
                        <Input
                          data-testid="input-exam_date"
                          type="date"
                          value={form.exam_date}
                          onChange={(e) => set("exam_date", e.target.value)}
                          min={completedExamDateBounds.min}
                          max={completedExamDateBounds.max}
                        />
                      </Field>
                      <Field
                        label={`Listening (${form.english_test === "IELTS" ? "0–9 bands" : form.english_test === "PTE" ? "10–90" : form.english_test === "TOEFL" ? "0–30" : "10–160"})`}
                        error={errors.listening}
                        testId="field-listening"
                      >
                        <Input
                          data-testid="input-listening"
                          type="number"
                          step={form.english_test === "IELTS" ? "0.5" : "1"}
                          value={form.listening}
                          onChange={(e) => set("listening", e.target.value)}
                        />
                      </Field>
                      <Field
                        label="Reading"
                        error={errors.reading}
                        testId="field-reading"
                      >
                        <Input
                          data-testid="input-reading"
                          type="number"
                          step="0.5"
                          value={form.reading}
                          onChange={(e) => set("reading", e.target.value)}
                        />
                      </Field>
                      <Field
                        label="Writing"
                        error={errors.writing}
                        testId="field-writing"
                      >
                        <Input
                          data-testid="input-writing"
                          type="number"
                          step="0.5"
                          value={form.writing}
                          onChange={(e) => set("writing", e.target.value)}
                        />
                      </Field>
                      <Field
                        label="Speaking"
                        error={errors.speaking}
                        testId="field-speaking"
                      >
                        <Input
                          data-testid="input-speaking"
                          type="number"
                          step="0.5"
                          value={form.speaking}
                          onChange={(e) => set("speaking", e.target.value)}
                        />
                      </Field>
                      <Field
                        label={`${form.english_test} overall score`}
                        error={errors.overall_score}
                        testId="field-overall_score"
                      >
                        <Input
                          data-testid="input-overall_score"
                          type="number"
                          step={form.english_test === "IELTS" ? "0.5" : "1"}
                          value={form.overall_score}
                          onChange={(e) => set("overall_score", e.target.value)}
                        />
                      </Field>
                    </>
                  )}
                </div>
              )}

              {/* STEP 3 — SPONSORS & INCOME PROOF */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="space-y-5">
                    {errors.sponsors && (
                      <p className="text-xs text-destructive">
                        {errors.sponsors}
                      </p>
                    )}
                    <Field label="Who will sponsor you?">
                      <Select value="" onValueChange={addSponsor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Add a sponsor" />
                        </SelectTrigger>
                        <SelectContent>
                          {form.sponsors
                            .filter((sp) => !sp.applicable)
                            .map((sp) => (
                              <SelectItem key={sp.id} value={sp.relation}>
                                {sp.relation}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <div className="space-y-5">
                      {form.sponsors
                        .filter((sp) => sp.applicable)
                        .map((sp) => (
                          <div
                            key={sp.id}
                            className="rounded-xl border border-border bg-white p-5 shadow-sm md:p-6"
                            data-testid={`sponsor-card-${sp.id}`}
                          >
                            <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                              <div>
                                <p className="gsa-overline">Sponsor details</p>
                                <span className="font-display font-bold text-secondary">
                                  {sp.relation}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSponsor(sp.id)}
                                className="text-sm font-medium text-destructive"
                              >
                                Remove
                              </button>
                            </div>
                            {sp.applicable && (
                              <>
                                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                  <Field
                                    label="Sponsor relation"
                                    error={errors[`sponsor_relation_${sp.id}`]}
                                  >
                                    {sp.relation === "Other" ? (
                                      <Input
                                        value={sp.other_relation || ""}
                                        onChange={(e) =>
                                          updateSponsor(
                                            sp.id,
                                            "other_relation",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Specify relationship"
                                      />
                                    ) : (
                                      <Input
                                        value={sp.relation}
                                        readOnly
                                        className="bg-muted"
                                      />
                                    )}
                                  </Field>
                                  <Field
                                    label="Employment type"
                                    testId={`field-sponsor_emp_${sp.id}`}
                                  >
                                    <Select
                                      value={sp.employment_type}
                                      onValueChange={(v) =>
                                        updateSponsorEmployment(sp.id, v)
                                      }
                                    >
                                      <SelectTrigger
                                        data-testid={`select-sponsor_emp_${sp.id}`}
                                      >
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SPONSOR_OCCUPATIONS.map((v) => (
                                          <SelectItem key={v} value={v}>
                                            {v}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </Field>
                                  <Field
                                    label="Annual income (₹)"
                                    error={errors[`sponsor_${sp.id}`]}
                                    testId={`field-sponsor_income_${sp.id}`}
                                  >
                                    <Input
                                      type="number"
                                      min="0"
                                      value={sp.annual_income_inr}
                                      onChange={(e) =>
                                        updateSponsor(
                                          sp.id,
                                          "annual_income_inr",
                                          e.target.value,
                                        )
                                      }
                                      data-testid={`input-sponsor_income_${sp.id}`}
                                    />
                                  </Field>
                                  {sp.employment_type === "Other" && (
                                    <Field label="Specify occupation">
                                      <Input
                                        value={sp.other_occupation}
                                        onChange={(e) =>
                                          updateSponsor(
                                            sp.id,
                                            "other_occupation",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </Field>
                                  )}
                                  <div className="grid gap-3 rounded-lg bg-muted/60 p-4 sm:grid-cols-2 md:col-span-2 xl:col-span-3">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                      <Checkbox
                                        checked={sp.itr_timely}
                                        onCheckedChange={(v) =>
                                          updateSponsor(
                                            sp.id,
                                            "itr_timely",
                                            !!v,
                                          )
                                        }
                                        data-testid={`sponsor_itr_timely_${sp.id}`}
                                      />
                                      Filing ITR timely?
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                      <Checkbox
                                        checked={sp.itr_3yr}
                                        onCheckedChange={(v) =>
                                          updateSponsor(sp.id, "itr_3yr", !!v)
                                        }
                                        data-testid={`sponsor_itr_3yr_${sp.id}`}
                                      />
                                      Last 3 years ITR filed?
                                    </label>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                    </div>
                    <div className="rounded-xl border border-border bg-muted p-5 md:p-6">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Total annual sponsor income
                      </p>
                      <p className="mt-1 font-display text-2xl font-bold text-secondary">
                        ₹{totalSponsorIncome.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="space-y-6">
                  {form.sponsors
                    .filter((sp) => sp.applicable)
                    .map((sp) => (
                      <div
                        key={sp.id}
                        className="border border-border rounded-xl p-5"
                      >
                        <h3 className="font-display font-bold text-secondary">
                          {sp.relation} —{" "}
                          {sp.employment_type || "employment type pending"}
                        </h3>
                        {sp.employment_type ? (
                          <div className="space-y-4 mt-4">
                            {sp.docs.map((doc) => (
                              <div
                                key={doc.key}
                                className="rounded-lg bg-muted p-4 grid md:grid-cols-2 gap-4"
                              >
                                {/* Row 1 — status (left) + year (right) */}
                                <Field
                                  label={`${doc.label}`}
                                  error={
                                    errors[`sponsor_doc_${sp.id}_${doc.key}`]
                                  }
                                >
                                  <Select
                                    value={doc.status}
                                    onValueChange={(v) =>
                                      updateSponsorDoc(
                                        sp.id,
                                        doc.key,
                                        "status",
                                        v,
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Document status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="yes">
                                        Yes, I have it
                                      </SelectItem>
                                      <SelectItem value="no">
                                        No, not available
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </Field>

                                {doc.year_required && doc.status === "yes" && (
                                  <Field
                                    label="Year established"
                                    error={
                                      errors[
                                        `sponsor_doc_year_${sp.id}_${doc.key}`
                                      ]
                                    }
                                  >
                                    <Input
                                      type="number"
                                      value={doc.year_established}
                                      onChange={(e) =>
                                        updateSponsorDoc(
                                          sp.id,
                                          doc.key,
                                          "year_established",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </Field>
                                )}

                                {/* Row 2 — full width */}
                                <div className="md:col-span-2">
                                  {doc.status === "yes" ? (
                                    <Field
                                      label="Upload document"
                                      error={
                                        errors[
                                          `sponsor_doc_file_${sp.id}_${doc.key}`
                                        ]
                                      }
                                    >
                                      {docUploading[`${sp.id}_${doc.key}`] ? (
                                        <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm text-muted-foreground">
                                          <Loader2
                                            size={16}
                                            className="animate-spin"
                                          />
                                          Uploading…
                                        </div>
                                      ) : doc.file_url ? (
                                        <div
                                          className="flex items-center gap-3 rounded-md border border-border bg-white px-3 py-2"
                                          data-testid={`doc-file-${sp.id}-${doc.key}`}
                                        >
                                          <FileText
                                            size={16}
                                            className="shrink-0 text-primary"
                                          />
                                          <span className="min-w-0 flex-1 truncate text-sm text-secondary">
                                            {doc.file_name || "Document saved"}
                                          </span>
                                          <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 text-sm font-medium text-primary underline"
                                          >
                                            View
                                          </a>
                                          <button
                                            type="button"
                                            className="shrink-0 text-sm font-medium text-destructive"
                                            onClick={() => {
                                              updateSponsorDoc(
                                                sp.id,
                                                doc.key,
                                                "file_url",
                                                "",
                                              );
                                              updateSponsorDoc(
                                                sp.id,
                                                doc.key,
                                                "file_name",
                                                "",
                                              );
                                            }}
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-white px-3 text-sm font-medium text-secondary transition-colors hover:border-primary/50 hover:bg-primary/5">
                                          <Upload size={16} />
                                          Upload PDF / JPG / PNG
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept={ACCEPT_DOC_UPLOAD}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              e.target.value = "";
                                              if (file)
                                                uploadSponsorDocument(
                                                  sp.id,
                                                  doc.key,
                                                  file,
                                                );
                                            }}
                                          />
                                        </label>
                                      )}
                                    </Field>
                                  ) : doc.status === "no" ? (
                                    <Field label="Remark / note">
                                      <Textarea
                                        value={doc.remarks}
                                        onChange={(e) =>
                                          updateSponsorDoc(
                                            sp.id,
                                            doc.key,
                                            "remarks",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Why is it not available?  "
                                      />
                                    </Field>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      Select Yes to upload the document, or No
                                      to leave a note.
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-destructive mt-3">
                            Choose an employment type in Sponsor Income first.
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* STEP 4 — WORK DETAILS */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="space-y-5 pb-6 border-b border-border">
                    <Field label="Is your work experience relevant to the intended course?">
                      <YesNo
                        value={form.work_relevant_to_course}
                        onChange={(v) => {
                          set("work_relevant_to_course", v);
                          if (!v) set("work_relevance_explanation", "");
                        }}
                        testId="radio-work_relevant_to_course"
                      />
                    </Field>
                    {form.work_relevant_to_course && (
                      <Field
                        label="How is this experience relevant to your intended course?"
                        error={errors.work_relevance_explanation}
                        testId="field-work_relevance_explanation"
                      >
                        <Textarea
                          data-testid="input-work_relevance_explanation"
                          value={form.work_relevance_explanation}
                          onChange={(e) =>
                            set("work_relevance_explanation", e.target.value)
                          }
                          placeholder="Briefly describe how your work experience relates to the course you're applying for"
                          rows={3}
                        />
                      </Field>
                    )}

                    <Field label="Can this employment be independently verified?">
                      <YesNo
                        value={form.work_verification_done}
                        onChange={(v) => {
                          set("work_verification_done", v);
                          if (!v) {
                            setForm((f) => ({
                              ...f,
                              work_verification_contact_name: "",
                              work_verification_contact_phone: "",
                              work_verification_contact_email: "",
                            }));
                          }
                        }}
                        testId="radio-work_verification_done"
                      />
                    </Field>

                    {form.work_verification_done && (
                      <div
                        className="rounded-xl border border-border bg-muted/40 p-5 space-y-4"
                        data-testid="work-verification-contact-fields"
                      >
                        <div className="text-sm font-semibold text-foreground">
                          Verification contact
                        </div>

                        <div className="grid md:grid-cols-3 gap-5">
                          <Field
                            label="Contact name"
                            hint="Name of the employer / HR contact"
                            error={errors.work_verification_contact_name}
                            testId="field-work_verification_contact_name"
                          >
                            <Input
                              data-testid="input-work_verification_contact_name"
                              value={form.work_verification_contact_name}
                              onChange={(e) =>
                                set(
                                  "work_verification_contact_name",
                                  e.target.value,
                                )
                              }
                              placeholder="Contact person's name"
                            />
                          </Field>

                          <Field
                            label="Contact phone"
                            hint="Number we can call to verify"
                            error={errors.work_verification_contact_phone}
                            testId="field-work_verification_contact_phone"
                          >
                            <Input
                              data-testid="input-work_verification_contact_phone"
                              inputMode="numeric"
                              maxLength={10}
                              value={form.work_verification_contact_phone}
                              onChange={(e) =>
                                set(
                                  "work_verification_contact_phone",
                                  e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 10),
                                )
                              }
                              placeholder="10-digit phone number"
                            />
                          </Field>

                          <Field
                            label="Contact email"
                            hint="Email we can write to"
                            error={errors.work_verification_contact_email}
                            testId="field-work_verification_contact_email"
                          >
                            <Input
                              data-testid="input-work_verification_contact_email"
                              type="email"
                              value={form.work_verification_contact_email}
                              onChange={(e) =>
                                set(
                                  "work_verification_contact_email",
                                  e.target.value,
                                )
                              }
                              placeholder="hr@company.com"
                            />
                          </Field>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-5">
                    {form.employment_records.map((record, index) => (
                      <div
                        key={record.id}
                        className="rounded-xl border border-border p-5"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="gsa-overline">
                            Employment {index + 1}
                          </div>
                          {form.employment_records.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEmployment(record.id)}
                              className="text-sm font-medium text-destructive"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-5">
                          <Field label="Employment status">
                            <Select
                              value={record.status}
                              onValueChange={(v) =>
                                updateEmployment(record.id, "status", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {EMPLOYMENT_STATUSES.map((v) => (
                                  <SelectItem key={v} value={v}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          {![
                            "Not Applicable",
                            "Unemployed",
                            "Student",
                          ].includes(record.status) && (
                            <>
                              <Field label="Applicant name">
                                <Input
                                  value={`${form.first_name} ${form.last_name}`.trim()}
                                  readOnly
                                  className="bg-muted"
                                />
                              </Field>
                              <Field
                                label="Employer name"
                                error={
                                  errors[`employment_${record.id}_employer`]
                                }
                              >
                                <Input
                                  value={record.employer}
                                  onChange={(e) =>
                                    updateEmployment(
                                      record.id,
                                      "employer",
                                      e.target.value,
                                    )
                                  }
                                />
                              </Field>
                              <Field
                                label="Date of joining"
                                error={
                                  errors[`employment_${record.id}_joining`]
                                }
                              >
                                <Input
                                  type="date"
                                  value={record.date_of_joining}
                                  onChange={(e) =>
                                    updateEmployment(
                                      record.id,
                                      "date_of_joining",
                                      e.target.value,
                                    )
                                  }
                                  max={today}
                                />
                              </Field>
                              <Field label="Currently working here?">
                                <YesNo
                                  value={record.currently_working}
                                  onChange={(v) =>
                                    updateEmployment(
                                      record.id,
                                      "currently_working",
                                      v,
                                    )
                                  }
                                  testId={`employment-${record.id}-current`}
                                />
                              </Field>
                              {!record.currently_working && (
                                <Field label="Last working day">
                                  <Input
                                    type="date"
                                    value={record.last_working_day}
                                    onChange={(e) =>
                                      updateEmployment(
                                        record.id,
                                        "last_working_day",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </Field>
                              )}
                              <Field label="Mode of salary">
                                <Select
                                  value={record.salary_mode}
                                  onValueChange={(v) =>
                                    updateEmployment(
                                      record.id,
                                      "salary_mode",
                                      v,
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SALARY_MODES.map((v) => (
                                      <SelectItem key={v} value={v}>
                                        {v}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>
                              <Field label="ITR / Form 16 filed?">
                                <YesNo
                                  value={record.itr_filed}
                                  onChange={(v) =>
                                    updateEmployment(record.id, "itr_filed", v)
                                  }
                                  testId={`employment-${record.id}-itr`}
                                />
                              </Field>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary hover:bg-muted"
                      onClick={addEmployment}
                    >
                      <Plus size={16} /> Add more employment
                    </button>
                  </div>
                  <div className="hidden">
                    <div className="gsa-overline mb-4">Employment 1</div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <Field
                        label="Employment status"
                        testId="field-work1_status"
                      >
                        <Select
                          value={form.work1_status}
                          onValueChange={(v) => set("work1_status", v)}
                        >
                          <SelectTrigger data-testid="select-work1_status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYMENT_STATUSES.map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      {!["Not Applicable", "Unemployed", "Student"].includes(
                        form.work1_status,
                      ) && (
                        <>
                          <Field
                            label="Employer name"
                            error={errors.work1_employer}
                            testId="field-work1_employer"
                          >
                            <Input
                              data-testid="input-work1_employer"
                              value={form.work1_employer}
                              onChange={(e) =>
                                set("work1_employer", e.target.value)
                              }
                            />
                          </Field>
                          <Field
                            label="Date of joining"
                            error={errors.work1_date_of_joining}
                            testId="field-work1_date_of_joining"
                          >
                            <Input
                              data-testid="input-work1_date_of_joining"
                              type="date"
                              value={form.work1_date_of_joining}
                              onChange={(e) =>
                                set("work1_date_of_joining", e.target.value)
                              }
                              max={today}
                            />
                          </Field>
                          <Field
                            label="Currently working here?"
                            testId="field-work1_currently_working"
                          >
                            <YesNo
                              value={form.work1_currently_working}
                              onChange={(v) =>
                                set("work1_currently_working", v)
                              }
                              testId="radio-work1_currently_working"
                            />
                          </Field>
                          {!form.work1_currently_working && (
                            <Field
                              label="Last working day"
                              testId="field-work1_last_working_day"
                            >
                              <Input
                                data-testid="input-work1_last_working_day"
                                type="date"
                                value={form.work1_last_working_day}
                                onChange={(e) =>
                                  set("work1_last_working_day", e.target.value)
                                }
                              />
                            </Field>
                          )}
                          <Field
                            label="Mode of salary"
                            testId="field-work1_salary_mode"
                          >
                            <Select
                              value={form.work1_salary_mode}
                              onValueChange={(v) => set("work1_salary_mode", v)}
                            >
                              <SelectTrigger data-testid="select-work1_salary_mode">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SALARY_MODES.map((v) => (
                                  <SelectItem key={v} value={v}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field
                            label="ITR / Form 16 filed?"
                            testId="field-work1_itr_filed"
                          >
                            <YesNo
                              value={form.work1_itr_filed}
                              onChange={(v) => set("work1_itr_filed", v)}
                              testId="radio-work1_itr_filed"
                            />
                          </Field>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary hover:bg-muted mb-4"
                      onClick={() =>
                        set(
                          "has_second_employment",
                          !form.has_second_employment,
                        )
                      }
                    >
                      <Plus size={16} />{" "}
                      {form.has_second_employment
                        ? "Remove employment record"
                        : "Add more employment record"}
                    </button>
                    {form.has_second_employment && (
                      <>
                        <div className="gsa-overline mb-4">Employment 2</div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <Field
                            label="Employment status"
                            testId="field-work2_status"
                          >
                            <Select
                              value={form.work2_status}
                              onValueChange={(v) => set("work2_status", v)}
                            >
                              <SelectTrigger data-testid="select-work2_status">
                                <SelectValue placeholder="Not applicable" />
                              </SelectTrigger>
                              <SelectContent>
                                {EMPLOYMENT_STATUSES.map((v) => (
                                  <SelectItem key={v} value={v}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          {form.work2_status &&
                            ![
                              "Not Applicable",
                              "Unemployed",
                              "Student",
                            ].includes(form.work2_status) && (
                              <>
                                <Field
                                  label="Employer name"
                                  error={errors.work2_employer}
                                  testId="field-work2_employer"
                                >
                                  <Input
                                    data-testid="input-work2_employer"
                                    value={form.work2_employer}
                                    onChange={(e) =>
                                      set("work2_employer", e.target.value)
                                    }
                                  />
                                </Field>
                                <Field
                                  label="Date of joining"
                                  error={errors.work2_date_of_joining}
                                  testId="field-work2_date_of_joining"
                                >
                                  <Input
                                    data-testid="input-work2_date_of_joining"
                                    type="date"
                                    value={form.work2_date_of_joining}
                                    onChange={(e) =>
                                      set(
                                        "work2_date_of_joining",
                                        e.target.value,
                                      )
                                    }
                                    max={today}
                                  />
                                </Field>
                                <Field
                                  label="Currently working here?"
                                  testId="field-work2_currently_working"
                                >
                                  <YesNo
                                    value={form.work2_currently_working}
                                    onChange={(v) =>
                                      set("work2_currently_working", v)
                                    }
                                    testId="radio-work2_currently_working"
                                  />
                                </Field>
                                {!form.work2_currently_working && (
                                  <Field
                                    label="Last working day"
                                    testId="field-work2_last_working_day"
                                  >
                                    <Input
                                      data-testid="input-work2_last_working_day"
                                      type="date"
                                      value={form.work2_last_working_day}
                                      onChange={(e) =>
                                        set(
                                          "work2_last_working_day",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </Field>
                                )}
                                <Field
                                  label="Mode of salary"
                                  testId="field-work2_salary_mode"
                                >
                                  <Select
                                    value={form.work2_salary_mode}
                                    onValueChange={(v) =>
                                      set("work2_salary_mode", v)
                                    }
                                  >
                                    <SelectTrigger data-testid="select-work2_salary_mode">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SALARY_MODES.map((v) => (
                                        <SelectItem key={v} value={v}>
                                          {v}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </Field>
                                <Field
                                  label="ITR / Form 16 filed?"
                                  testId="field-work2_itr_filed"
                                >
                                  <YesNo
                                    value={form.work2_itr_filed}
                                    onChange={(v) => set("work2_itr_filed", v)}
                                    testId="radio-work2_itr_filed"
                                  />
                                </Field>
                              </>
                            )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="hidden md:grid-cols-2 gap-6 pt-2 border-t border-border">
                    <Field
                      label="Is your work experience relevant to the intended course?"
                      testId="field-work_relevant_to_course"
                    >
                      <YesNo
                        value={form.work_relevant_to_course}
                        onChange={(v) => set("work_relevant_to_course", v)}
                        testId="radio-work_relevant_to_course"
                      />
                    </Field>
                    <Field
                      label="Can this employment be independently verified?"
                      testId="field-work_verification_done"
                    >
                      <YesNo
                        value={form.work_verification_done}
                        onChange={(v) => set("work_verification_done", v)}
                        testId="radio-work_verification_done"
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* STEP 5 — VISA & LOAN */}
              {step === 5 && (
                <div className="space-y-8">
                  <div className="space-y-5">
                    <div className="rounded-xl border border-border p-5 md:p-6">
                      <Field
                        label="Is your intended course in line with your previous education?"
                        error={errors.course_in_line_with_previous_education}
                        testId="field-course_in_line_with_previous_education"
                      >
                        <YesNo
                          value={form.course_in_line_with_previous_education}
                          onChange={(v) => {
                            set("course_in_line_with_previous_education", v);
                            if (v) set("course_change_reason", "");
                          }}
                          testId="radio-course_in_line_with_previous_education"
                        />
                      </Field>

                      {form.course_in_line_with_previous_education ===
                        false && (
                        <div className="mt-5">
                          <Field
                            label="Why are you changing your field of study?"
                            error={errors.course_change_reason}
                            testId="field-course_change_reason"
                          >
                            <Textarea
                              data-testid="input-course_change_reason"
                              value={form.course_change_reason}
                              onChange={(e) =>
                                set("course_change_reason", e.target.value)
                              }
                              placeholder="Explain the reason for choosing a different field, and how it connects to your career goals"
                              rows={3}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border border-border p-5 md:p-6">
                      <Field
                        label="Applied for any country's visa before?"
                        error={errors.applied_visa_before}
                        testId="field-applied_visa_before"
                      >
                        <Select
                          value={form.applied_visa_before}
                          onValueChange={(v) => set("applied_visa_before", v)}
                        >
                          <SelectTrigger data-testid="select-applied_visa_before">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["None", "Student", "Tourist", "PR", "TR"].map(
                              (v) => (
                                <SelectItem key={v} value={v}>
                                  {v}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <div className="rounded-xl border border-border p-5 md:p-6">
                      <Field
                        label="Has a visa ever been refused (any country)?"
                        error={errors.previous_visa_refusal}
                        testId="field-previous_visa_refusal"
                      >
                        <YesNo
                          value={form.previous_visa_refusal}
                          onChange={(v) => set("previous_visa_refusal", v)}
                          testId="radio-previous_visa_refusal"
                        />
                      </Field>
                    </div>
                    {form.previous_visa_refusal && (
                      <div className="grid gap-5 rounded-xl border border-border bg-muted/40 p-5 md:grid-cols-2 md:p-6">
                        <Field
                          label="Country of refusal"
                          error={errors.refusal_country}
                          testId="field-refusal_country"
                        >
                          <Input
                            data-testid="input-refusal_country"
                            value={form.refusal_country}
                            onChange={(e) =>
                              set("refusal_country", e.target.value)
                            }
                          />
                        </Field>
                        <Field
                          label="Stated reason for refusal"
                          error={errors.refusal_reason}
                          testId="field-refusal_reason"
                        >
                          <Textarea
                            data-testid="input-refusal_reason"
                            value={form.refusal_reason}
                            onChange={(e) =>
                              set("refusal_reason", e.target.value)
                            }
                            placeholder="e.g. GTE concerns, insufficient funds"
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 6 — MARITAL DETAILS */}
              {step === 3 && (
                <div className="grid md:grid-cols-2 gap-6 items-start">
                  {/* Left column — marriage + spouse questions */}
                  <div className="space-y-6">
                    <Field
                      label="Is the student married?"
                      error={errors.is_married}
                      testId="field-is_married"
                    >
                      <YesNo
                        value={form.is_married}
                        onChange={(v) => set("is_married", v)}
                        testId="radio-is_married"
                      />
                    </Field>
                    {form.is_married && (
                      <>
                        <Field
                          label="Spouse will accompany?"
                          testId="field-spouse_will_accompany"
                        >
                          <YesNo
                            value={form.spouse_will_accompany}
                            onChange={(v) => set("spouse_will_accompany", v)}
                            testId="radio-spouse_will_accompany"
                          />
                        </Field>
                        <Field
                          label="Spouse qualification (optional)"
                          testId="field-spouse_qualification"
                        >
                          <Input
                            data-testid="input-spouse_qualification"
                            value={form.spouse_qualification}
                            onChange={(e) =>
                              set("spouse_qualification", e.target.value)
                            }
                          />
                        </Field>
                      </>
                    )}
                  </div>

                  {/* Right column — child question, count directly below it */}
                  <div className="space-y-6">
                    {form.is_married && (
                      <>
                        <Field
                          label="Does the student have a child?"
                          testId="field-has_child"
                        >
                          <YesNo
                            value={form.has_child}
                            onChange={(v) => set("has_child", v)}
                            testId="radio-has_child"
                          />
                        </Field>
                        {/*
                          Child count sits directly under the child question.
                          Its slot is reserved (invisible) when not applicable,
                          so toggling Yes/No never moves other fields.
                        */}
                        <div
                          className={
                            form.has_child ? "" : "hidden md:block md:invisible"
                          }
                          aria-hidden={!form.has_child}
                        >
                          <Field
                            label="Number of children"
                            error={errors.child_count}
                            testId="field-child_count"
                          >
                            <Input
                              type="number"
                              min="1"
                              disabled={!form.has_child}
                              value={form.child_count}
                              onChange={(e) =>
                                set("child_count", e.target.value)
                              }
                            />
                          </Field>
                        </div>
                        <Field
                          label="Spouse present activity"
                          error={errors.spouse_present_activity}
                          testId="field-spouse_activity"
                        >
                          <Select
                            value={form.spouse_activity}
                            onValueChange={(v) => set("spouse_activity", v)}
                          >
                            <SelectTrigger data-testid="select-spouse_activity">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {["Working", "Studying", "Unemployed"].map(
                                (v) => (
                                  <SelectItem key={v} value={v}>
                                    {v}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </Field>
                      </>
                    )}
                  </div>
                </div>
              )}

              {step === 8 && (
                <div className="space-y-8">

                  <div>
                    <div className="gsa-overline mb-4">Mist proof of funds</div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Mist API integration is pending. These fields capture the
                      information required to create a compliant Proof of Funds
                      request.
                    </p>
                    <div className="grid md:grid-cols-2 gap-5 mb-6">
                      <Field
                        label="Account holder full name"
                        error={errors.mist_account_holder_name}
                      >
                        <Input
                          value={form.mist_account_holder_name}
                          onChange={(e) =>
                            set("mist_account_holder_name", e.target.value)
                          }
                        />
                      </Field>
                      <Field
                        label="Account holder relation to student"
                        error={errors.mist_account_holder_relation}
                      >
                        <Input
                          value={form.mist_account_holder_relation}
                          onChange={(e) =>
                            set("mist_account_holder_relation", e.target.value)
                          }
                          placeholder="e.g. Self, Father"
                        />
                      </Field>
                      <Field
                        label="Primary source of funds"
                        error={errors.mist_fund_source}
                      >
                        <Select
                          value={form.mist_fund_source}
                          onValueChange={(v) => set("mist_fund_source", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Savings",
                              "Fixed deposit",
                              "Sponsor income",
                              "Education loan",
                              "Investment",
                              "Other",
                            ].map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field
                        label="Amount to verify (₹)"
                        error={errors.mist_amount_inr}
                      >
                        <Input
                          type="number"
                          min="0"
                          value={form.mist_amount_inr}
                          onChange={(e) =>
                            set("mist_amount_inr", e.target.value)
                          }
                        />
                      </Field>
                      <Field
                        label="Expected transfer timeline"
                        error={errors.mist_transfer_timeline}
                      >
                        <Select
                          value={form.mist_transfer_timeline}
                          onValueChange={(v) =>
                            set("mist_transfer_timeline", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timeline" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Within 7 days",
                              "Within 30 days",
                              "More than 30 days",
                            ].map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <div className="gsa-overline mb-4">
                      Other available fund sources
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      {[
                        ["savings", "Savings account (nationalised bank)"],
                        [
                          "fixed_deposits",
                          "Fixed deposits (nationalised bank)",
                        ],
                        [
                          "investments",
                          "Investments (MF, SIP, post, LIC and others)",
                        ],
                        ["other_funds", "Any other source"],
                      ].map(([key, label]) => (
                        <div
                          key={key}
                          className="rounded-xl border border-border p-4 space-y-4"
                        >
                          <label className="flex items-center gap-2 text-sm font-medium text-secondary cursor-pointer">
                            <Checkbox
                              checked={form[`${key}_available`]}
                              onCheckedChange={(v) =>
                                set(`${key}_available`, !!v)
                              }
                            />
                            {label} available
                          </label>
                          {form[`${key}_available`] && (
                            <Field
                              label="Amount (₹)"
                              error={errors[`${key}_amount_inr`]}
                            >
                              <Input
                                type="number"
                                min="0"
                                value={form[`${key}_amount_inr`]}
                                onChange={(e) =>
                                  set(`${key}_amount_inr`, e.target.value)
                                }
                                placeholder="e.g. 500000"
                              />
                            </Field>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-border">
                    <Field
                      label="Is an education loan required?"
                      error={errors.education_loan_required}
                    >
                      <YesNo
                        value={form.education_loan_required}
                        onChange={(v) => set("education_loan_required", v)}
                        testId="radio-education_loan_required_step8"
                      />
                    </Field>
                    {form.education_loan_required && (
                      <div className="space-y-5 mt-5">
                        <div className="grid md:grid-cols-2 gap-5">
                          <Field
                            label="Loan amount needed (₹)"
                            error={errors.loan_amount_inr}
                          >
                            <Input
                              data-testid="input-loan_amount_inr"
                              type="number"
                              min="0"
                              value={form.loan_amount_inr}
                              onChange={(e) =>
                                set("loan_amount_inr", e.target.value)
                              }
                              placeholder="e.g. 2000000"
                            />
                          </Field>
                          <Field label="Loan sponsor">
                            <Select
                              value={form.loan_sponsor_id}
                              onValueChange={(v) => set("loan_sponsor_id", v)}
                            >
                              <SelectTrigger data-testid="select-loan_sponsor_id">
                                <SelectValue placeholder="Select sponsor" />
                              </SelectTrigger>
                              <SelectContent>
                                {form.sponsors
                                  .filter((sp) => sp.applicable)
                                  .map((sp) => (
                                    <SelectItem key={sp.id} value={sp.id}>
                                      {sp.relation}
                                      {sp.annual_income_inr
                                        ? ` — ₹${Number(sp.annual_income_inr).toLocaleString("en-IN")}/yr`
                                        : ""}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>
                        <SponsorSection
                          sponsors={form.sponsors.filter((sp) => sp.applicable)}
                          sponsorId={form.loan_sponsor_id}
                          onSelectSponsor={(v) => set("loan_sponsor_id", v)}
                          requestedLoan={Number(form.loan_amount_inr) || 0}
                          funds={{
                            bankBalance:
                              (Number(form.savings_amount_inr) || 0) +
                              (Number(form.other_funds_amount_inr) || 0),
                            fixedDeposit:
                              Number(form.fixed_deposits_amount_inr) || 0,
                            goldValue: Number(form.investments_amount_inr) || 0,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 9 && (
                <div className="space-y-6">
                  <div>
                    <div className="gsa-overline mb-2">
                      Ready to generate your report
                    </div>
                    <h2 className="font-display text-2xl font-bold text-secondary">
                      Review your assessment
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Use Back to update any answer. When you submit, we will
                      calculate your visa-readiness score and create your
                      personalised report.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 rounded-xl bg-muted p-5 text-sm">
                    <div>
                      <span className="text-muted-foreground">Applicant</span>
                      <p className="font-semibold text-secondary">
                        {form.first_name} {form.last_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Course</span>
                      <p className="font-semibold text-secondary">
                        {form.intended_course}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Sponsor income
                      </span>
                      <p className="font-semibold text-secondary">
                        ₹
                        {form.sponsors
                          .filter((s) => s.applicable)
                          .reduce(
                            (total, s) =>
                              total + (Number(s.annual_income_inr) || 0),
                            0,
                          )
                          .toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Intake</span>
                      <p className="font-semibold text-secondary">
                        {form.intake_year}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            <button
              className="btn-outline disabled:opacity-40"
              onClick={() => {
                setErrors({});
                setStep((s) => Math.max(0, s - 1));
              }}
              disabled={step === 0 || submitting}
              data-testid="back-step-btn"
            >
              <ArrowLeft size={16} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                className="btn-primary"
                onClick={goNext}
                disabled={submitting}
                data-testid="next-step-btn"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={submit}
                disabled={submitting}
                data-testid="submit-assessment-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Generating
                    report…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Get my probability
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function documentsForSponsor(sponsor) {
  const byOccupation = {
    Business: [
      "GST Registration (minimum 1 year old)",
      "MSME Registration (minimum 1 year old)",
      "Current account statement (minimum 1 year)",
      "Form 16 / ITR – last 3 years",
    ],
    Salaried: [
      "Salary account statement (minimum 1 year)",
      "Form 16 / ITR – last 3 years",
      "Employment / salary proof",
    ],
    Agriculture: [
      "Income certificate (current year)",
      "7/12 land document (latest)",
      "Bank statement showing agriculture income",
      "Utility / crop bills (recent)",
      "Form 16 / ITR – last 3 years",
    ],
    Retired: [
      "Pension statement",
      "Bank statement (minimum 1 year)",
      "ITR – last 3 years (if applicable)",
    ],
    Other: [
      "Income-source proof",
      "Bank statement (minimum 1 year)",
      "ITR – last 3 years (if applicable)",
    ],
  };
  return [...new Set(byOccupation[sponsor.employment_type] || [])].map(
    (label) => ({
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      label,
      year_required: /minimum 1 year|registration/.test(label.toLowerCase()),
    }),
  );
}

function CoursePicker({
  courses,
  value,
  onChange,
  isOther,
  onOtherChange,
  testId,
}) {
  const [open, setOpen] = useState(false);

  const selectCourse = (course) => {
    onOtherChange(false);
    onChange(course.title);
    setOpen(false);
  };
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-testid={testId}
            className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-1 text-left text-sm leading-5 shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <span
              className={`min-w-0 flex-1 truncate leading-5 ${value && !isOther ? "" : "text-muted-foreground"}`}
            >
              {isOther ? "Other course" : value || "Search and select a course"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 self-center opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search courses or universities..." />
            <CommandList>
              <CommandEmpty>No courses found.</CommandEmpty>
              <CommandGroup>
                {courses.map((course) => (
                  <CommandItem
                    key={course.id}
                    value={`${course.title} ${course.university || ""}`}
                    onSelect={() => selectCourse(course)}
                  >
                    <Check
                      className={`h-4 w-4 ${!isOther && value === course.title ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{course.title}</span>
                      {course.university && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {course.university}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
                <CommandItem
                  forceMount
                  className="min-h-9 whitespace-nowrap leading-5"
                  value="Other course enter manually"
                  onSelect={() => {
                    onOtherChange(true);
                    onChange("");
                    setOpen(false);
                  }}
                >
                  Other course — enter manually
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {isOther && (
        <Input
          autoFocus
          className="h-9 bg-background px-3 py-1 text-sm leading-5 text-foreground caret-foreground"
          data-testid={`${testId}-other`}
          value={value ?? ""}
          onChange={(event) => {
            onOtherChange(true);
            onChange(event.target.value);
          }}
          placeholder="Enter your course name"
        />
      )}
    </div>
  );
}

function CalculatorVerificationGate({ onVerified }) {
  const [details, setDetails] = useState({ name: "", phone: "", email: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const update = (field, value) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      otp: undefined,
      form: undefined,
    }));
  };

  const validateDetails = () => {
    const next = {};
    if (details.name.trim().length < 2) next.name = "Enter your full name.";
    if (isTenDigitPhone(details.phone)) next.phone = "Enter exactly 10 digits.";
    if (!EMAIL_RE.test(details.email.trim()))
      next.email = "Enter a valid email address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const sendOtp = async () => {
    if (!validateDetails()) return;
    setSending(true);
    try {
      const response = await fetch("/api/email-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: details.email.trim() }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "Could not send the verification code.",
        );
      setOtpSent(true);
      setOtp("");
      setEmailVerified(false);
      setErrors({});
      toast.success("Verification code sent to your email.");
    } catch (error) {
      setErrors((current) => ({
        ...current,
        form: error.message || "Could not send the verification code.",
      }));
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setErrors((current) => ({
        ...current,
        otp: "Enter the 6-digit verification code.",
      }));
      return;
    }
    setVerifying(true);
    try {
      const response = await fetch("/api/email-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "The verification code could not be confirmed.",
        );
      setEmailVerified(true);
      setErrors((current) => ({ ...current, otp: undefined, form: undefined }));
      toast.success("Email verified.");
    } catch (error) {
      setErrors((current) => ({
        ...current,
        otp: error.message || "The verification code could not be confirmed.",
      }));
    } finally {
      setVerifying(false);
    }
  };

  const proceed = () => {
    const next = {};
    if (!emailVerified) next.form = "Verify your email before continuing.";
    if (!privacyAccepted)
      next.privacy = "Please accept the Privacy Policy to continue.";
    if (!termsAccepted)
      next.terms = "Please accept the Terms of Service to continue.";
    setErrors(next);
    if (Object.keys(next).length === 0) onVerified(details);
  };

  return (
    <div
      data-testid="calculator-verification-page"
      className="min-h-screen bg-background"
    >
      <section className="gsa-container pt-12 pb-20 md:pt-16">
        <div className="mx-auto max-w-xl">
          <div className="gsa-overline mb-3">Visa Probability Calculator</div>
          <h1 className="gsa-h2">Verify your details</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verify your email and accept the required terms to start your
            assessment.
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-white p-8 shadow-sm md:p-10">
            <div className="mb-6 flex items-center gap-3 text-secondary">
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <ShieldCheck size={21} />
              </span>
              <div>
                <p className="font-semibold">Secure access</p>
                <p className="text-sm text-muted-foreground">
                  Your details will prefill the calculator.
                </p>
              </div>
            </div>
            <div className="space-y-5">
              <Field label="Full name" error={errors.name}>
                <Input
                  value={details.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </Field>
              <Field label="Mobile number" error={errors.phone}>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={details.phone}
                  onChange={(event) =>
                    update(
                      "phone",
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Email ID" error={errors.email}>
                <Input
                  type="email"
                  value={details.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={otpSent}
                />
              </Field>
              {!otpSent ? (
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={sendOtp}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Sending
                      code…
                    </>
                  ) : (
                    <>
                      <Mail size={16} /> Send verification code
                    </>
                  )}
                </button>
              ) : (
                <>
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-sm font-medium text-secondary">
                      Enter the 6-digit code sent to {details.email}
                    </p>
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => {
                          setOtp(value);
                          setErrors((current) => ({
                            ...current,
                            otp: undefined,
                          }));
                        }}
                        disabled={emailVerified}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }, (_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                      <button
                        type="button"
                        className="btn-outline shrink-0"
                        onClick={verifyOtp}
                        disabled={verifying || emailVerified}
                      >
                        {verifying ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : emailVerified ? (
                          <>
                            <Check size={16} /> Verified
                          </>
                        ) : (
                          "Verify email"
                        )}
                      </button>
                    </div>
                    {errors.otp && (
                      <p className="mt-2 text-xs text-destructive" role="alert">
                        {errors.otp}
                      </p>
                    )}
                  </div>
                  {!emailVerified && (
                    <button
                      type="button"
                      className="text-sm font-semibold text-primary"
                      onClick={sendOtp}
                      disabled={sending}
                    >
                      {sending ? "Sending…" : "Resend verification code"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <aside
            className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-5 text-sm text-secondary"
            aria-label="Required consents"
          >
            <p className="font-semibold">
              Before continuing, please review and accept both documents.
            </p>
            <div className="mt-4 space-y-4">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  className="rounded-none"
                  checked={privacyAccepted}
                  onCheckedChange={(value) => {
                    setPrivacyAccepted(Boolean(value));
                    setErrors((current) => ({
                      ...current,
                      privacy: undefined,
                    }));
                  }}
                />
                <span>
                  <Link
                    href="/legal/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline"
                  >
                    Privacy Policy
                  </Link>
                  <span className="mt-1 block text-muted-foreground">
                    This explains what personal information we collect for your
                    visa-readiness assessment, why we use it, and your privacy
                    choices.
                  </span>
                </span>
              </label>
              {errors.privacy && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.privacy}
                </p>
              )}
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  className="rounded-none"
                  checked={termsAccepted}
                  onCheckedChange={(value) => {
                    setTermsAccepted(Boolean(value));
                    setErrors((current) => ({ ...current, terms: undefined }));
                  }}
                />
                <span>
                  <Link
                    href="/legal/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline"
                  >
                    Terms of Service
                  </Link>
                  <span className="mt-1 block text-muted-foreground">
                    These set the rules for using this calculator and clarify
                    that the result is guidance, not visa or legal advice.
                  </span>
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.terms}
                </p>
              )}
            </div>
          </aside>
          {errors.form && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {errors.form}
            </p>
          )}
          <button
            type="button"
            className="btn-primary mt-6 w-full"
            onClick={proceed}
            disabled={!emailVerified || !privacyAccepted || !termsAccepted}
          >
            Start visa calculator <ArrowRight size={16} />
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
