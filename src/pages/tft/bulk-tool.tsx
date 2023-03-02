import { gql, useMutation, useQuery } from "@apollo/client";
import { PoeStashTab, StashSnapshot } from "../../__generated__/graphql";
import { useState } from "react";
import StyledCard from "@components/styled-card";
import FilterableItemTable from "../../components/filterable-item-table";
import StyledButton from "@components/styled-button";
import { usePoeLeagueCtx } from "@contexts/league-context";
import LeagueSelect from "@components/league-select";
import StyledMultiSelect2 from "../../components/styled-multi-select-2";
import { usePoeStackAuth } from "@contexts/user-context";
import SnapshotItemTable from "@components/item-table/snapshot-item-table";
import StyledMultiSelectMultiFilter from "@components/styled-multi-select-multi-filter";

export default function BulkTool() {
  const { profile } = usePoeStackAuth();

  const { league } = usePoeLeagueCtx();

  const [selectedStashTabs, setSelectedStashTabs] = useState<PoeStashTab[]>([]);
  const [stashTabs, setStashTabs] = useState<PoeStashTab[]>([]);
  const { refetch: refetchStashTabs } = useQuery<{
    stashTabs: PoeStashTab[];
  }>(
    gql`
      query StashTabs($league: String!, $forcePull: Boolean) {
        stashTabs(league: $league, forcePull: $forcePull) {
          id
          userId
          league
          parent
          name
          type
          index
          flatIndex
        }
      }
    `,
    {
      skip: !league,
      variables: {
        league: league,
        forcePull: false,
      },
      onCompleted(data) {
        setStashTabs(data.stashTabs);
      },
      onError(error) {
        setStashTabs([]);
      },
    }
  );

  const [snapshot, setSnapshot] = useState<StashSnapshot | null>(null);
  const [takeDetatchedSnapshot] = useMutation(
    gql`
      mutation TakeDeatachedSnapshot($input: DetachedStashSnapshotInput!) {
        takeDeatachedSnapshot(input: $input) {
          id
          league
          userId
          snapshotProfileId
          createdAtTimestamp
          tags
          totalValueChaos
          exaltChaosValue
          divineChaosValue
        }
      }
    `,
    {
      variables: {
        input: {
          userId: profile?.userId,
          league: league,
          poeStashTabIds: selectedStashTabs.map((e) => e.id),
          valuationTargetPValue: "p10",
          valuationStockInfluence: "none",
        },
      },
      onCompleted(data) {
        setSnapshot(data.takeDeatachedSnapshot);
      },
    }
  );

  const [removeOnlyEnabled, setRemoveOnlyEnabled] = useState(false);
  const removeOnlyFunction = (stashName: string) => {
    return !stashName.toLowerCase().includes("(remove-only)");
  }


  return (
    <>
      <div>
        <StyledCard title="Tool">
          <div>
            <LeagueSelect />
            <StyledMultiSelectMultiFilter
              selected={selectedStashTabs ?? []}
              items={stashTabs ?? []}
              itemToText={(e) => e?.name ?? "na"}
              placeholder={"Stash name..."}
              onSelectChange={function(e: any[]): void {
                setSelectedStashTabs(e);
              }}
              additionalFilters={[{ title: "Remove Only", enabled: removeOnlyEnabled, toggle: () => setRemoveOnlyEnabled(!removeOnlyEnabled), filterFunction: removeOnlyFunction }]}
            />
            <StyledButton
              text={"Grab Items"}
              onClick={() => {
                takeDetatchedSnapshot();
              }}
            />
            {snapshot && <SnapshotItemTable snapshot={snapshot!} />}
          </div>
        </StyledCard>
      </div>
    </>
  );
}