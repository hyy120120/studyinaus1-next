import CoursesClient from "@/components/courses/CoursesClient";

export const metadata = {
    title: "Australian University Courses & Course Selection Support | GoStudyInAustralia",
    description:
        "Browse curated Master's and Bachelor's programmes across top Australian universities — Melbourne, UNSW, Monash, UQ, ANU. Free course selection support from Ontrack counselors.",
    alternates: { canonical: "/courses" },
};

export default function CoursesPage() {
    return <CoursesClient />;
}
