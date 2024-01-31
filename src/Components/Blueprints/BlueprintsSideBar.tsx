import React, { useState, useCallback } from 'react';

import {
  Bullseye,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { PlusCircleIcon, SearchIcon } from '@patternfly/react-icons';
import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';
import debounce from 'lodash/debounce';
import { useDispatch } from 'react-redux';

import BlueprintCard from './BlueprintCard';

import { imageBuilderApi } from '../../store/enhancedImageBuilderApi';
import {
  useGetBlueprintsQuery,
  BlueprintItem,
} from '../../store/imageBuilderApi';

type blueprintProps = {
  selectedBlueprint: string | undefined;
  setSelectedBlueprint: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
};

type blueprintSearchProps = {
  filter: string | undefined;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
  blueprintsTotal: number;
};

type emptyBlueprintStateProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentClass<SVGIconProps, any>;
  action: React.ReactNode;
  titleText: string;
  bodyText: string;
};

const BlueprintsSidebar = ({
  selectedBlueprint,
  setSelectedBlueprint,
}: blueprintProps) => {
  const [blueprintsSearchQuery, setBlueprintsSearchQuery] = useState<
    string | undefined
  >();
  const dispatch = useDispatch();
  const debouncedSearch = useCallback(
    debounce((filter) => {
      setBlueprintsSearchQuery(filter.length > 0 ? filter : undefined);
      setPageBlueprint(1);
    }, 300),
    [setBlueprintsSearchQuery]
  );
  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  const [pageBlueprint, setPageBlueprint] = useState(1);
  const perPageBlueprint = 4;
  const {
    data: blueprintsData,
    isLoading,
    isFetching,
  } = useGetBlueprintsQuery({
    search: blueprintsSearchQuery,
    limit: perPageBlueprint,
    offset: perPageBlueprint * (pageBlueprint - 1),
  });
  React.useEffect(() => {
    if (pageBlueprint <= 1) {
      return;
    }
    const sidebar = document.querySelector('.pf-v5-c-sidebar__panel');
    if (sidebar) {
      const onScroll = () => {
        const scrolledToBottom =
          // threshold (2) to solve rounding error
          sidebar.scrollTop + sidebar.clientHeight + 2 >= sidebar.scrollHeight;
        if (scrolledToBottom && !isFetching) {
          setPageBlueprint(pageBlueprint + 1);
        }
      };

      sidebar.addEventListener('scroll', onScroll);

      return function () {
        sidebar.removeEventListener('scroll', onScroll);
      };
    }
  }, [pageBlueprint, isFetching]);

  const blueprintsTotal = blueprintsData?.meta?.count || 0;

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (blueprintsTotal === 0 && blueprintsSearchQuery === undefined) {
    return (
      <EmptyBlueprintState
        icon={PlusCircleIcon}
        action={<Button>Create</Button>}
        titleText="No blueprints yet"
        bodyText="To get started, create a blueprint."
      />
    );
  }

  return (
    <>
      <Stack hasGutter>
        {(blueprintsTotal > 0 || blueprintsSearchQuery !== undefined) && (
          <>
            <StackItem>
              <BlueprintSearch
                filter={blueprintsSearchQuery}
                setFilter={debouncedSearch}
                blueprintsTotal={blueprintsTotal}
              />
            </StackItem>
            <StackItem>
              <Card
                ouiaId={`blueprint-card-all`}
                isCompact
                isClickable
                isDisabled={!selectedBlueprint}
              >
                <CardHeader
                  selectableActions={{
                    selectableActionId: 'show-all-card',
                    name: 'blueprints',
                    variant: 'single',
                    onClickAction: () => setSelectedBlueprint(undefined),
                  }}
                >
                  <CardTitle component="a">Clear selection</CardTitle>
                </CardHeader>
              </Card>
            </StackItem>
          </>
        )}
        {blueprintsTotal === 0 && (
          <EmptyBlueprintState
            icon={SearchIcon}
            action={
              <Button variant="link" onClick={() => debouncedSearch('')}>
                Clear all filters
              </Button>
            }
            titleText="No blueprints found"
            bodyText="No blueprints match your search criteria. Try a different search."
          />
        )}
        {blueprintsTotal > 0 &&
          blueprintsData?.data.map((blueprint: BlueprintItem) => (
            <StackItem key={blueprint.id}>
              <BlueprintCard
                blueprint={blueprint}
                selectedBlueprint={selectedBlueprint}
                setSelectedBlueprint={setSelectedBlueprint}
              />
            </StackItem>
          ))}
        {pageBlueprint === 1 &&
          blueprintsTotal > (blueprintsData?.data.length || 0) && (
            <Button
              isLoading={isFetching}
              onClick={() => {
                setPageBlueprint((n) => n + 1);
              }}
              value="loader"
            >
              View more
            </Button>
          )}
      </Stack>
    </>
  );
};

const BlueprintSearch = ({
  filter,
  setFilter,
  blueprintsTotal,
}: blueprintSearchProps) => {
  const onChange = (value: string) => {
    setFilter(value);
  };

  return (
    <SearchInput
      value={filter}
      placeholder="Search by name or description"
      onChange={(_event, value) => onChange(value)}
      onClear={() => onChange('')}
      resultsCount={`${blueprintsTotal} blueprints`}
    />
  );
};

const EmptyBlueprintState = ({
  titleText,
  bodyText,
  icon,
  action,
}: emptyBlueprintStateProps) => (
  <EmptyState variant="sm">
    <EmptyStateHeader
      titleText={titleText}
      headingLevel="h4"
      icon={<EmptyStateIcon icon={icon} />}
    />
    <EmptyStateBody>{bodyText}</EmptyStateBody>
    <EmptyStateFooter>
      <EmptyStateActions>{action}</EmptyStateActions>
    </EmptyStateFooter>
  </EmptyState>
);

export default BlueprintsSidebar;
