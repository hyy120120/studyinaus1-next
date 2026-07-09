import BookingClient from "@/components/booking/BookingClient";

export const metadata = {
    title: "Book a Free Counselling Session | GoStudyInAustralia",
    description: "Book a free counselling session with Ontrack Education to plan your Australian study visa journey.",
    alternates: { canonical: "/book-counselling" },
};

export default function BookCounsellingPage() {
    return <BookingClient />;
}
