import React, { useCallback } from 'react';

import {
  Bullseye,
  Button,
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
import { Link } from 'react-router-dom';

import BlueprintCard from './BlueprintCard';
import BlueprintsPagination from './BlueprintsPagination';

import {
  selectBlueprintSearchInput,
  selectLimit,
  selectOffset,
  selectSelectedBlueprintId,
  setBlueprintId,
  setBlueprintSearchInput,
  setBlueprintsOffset,
} from '../../store/BlueprintSlice';
import { imageBuilderApi } from '../../store/enhancedImageBuilderApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  useGetBlueprintsQuery,
  BlueprintItem,
} from '../../store/imageBuilderApi';
import { resolveRelPath } from '../../Utilities/path';

type blueprintSearchProps = {
  blueprintsTotal: number;
};

type emptyBlueprintStateProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentClass<SVGIconProps, any>;
  action: React.ReactNode;
  titleText: string;
  bodyText: string;
};

const BlueprintsSidebar = () => {
  const selectedBlueprintId = useAppSelector(selectSelectedBlueprintId);
  const blueprintSearchInput = useAppSelector(selectBlueprintSearchInput);
  const blueprintsOffset = useAppSelector(selectOffset);
  const blueprintsLimit = useAppSelector(selectLimit);
  const { data: blueprintsData, isLoading } = useGetBlueprintsQuery({
    search: blueprintSearchInput,
    limit: blueprintsLimit,
    offset: blueprintsOffset,
  });
  const dispatch = useAppDispatch();
  const blueprints = blueprintsData?.data;

  const blueprintsTotal = blueprintsData?.meta?.count || 0;

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (blueprintsTotal === 0 && blueprintSearchInput === undefined) {
    return (
      <EmptyBlueprintState
        icon={PlusCircleIcon}
        action={
          <Link
            to={resolveRelPath('imagewizard')}
            data-testid="create-blueprint-action-emptystate"
          >
            Add blueprint
          </Link>
        }
        titleText="No blueprints yet"
        bodyText="Add a blueprint and optionally build related images."
      />
    );
  }
  return (
    <>
      <Stack hasGutter>
        {(blueprintsTotal > 0 || blueprintSearchInput !== undefined) && (
          <>
            <StackItem>
              <BlueprintSearch blueprintsTotal={blueprintsTotal} />
            </StackItem>
            <StackItem>
              <Button
                ouiaId={`clear-selected-blueprint-button`}
                variant="link"
                isDisabled={!selectedBlueprintId}
                onClick={() => dispatch(setBlueprintId(undefined))}
              >
                Clear selection
              </Button>
            </StackItem>
          </>
        )}
        {blueprintsTotal === 0 && (
          <EmptyBlueprintState
            icon={SearchIcon}
            action={
              <Button
                variant="link"
                onClick={() => dispatch(setBlueprintSearchInput(undefined))}
              >
                Clear all filters
              </Button>
            }
            titleText="No blueprints found"
            bodyText="No blueprints match your search criteria. Try a different search."
          />
        )}
        {blueprintsTotal > 0 &&
          blueprints?.map((blueprint: BlueprintItem) => (
            <StackItem key={blueprint.id}>
              <BlueprintCard blueprint={blueprint} />
            </StackItem>
          ))}
        <BlueprintsPagination />
      </Stack>
    </>
  );
};

const BlueprintSearch = ({ blueprintsTotal }: blueprintSearchProps) => {
  const blueprintSearchInput = useAppSelector((state) =>
    selectBlueprintSearchInput(state)
  );
  const dispatch = useAppDispatch();
  const debouncedSearch = useCallback(
    debounce((filter) => {
      dispatch(setBlueprintsOffset(0));
      dispatch(imageBuilderApi.util.invalidateTags([{ type: 'Blueprints' }]));
      dispatch(setBlueprintSearchInput(filter.length > 0 ? filter : undefined));
    }, 300),
    []
  );
  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  const onChange = (value: string) => {
    debouncedSearch(value);
  };

  return (
    <SearchInput
      value={blueprintSearchInput}
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
