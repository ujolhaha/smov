import classNames from "classnames";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Icon, Icons } from "@/components/Icon";
import { ThinContainer } from "@/components/layout/ThinContainer";
import { Divider } from "@/components/utils/Divider";
import { Heading1, Heading2, Paragraph } from "@/components/utils/Text";
import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { ConfigValuesPart } from "@/pages/parts/admin/ConfigValuesPart";
import { TMDBTestPart } from "@/pages/parts/admin/TMDBTestPart";
import { WorkerTestPart } from "@/pages/parts/admin/WorkerTestPart";

import { BackendTestPart } from "../parts/admin/BackendTestPart";

function Button(props: {
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      className={classNames(
        "font-bold rounded h-10 w-40 scale-95 hover:scale-100 transition-all duration-200",
        props.className,
      )}
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

function ConfigValue(props: { name: string; children?: ReactNode }) {
  return (
    <>
      <div className="flex">
        <p className="flex-1 font-bold text-white pr-5">{props.name}</p>
        <p>{props.children}</p>
      </div>
      <Divider marginClass="my-3" />
    </>
  );
}

async function getRecentPlayedItems() {
  const response = await fetch("https://backend.sudo-flix.lol/metrics");
  const text = await response.text();

  const regex =
    /mw_media_watch_count{tmdb_full_id="([^"]+)",provider_id="([^"]+)",title="([^"]+)",success="([^"]+)"} (\d+)/g;
  let match;
  const loop = true;
  const items: { [key: string]: any } = {};

  while (loop) {
    match = regex.exec(text);
    if (match === null) break;

    const [_, tmdbFullId, providerId, title, success, count] = match;
    if (items[tmdbFullId]) {
      items[tmdbFullId].count += parseInt(count, 10);
    } else {
      items[tmdbFullId] = {
        tmdbFullId,
        providerId,
        title,
        success: success === "true",
        count: parseInt(count, 10),
      };
    }
  }

  if (Object.keys(items).length > 0) {
    return Object.values(items);
  }
  throw new Error("RECENT_PLAYED_ITEMS not found");
}

export function AdminPage() {
  const [recentPlayedItems, setRecentPlayedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const itemsPerPage = 10;

  useEffect(() => {
    getRecentPlayedItems()
      .then((items) => {
        const uniqueItems = items.filter(
          (item, index, self) =>
            index === self.findIndex((t2) => t2.tmdbFullId === item.tmdbFullId),
        );

        setRecentPlayedItems(uniqueItems);
      })
      .catch((error) => {
        console.error("Error fetching recent played items:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function getItemsForCurrentPage() {
    const sortedItems = recentPlayedItems.sort((a, b) => b.count - a.count);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedItems.slice(startIndex, endIndex);
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <SubPageLayout>
      <ThinContainer>
        <Heading1>Admin tools</Heading1>
        <Paragraph>Silly tools used test sudo-flix! ૮₍´˶• . • ⑅ ₎ა</Paragraph>

        <ConfigValuesPart />
        <BackendTestPart />
        <WorkerTestPart />
        <TMDBTestPart />
        <div className="mt-8 w-full max-w-none">
          <Heading2 className="mb-8">Recently Played List</Heading2>
          <p className="mb-8">
            This data is fetched from the current backend deployment.
          </p>
          {getItemsForCurrentPage().map((item) => {
            const successText = item.success ? "Yes" : "No"; // Convert bool to "Yes" or "No"
            return (
              <ConfigValue key={item.tmdbFullId} name={item.title}>
                {`${item.providerId} - Provided: ${successText}, Views: ${item.count}`}
              </ConfigValue>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              className="py-px box-content bg-buttons-secondary hover:bg-buttons-secondaryHover bg-opacity-90 text-buttons-secondaryText justify-center items-center"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous page
            </Button>
            <div>
              Page {currentPage} of{" "}
              {Math.ceil(recentPlayedItems.length / itemsPerPage)}
            </div>
            <Button
              className="py-px box-content bg-buttons-secondary hover:bg-buttons-secondaryHover bg-opacity-90 text-buttons-secondaryText justify-center items-center"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={
                currentPage ===
                Math.ceil(recentPlayedItems.length / itemsPerPage)
              }
            >
              Next page
            </Button>
          </div>
        </div>
      </ThinContainer>
    </SubPageLayout>
  );
}
