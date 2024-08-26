import { randomUUID } from 'node:crypto';
import debug from 'debug';
import { Octokit } from '@octokit/rest';

interface TriggerWorkflowOptions {
  owner: string;
  repo: string;
  workflow_id: string;
  ref: string;
  inputs?: Record<string, unknown>; // updated type for inputs
  token: string;
  after?: number; // timestamp
  interval?: number; // milliseconds
  max_attempts?: number; // number of attempts to find a new run
}

interface WaitForWorkflowOptions {
  owner: string;
  repo: string;
  token: string;
  run_id: number;
  interval?: number; // milliseconds
}

const log = debug('trigger-workflow');

const createId = (): string => {
  return randomUUID();
};

const pause = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

const findTriggerJob = async (octokit: Octokit, owner: string, repo: string, run_id: number, trigger_id: string): Promise<number> => {
  const { data } = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id
  });

  if (data.total_count > 0) {
    // find the job with a step that matches the trigger_id
    const job = data.jobs.find(job => {
      return job.steps.find(step => step.name === trigger_id);
    });

    if (job) {
      log('Found job matching trigger id:', job.id);
      return job;
    }
  }
};

export const getLatestWorkflowRun = async (options: TriggerWorkflowOptions, attempt: number = 0): Promise<number> => {
  const { after, inputs = {}, owner, repo, workflow_id, token, interval = 5_000, max_attempts = 5 } = options;
  const { trigger_id } = inputs;
  const octokit = new Octokit({ auth: token });

  // Fetch the latest workflow run to get the `run_id`
  const runs = await octokit.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id,
    per_page: 100
  });

  if (runs.data.workflow_runs.length === 0) {
    if (attempt >= max_attempts) {
      log('Max attempts reached. Exiting...');
      return null;
    }

    log('Waiting for a new workflow run...');
    await pause(interval);
    return getLatestWorkflowRun(options, attempt + 1);
  }

  if (runs.data.workflow_runs.length > 0) {
    for (const run of runs.data.workflow_runs) {
      if (new Date(run.created_at).getTime() >= after) {
        log('Potential run ID:', run.id);
        const job = await findTriggerJob(octokit, owner, repo, run.id, trigger_id);
        if (job) {
          return run.id;
        }

        // if max attempts have been reach, the trigger id might not have been set on a job
        // so we can just return the run id
        if (attempt >= max_attempts) {
          log('Max attempts reached. Using most recent run id...');
          return run.id;
        }
      }
    }

    // If the run is older than the `after` timestamp, wait for a new run
    log('Waiting for a new workflow run...');
    await pause(interval);
    return getLatestWorkflowRun(options, attempt + 1);
  }

  return null;
};

export const triggerWorkflow = async (options: TriggerWorkflowOptions): Promise<number> => {
  const { owner, repo, workflow_id, ref, token } = options;
  const after = addMinutes(new Date(), -5).getTime();

  const inputs = {
    trigger_id: createId(),
    ...options.inputs
  };

  const octokit = new Octokit({ auth: token });

  log(`Triggering workflow "${workflow_id}" with trigger id:`, inputs.trigger_id);
  const response = await octokit.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id,
    ref,
    inputs
  });

  if (response.status !== 204) {
    throw new Error(`Failed to trigger workflow: ${response.status}`);
  }

  return getLatestWorkflowRun({ after, ...options, inputs });
};

export const waitForCompletion = async (options: WaitForWorkflowOptions): Promise<void> => {
  const { owner, repo, token, run_id, interval = 5_000 } = options;

  const octokit = new Octokit({ auth: token });
  const differed = {};
  const promise = new Promise<void>((resolve, reject) => {
    differed.resolve = resolve;
    differed.reject = reject;
  });

  const checkRun = async (): Promise<void> => {
    const { data: run } = await octokit.actions.getWorkflowRun({
      owner,
      repo,
      run_id
    });

    if (run.status === 'completed') {
      if (run.conclusion === 'success') {
        log(`Workflow run ${run_id} completed successfully`);
      } else {
        log(`Workflow run ${run_id} completed with conclusion: ${run.conclusion}`);
      }
      differed.resolve(run);
    } else {
      log(`Workflow run ${run_id} is still in progress...`);
      setTimeout(checkRun, interval);
    }
  };

  checkRun();
  return promise;
};
