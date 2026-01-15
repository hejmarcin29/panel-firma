import { getShopConfig } from "@/app/dashboard/settings/shop/actions";
import { AnnouncementBarClient } from "./announcement-bar-client";

export async function AnnouncementBar() {
  const config = await getShopConfig();

  if (config.isAnnouncementVisible === false) {
    return null;
  }

  if (!config.announcementMessage) {
    return null;
  }

  return (
    <AnnouncementBarClient message={config.announcementMessage} />
  );
}
