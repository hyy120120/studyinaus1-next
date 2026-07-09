import AdminClient from "@/components/admin/AdminClient";

export const metadata = {
    title: "Counselor Login | GoStudyInAustralia",
    description: "Internal counselor access.",
    robots: { index: false, follow: false },
};

export default function AdminPage() {
    return <AdminClient />;
}
