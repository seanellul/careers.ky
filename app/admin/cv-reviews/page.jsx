import { getPendingCvReviews, isMissingTableError } from "@/lib/cv-reviews";
import AdminCvReviewsClient from "./AdminCvReviewsClient";

export const metadata = { title: "CV Reviews — Admin" };

// Session-gated admin data — never execute the DB fetch at build time
export const dynamic = "force-dynamic";

export default async function AdminCvReviewsPage() {
  let reviews = [];
  let migrated = true;
  try {
    reviews = await getPendingCvReviews();
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    migrated = false; // cv_review_requests migration not applied yet
  }
  return <AdminCvReviewsClient initialReviews={reviews} migrated={migrated} />;
}
