import { Dashboard } from "@/components/Dashboard";
import { getCurrentUser, getFeedback, getListings, getMembers, getProfile, getRuns, isDemo } from "@/lib/data";

export default async function HomePage() {
  const user = (await getCurrentUser())!;
  const [listings, feedback, profile, runs, members] = await Promise.all([
    getListings(),
    getFeedback(),
    getProfile(),
    getRuns(5),
    getMembers(),
  ]);

  return (
    <Dashboard
      listings={listings}
      feedback={feedback}
      profile={profile}
      runs={runs}
      members={members}
      user={user}
      demo={isDemo()}
      basemapKey={process.env.NEXT_CARTO_BASEMAP_KEY?.trim() || null}
    />
  );
}
