/**
 * GitHub repository statistics collector with enhanced metrics using Octokit SDK and GraphQL
 */
import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
const PlatformSettings = {
    name: 'GitHub',
};
// GraphQL query for basic repository data (without releases)
const REPOSITORY_BASIC_QUERY = `
  query RepositoryBasicData($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      name
      description
      homepageUrl
      stargazerCount
      forkCount
      watchers {
        totalCount
      }
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      primaryLanguage {
        name
      }
      diskUsage
      createdAt
      updatedAt
      pushedAt
      defaultBranchRef {
        name
      }
      repositoryTopics(first: 10) {
        nodes {
          topic {
            name
          }
        }
      }
      licenseInfo {
        name
        spdxId
      }
    }
  }
`;
// GraphQL query for releases with download data
const RELEASES_QUERY = `
  query RepositoryReleases($owner: String!, $name: String!, $first: Int!) {
    repository(owner: $owner, name: $name) {
      releases(first: $first, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          id
          tagName
          name
          description
          createdAt
          publishedAt
          releaseAssets(first: 100) {
            nodes {
              id
              name
              size
              downloadCount
              downloadUrl
            }
          }
        }
      }
    }
  }
`;
export async function collectGithub(repository) {
    try {
        const [owner, repo] = repository.split('/');
        if (!owner || !repo) {
            throw new Error(`Invalid repository format: ${repository}. Expected "owner/repo"`);
        }
        // Initialize Octokit for REST API calls
        const token = process.env.GITHUB_TOKEN || process.env.INPUT_GITHUB_TOKEN || '';
        const octokit = new Octokit({
            auth: token,
            userAgent: 'usage-statistics-tracker'
        });
        if (!token) {
            console.warn('No GitHub token provided. Using unauthenticated requests (rate limited).');
        }
        // Step 1: Fetch basic repository data using GraphQL
        let graphqlData = null;
        try {
            const graphqlClient = graphql.defaults({
                headers: {
                    authorization: token ? `token ${token}` : undefined,
                },
            });
            // Fetch basic repository data (without releases)
            const basicResponse = await graphqlClient(REPOSITORY_BASIC_QUERY, {
                owner,
                name: repo
            });
            if (basicResponse.repository) {
                graphqlData = basicResponse.repository;
            }
        }
        catch (error) {
            console.warn(`Could not fetch GitHub GraphQL basic data for ${repository}:`, error);
        }
        // Step 2: Fetch releases data separately using GraphQL
        let totalReleaseDownloads = 0;
        let latestReleaseDownloads = 0;
        let releaseCount = 0;
        let downloadRange = [];
        let latestRelease = null;
        try {
            const graphqlClient = graphql.defaults({
                headers: {
                    authorization: token ? `token ${token}` : undefined,
                },
            });
            // Fetch releases data
            const releasesResponse = await graphqlClient(RELEASES_QUERY, {
                owner,
                name: repo,
                first: 100
            });
            if (releasesResponse.repository?.releases?.nodes) {
                const releases = releasesResponse.repository.releases.nodes.filter(Boolean);
                releaseCount = releases.length;
                for (const release of releases) {
                    let releaseDownloads = 0;
                    if (release?.releaseAssets?.nodes) {
                        for (const asset of release.releaseAssets.nodes) {
                            if (asset) {
                                releaseDownloads += asset.downloadCount || 0;
                            }
                        }
                    }
                    totalReleaseDownloads += releaseDownloads;
                    // Latest release is the first one in the list
                    if (release && release === releases[0]) {
                        latestReleaseDownloads = releaseDownloads;
                        latestRelease = release.tagName;
                    }
                    // Add to download range with proper date format for charts
                    if (release?.publishedAt) {
                        downloadRange.push({
                            day: release.publishedAt,
                            downloads: releaseDownloads,
                            tagName: release.tagName
                        });
                    }
                }
            }
        }
        catch (error) {
            console.warn(`Could not fetch GitHub GraphQL releases data for ${repository}:`, error);
        }
        // Fallback to REST API if GraphQL fails or for additional data
        let restData = null;
        try {
            const { data: repoData } = await octokit.repos.get({
                owner,
                repo
            });
            restData = repoData;
        }
        catch (error) {
            console.warn(`Could not fetch GitHub REST data for ${repository}:`, error);
        }
        // Use the best available data (GraphQL preferred, REST as fallback)
        const finalData = graphqlData || restData;
        if (!finalData) {
            throw new Error('Could not fetch repository data from either GraphQL or REST API');
        }
        // Get traffic statistics using REST API (requires authentication)
        let viewsCount = 0;
        let uniqueVisitors = 0;
        let clonesCount = 0;
        if (token) {
            try {
                // Get views data
                const { data: viewsData } = await octokit.repos.getViews({
                    owner,
                    repo
                });
                if (viewsData) {
                    viewsCount = viewsData.count || 0;
                    uniqueVisitors = viewsData.uniques || 0;
                }
                // Get clones data
                const { data: clonesData } = await octokit.repos.getClones({
                    owner,
                    repo
                });
                if (clonesData) {
                    clonesCount = clonesData.count || 0;
                }
            }
            catch (error) {
                console.warn(`Could not fetch GitHub traffic data for ${repository}:`, error);
            }
        }
        // Calculate repository age
        let repositoryAge = 0;
        if (finalData.createdAt) {
            const created = new Date(finalData.createdAt);
            const now = new Date();
            repositoryAge = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // days
        }
        // Calculate activity metrics
        let lastActivity = 0;
        if (finalData.pushedAt) {
            const pushed = new Date(finalData.pushedAt);
            const now = new Date();
            lastActivity = Math.floor((now.getTime() - pushed.getTime()) / (1000 * 60 * 60 * 24)); // days
        }
        return {
            platform: PlatformSettings.name,
            name: repository,
            timestamp: new Date().toISOString(),
            metrics: {
                stars: finalData.stargazerCount || finalData.stargazers_count || 0,
                forks: finalData.forkCount || finalData.forks_count || 0,
                watchers: finalData.watchers?.totalCount || finalData.watchers_count || 0,
                totalIssues: finalData.openIssues?.totalCount + finalData.closedIssues?.totalCount || 0,
                openIssues: finalData.openIssues?.totalCount || 0,
                closedIssues: finalData.closedIssues?.totalCount || 0,
                language: finalData.primaryLanguage?.name || finalData.language || null,
                size: finalData.diskUsage || finalData.size || null,
                repositoryAge,
                lastActivity,
                releaseCount,
                totalReleaseDownloads,
                latestReleaseDownloads,
                viewsCount,
                uniqueVisitors,
                latestRelease,
                clonesCount,
                topics: finalData.repositoryTopics?.nodes?.length || finalData.topics?.length || 0,
                license: finalData.licenseInfo?.name || finalData.license?.name || null,
                defaultBranch: finalData.defaultBranchRef?.name || finalData.default_branch || null,
                downloadsTotal: totalReleaseDownloads || 0,
                downloadRange,
            }
        };
    }
    catch (error) {
        return {
            platform: PlatformSettings.name,
            name: repository,
            timestamp: new Date().toISOString(),
            metrics: {},
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
export async function collectGithubBatch(repositories) {
    const results = [];
    for (const repo of repositories) {
        results.push(collectGithub(repo));
    }
    return Promise.all(results);
}
