import React, { useEffect, useState } from 'react';

import {
  Alert,
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Icon,
  Pagination,
  PaginationVariant,
  Popover,
  SearchInput,
  Text,
  TextContent,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { HelpIcon, OptimizeIcon, SearchIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useDispatch } from 'react-redux';

import { RH_ICON_SIZE } from '../../../../constants';
import {
  useListRepositoriesQuery,
  useSearchRpmMutation,
} from '../../../../store/contentSourcesApi';
import { useAppSelector } from '../../../../store/hooks';
import {
  Package,
  useGetPackagesQuery,
} from '../../../../store/imageBuilderApi';
import {
  removePackage,
  selectArchitecture,
  selectPackages,
  selectCustomRepositories,
  selectDistribution,
  addPackage,
  addRecommendedRepository,
  removeRecommendedRepository,
} from '../../../../store/wizardSlice';
import { useGetEnvironment } from '../../../../Utilities/useGetEnvironment';

type PackageRepository = 'distro' | 'custom' | 'recommended' | '';

export type IBPackageWithRepositoryInfo = {
  name: Package['name'];
  summary: Package['summary'];
  repository: PackageRepository;
  isRequiredByOpenScap: boolean;
};

const Packages = () => {
  const dispatch = useDispatch();

  const arch = useAppSelector(selectArchitecture);
  const distribution = useAppSelector(selectDistribution);
  const customRepositories = useAppSelector(selectCustomRepositories);
  const packages = useAppSelector(selectPackages);

  // select the correct version of EPEL repository
  // the urls are copied over from the content service
  const epelRepoUrlByDistribution = distribution.startsWith('rhel-8')
    ? 'https://dl.fedoraproject.org/pub/epel/8/Everything/x86_64/'
    : 'https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/';

  const { data: epelRepo, isSuccess: isSuccessEpelRepo } =
    useListRepositoriesQuery({
      url: epelRepoUrlByDistribution,
    });

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [toggleSelected, setToggleSelected] = useState('toggle-available');
  const [toggleSourceRepos, setToggleSourceRepos] = useState(
    'toggle-included-repos'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [
    searchRpms,
    { data: dataCustomPackages, isSuccess: isSuccessCustomPackages },
  ] = useSearchRpmMutation();
  const [
    searchRecommendedRpms,
    { data: dataRecommendedPackages, isSuccess: isSuccessRecommendedPackages },
  ] = useSearchRpmMutation();

  const { data: dataDistroPackages, isSuccess: isSuccessDistroPackages } =
    useGetPackagesQuery(
      {
        distribution: distribution,
        architecture: arch,
        search: searchTerm,
      },
      { skip: !searchTerm }
    );

  useEffect(() => {
    const fetchCustomPackages = async () => {
      await searchRpms({
        apiContentUnitSearchRequest: {
          search: searchTerm,
          urls: customRepositories.flatMap((repo) => {
            if (!repo.baseurl) {
              throw new Error(
                `Repository (id: ${repo.id}, name: ${repo?.name}) is missing baseurl`
              );
            }
            return repo.baseurl;
          }),
        },
      });
    };

    if (searchTerm.length > 1) {
      fetchCustomPackages();
    }
  }, [customRepositories, searchRpms, searchTerm]);

  useEffect(() => {
    const fetchRecommendedPackages = async () => {
      await searchRecommendedRpms({
        apiContentUnitSearchRequest: {
          search: searchTerm,
          urls: [epelRepoUrlByDistribution],
        },
      });
    };

    if (searchTerm.length > 1) {
      fetchRecommendedPackages();
    }
  }, [distribution, searchRecommendedRpms, searchTerm]);

  const EmptySearch = () => {
    return (
      <Tr>
        <Td colSpan={5}>
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.sm}>
              <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} />
              <EmptyStateBody>
                Search above to add additional
                <br />
                packages to your image.
              </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    );
  };

  const TooManyResults = () => {
    return (
      <Tr>
        <Td colSpan={5}>
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.sm}>
              <EmptyStateHeader
                icon={<EmptyStateIcon icon={SearchIcon} />}
                titleText="Too many results to display"
                headingLevel="h4"
              />
              <EmptyStateBody>
                Please make the search more specific and try again.
              </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    );
  };

  const TooManyResultsWithExactMatch = () => {
    return (
      <Tr>
        <Td colSpan={5}>
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.sm}>
              <EmptyStateHeader
                titleText="Too many results to display"
                headingLevel="h4"
              />
              <EmptyStateBody>
                To see more results, please make the search more specific and
                try again.
              </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    );
  };

  const NoResultsFound = () => {
    const { isBeta } = useGetEnvironment();
    return (
      <Tr>
        <Td colSpan={5}>
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.sm}>
              <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} />
              <EmptyStateHeader
                titleText="No results found"
                headingLevel="h4"
              />
              <EmptyStateBody>
                Adjust your search and try again, or search from{' '}
                <Button
                  variant="link"
                  isInline
                  component="a"
                  target="_blank"
                  href={
                    isBeta() ? '/preview/settings/content' : '/settings/content'
                  }
                >
                  your repositories
                </Button>{' '}
                and{' '}
                <Button
                  variant="link"
                  isInline
                  component="a"
                  target="_blank"
                  href={
                    isBeta()
                      ? '/preview/settings/content/popular-repositories'
                      : '/settings/content/popular-repositories'
                  }
                >
                  popular repositories
                </Button>
              </EmptyStateBody>
              <EmptyStateFooter>
                <Button
                  variant="primary"
                  onClick={() => setToggleSourceRepos('toggle-other-repos')}
                >
                  Search other repositories
                </Button>
              </EmptyStateFooter>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    );
  };

  const transformPackageData = () => {
    let transformedDistroData: IBPackageWithRepositoryInfo[] = [];
    let transformedCustomData: IBPackageWithRepositoryInfo[] = [];
    let transformedRecommendedData: IBPackageWithRepositoryInfo[] = [];

    if (isSuccessDistroPackages) {
      transformedDistroData = dataDistroPackages.data.map((values) => ({
        ...values,
        repository: 'distro',
        isRequiredByOpenScap: false,
      }));
    }

    if (isSuccessCustomPackages) {
      transformedCustomData = dataCustomPackages!.map((values) => ({
        name: values.package_name!,
        summary: values.summary!,
        repository: 'custom',
        isRequiredByOpenScap: false,
      }));
    }

    let combinedPackageData = transformedDistroData.concat(
      transformedCustomData
    );

    if (
      searchTerm !== '' &&
      combinedPackageData.length === 0 &&
      isSuccessRecommendedPackages &&
      toggleSourceRepos === 'toggle-other-repos'
    ) {
      transformedRecommendedData = dataRecommendedPackages!.map((values) => ({
        name: values.package_name!,
        summary: values.summary!,
        repository: 'recommended',
        isRequiredByOpenScap: false,
      }));

      combinedPackageData = combinedPackageData.concat(
        transformedRecommendedData
      );
    }

    if (toggleSelected === 'toggle-available') {
      return combinedPackageData;
    } else {
      const selectedPackages = [...packages];
      return selectedPackages;
    }
  };

  // Get and sort the list of packages including repository info
  const transformedPackages = transformPackageData().sort((a, b) => {
    const aPkg = a.name.toLowerCase();
    const bPkg = b.name.toLowerCase();
    // check exact match first
    if (aPkg === searchTerm) {
      return -1;
    }
    if (bPkg === searchTerm) {
      return 1;
    }
    // check for packages that start with the search term
    if (aPkg.startsWith(searchTerm) && !bPkg.startsWith(searchTerm)) {
      return -1;
    }
    if (bPkg.startsWith(searchTerm) && !aPkg.startsWith(searchTerm)) {
      return 1;
    }
    // if both (or neither) start with the search term
    // sort alphabetically
    if (aPkg < bPkg) {
      return -1;
    }
    if (bPkg < aPkg) {
      return 1;
    }
    return 0;
  });

  const handleSearch = async (
    event: React.FormEvent<HTMLInputElement>,
    selection: string
  ) => {
    setSearchTerm(selection);
  };

  const handleSelect = (
    pkg: IBPackageWithRepositoryInfo,
    _: number,
    isSelecting: boolean
  ) => {
    if (isSelecting) {
      dispatch(addPackage(pkg));
      if (
        isSuccessEpelRepo &&
        epelRepo.data &&
        pkg.repository === 'recommended'
      ) {
        dispatch(addRecommendedRepository(epelRepo.data[0]));
      }
    } else {
      dispatch(removePackage(pkg.name));
      if (
        isSuccessEpelRepo &&
        epelRepo.data &&
        packages.filter((pkg) => pkg.repository === 'recommended').length === 1
      ) {
        dispatch(removeRecommendedRepository(epelRepo.data[0]));
      }
    }
  };

  const handleFilterToggleClick = (event: React.MouseEvent) => {
    const id = event.currentTarget.id;
    setPage(1);
    setToggleSelected(id);
  };

  const handleRepoToggleClick = (event: React.MouseEvent) => {
    const id = event.currentTarget.id;
    setPage(1);
    setToggleSourceRepos(id);
  };

  const handleSetPage = (_: React.MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageSelect = (
    _: React.MouseEvent,
    newPerPage: number,
    newPage: number
  ) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const computeStart = () => perPage * (page - 1);
  const computeEnd = () => perPage * page;

  const handleExactMatch = () => {
    const exactMatch = transformedPackages.find(
      (pkg) => pkg.name === searchTerm
    );

    if (exactMatch) {
      return (
        <>
          <Tr key={`${exactMatch.name}`} data-testid="exact-match-row">
            <Td
              select={{
                isSelected: packages.some((p) => p.name === exactMatch.name),
                rowIndex: 0,
                onSelect: (event, isSelecting) =>
                  handleSelect(exactMatch, 0, isSelecting),
              }}
            />
            <Td>{exactMatch.name}</Td>
            <Td>{exactMatch.summary}</Td>
            {exactMatch.repository === 'distro' ? (
              <>
                <Td>
                  <img
                    src={
                      '/apps/frontend-assets/red-hat-logos/logo_hat-only.svg'
                    }
                    alt="Red Hat logo"
                    height={RH_ICON_SIZE}
                    width={RH_ICON_SIZE}
                  />{' '}
                  Red Hat repository
                </Td>
                <Td>Supported</Td>
              </>
            ) : (
              <>
                <Td>Third party repository</Td>
                <Td>Not supported</Td>
              </>
            )}
          </Tr>
          <TooManyResultsWithExactMatch />
        </>
      );
    } else {
      return <TooManyResults />;
    }
  };

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem variant="search-filter">
            <SearchInput
              aria-label="Search packages"
              data-testid="packages-search-input"
              value={searchTerm}
              onChange={handleSearch}
            />
          </ToolbarItem>
          <ToolbarItem>
            <ToggleGroup>
              <ToggleGroupItem
                text="Available"
                buttonId="toggle-available"
                data-testid="packages-available-toggle"
                isSelected={toggleSelected === 'toggle-available'}
                onChange={handleFilterToggleClick}
              />
              <ToggleGroupItem
                text="Selected"
                buttonId="toggle-selected"
                data-testid="packages-selected-toggle"
                isSelected={toggleSelected === 'toggle-selected'}
                onChange={handleFilterToggleClick}
              />
            </ToggleGroup>
          </ToolbarItem>
          <ToolbarItem>
            {' '}
            <ToggleGroup>
              <ToggleGroupItem
                text={
                  <>
                    Included repos{' '}
                    <Popover
                      bodyContent={
                        <TextContent>
                          <Text>
                            View packages from the Red Hat repository and
                            repositories you&apos;ve selected.
                          </Text>
                        </TextContent>
                      }
                    >
                      <Button
                        variant="plain"
                        aria-label="About included repositories"
                        component="span"
                        className="pf-u-p-0"
                        size="sm"
                        isInline
                      >
                        <HelpIcon />
                      </Button>
                    </Popover>
                  </>
                }
                buttonId="toggle-included-repos"
                isSelected={toggleSourceRepos === 'toggle-included-repos'}
                onChange={handleRepoToggleClick}
              />
              <ToggleGroupItem
                text={
                  <>
                    Other repos{' '}
                    <Popover
                      bodyContent={
                        <TextContent>
                          <Text>
                            View packages from popular repositories and your
                            other repositories not included in the image.
                          </Text>
                        </TextContent>
                      }
                    >
                      <Button
                        variant="plain"
                        aria-label="About other repositories"
                        component="span"
                        className="pf-u-p-0"
                        size="sm"
                        isInline
                      >
                        <HelpIcon />
                      </Button>
                    </Popover>
                  </>
                }
                buttonId="toggle-other-repos"
                isSelected={toggleSourceRepos === 'toggle-other-repos'}
                onChange={handleRepoToggleClick}
              />
            </ToggleGroup>
          </ToolbarItem>
          <ToolbarItem variant="pagination">
            <Pagination
              itemCount={transformedPackages.length}
              perPage={perPage}
              page={page}
              onSetPage={handleSetPage}
              onPerPageSelect={handlePerPageSelect}
              isCompact
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table variant="compact" data-testid="packages-table">
        <Thead>
          <Tr>
            <Th />
            <Th width={20}>Package name</Th>
            <Th width={35}>Description</Th>
            <Th width={25}>Package repository</Th>
            <Th width={20}>Support</Th>
          </Tr>
        </Thead>
        <Tbody>
          {!searchTerm && toggleSelected === 'toggle-available' && (
            <EmptySearch />
          )}
          {searchTerm &&
            transformedPackages.length === 0 &&
            toggleSelected === 'toggle-available' && <NoResultsFound />}
          {searchTerm &&
            transformedPackages.length >= 100 &&
            handleExactMatch()}
          {transformedPackages.length < 100 &&
            transformedPackages
              .slice(computeStart(), computeEnd())
              .map((pkg, rowIndex) => (
                <Tr key={`${pkg.name}-${rowIndex}`} data-testid="package-row">
                  <Td
                    select={{
                      isSelected: packages.some((p) => p.name === pkg.name),
                      rowIndex: rowIndex,
                      onSelect: (event, isSelecting) =>
                        handleSelect(pkg, rowIndex, isSelecting),
                    }}
                  />
                  <Td>{pkg.name}</Td>
                  <Td>{pkg.summary}</Td>
                  {pkg.repository === 'distro' ? (
                    <>
                      <Td>
                        <img
                          src={
                            '/apps/frontend-assets/red-hat-logos/logo_hat-only.svg'
                          }
                          alt="Red Hat logo"
                          height={RH_ICON_SIZE}
                          width={RH_ICON_SIZE}
                        />{' '}
                        Red Hat repository
                      </Td>
                      <Td>Supported</Td>
                    </>
                  ) : pkg.repository === 'custom' ? (
                    <>
                      <Td>Third party repository</Td>
                      <Td>Not supported</Td>
                    </>
                  ) : (
                    <>
                      <Td>
                        <Icon status="warning">
                          <OptimizeIcon />
                        </Icon>{' '}
                        EPEL {distribution === 'rhel-8' ? '8' : '9'} Everything
                        x86_64
                      </Td>
                      <Td>Not supported</Td>
                    </>
                  )}
                </Tr>
              ))}
        </Tbody>
      </Table>
      <Pagination
        itemCount={transformedPackages.length}
        perPage={perPage}
        page={page}
        onSetPage={handleSetPage}
        onPerPageSelect={handlePerPageSelect}
        variant={PaginationVariant.bottom}
      />
      {packages.some((pkg) => pkg.repository === 'recommended') && (
        <Alert
          variant="warning"
          title="Custom repositories will be added to your image"
          isInline
        >
          You have selected packages that belong to custom repositories. By
          continuing, you are acknowledging and consenting to adding the
          following custom repositories to your image: EPEL{' '}
          {distribution === 'rhel-8' ? '8' : '9'} Everything x86_64
        </Alert>
      )}
    </>
  );
};

export default Packages;
