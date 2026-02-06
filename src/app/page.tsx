import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/header";
import { MainContent } from "@/components/main-content";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const jellyfinUrl = process.env.JELLYFIN_URL || "";
  const user = {
    id: session.userId,
    username: session.username,
    isAdmin: session.isAdmin,
    avatarUrl: `${jellyfinUrl}/Users/${session.userId}/Images/Primary?quality=80&maxHeight=64`,
  };

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <MainContent user={user} />
    </div>
  );
}
