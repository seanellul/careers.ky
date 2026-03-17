import PostHogProvider, { PostHogPageView } from "@/components/PostHogProvider";
import { Suspense } from "react";

export default function PitchLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
