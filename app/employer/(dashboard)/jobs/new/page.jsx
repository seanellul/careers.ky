export const dynamic = "force-dynamic";

import PostJobClient from "./PostJobClient";

export const metadata = {
  title: "Post a Role — careers.ky",
  description: "Post a job directly on careers.ky",
};

export default function PostJobPage() {
  return <PostJobClient />;
}
