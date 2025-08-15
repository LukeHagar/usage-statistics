import * as core from '@actions/core';
import { collectNpmBatch } from './collectors/npm.js';
import { collectGithubBatch } from './collectors/github.js';
import { collectPowerShellBatch } from './collectors/powershell.js';
import { collectPypiBatch } from './collectors/pypi.js';
import { getInputs, updateRepositoryReadme } from './utils.js';
import { writeFile } from 'fs/promises';
try {
    const { npmPackages, githubRepositories, pypiPackages, powershellModules, jsonOutputPath, updateReadme, commitMessage, readmePath, } = getInputs();
    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`NPM Packages: ${npmPackages.join(', ')}`);
    core.debug(`GitHub Repositories: ${githubRepositories.join(', ')}`);
    core.debug(`PyPI Packages: ${pypiPackages.join(', ')}`);
    core.debug(`PowerShell Modules: ${powershellModules.join(', ')}`);
    core.debug(``);
    core.debug(`JSON Output Path: ${jsonOutputPath}`);
    core.debug(`Update README: ${updateReadme}`);
    core.debug(`Commit Message: ${commitMessage}`);
    // Track which platforms are being used
    const platformsTracked = [];
    if (npmPackages.length > 0)
        platformsTracked.push('NPM');
    if (githubRepositories.length > 0)
        platformsTracked.push('GitHub');
    if (pypiPackages.length > 0)
        platformsTracked.push('PyPI');
    if (powershellModules.length > 0)
        platformsTracked.push('PowerShell');
    core.debug(`Platforms to track: ${platformsTracked.join(', ')}`);
    core.info(`Successfully configured usage statistics tracker for ${platformsTracked.length} platforms`);
    const metricPromises = [];
    const metrics = [];
    for (const platform of platformsTracked) {
        core.info(`Collecting ${platform} metrics...`);
        switch (platform) {
            case 'NPM':
                console.log(`Collecting NPM metrics for ${npmPackages.join(', ')}`);
                console.time(`Collecting NPM metrics`);
                metricPromises.push(collectNpmBatch(npmPackages).then(results => {
                    console.timeEnd(`Collecting NPM metrics`);
                    return results;
                }));
                break;
            case 'GitHub':
                console.log(`Collecting GitHub metrics for ${githubRepositories.join(', ')}`);
                console.time(`Collecting GitHub metrics`);
                metricPromises.push(collectGithubBatch(githubRepositories).then(results => {
                    console.timeEnd(`Collecting GitHub metrics`);
                    return results;
                }));
                break;
            case 'PyPI':
                console.log(`Collecting PyPI metrics for ${pypiPackages.join(', ')}`);
                console.time(`Collecting PyPI metrics`);
                metricPromises.push(collectPypiBatch(pypiPackages).then(results => {
                    console.timeEnd(`Collecting PyPI metrics`);
                    return results;
                }));
                break;
            case 'PowerShell':
                console.log(`Collecting PowerShell metrics for ${powershellModules.join(', ')}`);
                console.time(`Collecting PowerShell metrics`);
                metricPromises.push(collectPowerShellBatch(powershellModules).then(results => {
                    console.timeEnd(`Collecting PowerShell metrics`);
                    return results;
                }));
                break;
        }
    }
    console.log('All metrics collecting started');
    const metricResults = await Promise.all(metricPromises);
    metrics.push(...metricResults.flat());
    console.log('All metrics collecting completed');
    if (updateReadme) {
        console.log('Updating repository readme...');
        await updateRepositoryReadme(metrics, readmePath);
    }
    console.log('Repository readme updated');
    // Persist full result set to JSON for downstream consumption
    try {
        await writeFile(jsonOutputPath, JSON.stringify(metrics, null, 2), 'utf8');
        core.setOutput('json-output', jsonOutputPath);
        console.log(`Wrote metrics JSON to ${jsonOutputPath}`);
    }
    catch (writeErr) {
        console.warn(`Failed to write metrics JSON to ${jsonOutputPath}:`, writeErr);
    }
    core.setOutput('commit-message', commitMessage);
}
catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error)
        core.setFailed(error.message);
}
