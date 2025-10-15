import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  DescribeLogStreamsCommand,
  ResourceAlreadyExistsException,
  DataAlreadyAcceptedException,
  InvalidSequenceTokenException,
} from "@aws-sdk/client-cloudwatch-logs";

// Initialize AWS SDK clients
// Assumes region and credentials are configured via environment variables or the default AWS SDK config chain.
const cloudWatchClient = new CloudWatchClient({});
const cloudWatchLogsClient = new CloudWatchLogsClient({});

/**
 * Defines constants for various AWS services.
 * This object is frozen to prevent modification.
 */
export const AWSService = Object.freeze({
  S3: "s3",
  DYNAMODB: "dynamodb",
  LAMBDA: "lambda",
  CLOUDWATCH: "cloudwatch",
  CLOUDWATCH_LOGS: "cloudwatch_logs",
});

/**
 * Puts a single custom metric to CloudWatch.
 *
 * @param {string} namespace - The namespace for the metric.
 * @param {string} name - The name of the metric.
 * @param {number} value - The value of the metric.
 * @param {Array<Object>} [dimensions=[]] - An array of dimension objects, e.g., `[{ Name: 'Service', Value: 'MyService' }]`.
 * @param {string} [unit='Count'] - The unit of the metric, e.g., 'Count', 'Milliseconds', 'Bytes'.
 * @returns {Promise<void>} A promise that resolves when the metric is successfully put.
 * @throws {Error} If there is an error putting the metric data.
 */
export const putMetric = async (namespace, name, value, dimensions = [], unit = 'Count') => {
  try {
    const params = {
      Namespace: namespace,
      MetricData: [{
        MetricName: name,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: dimensions,
      }],
    };
    await cloudWatchClient.send(new PutMetricDataCommand(params));
  } catch (error) {
    console.error(`Error putting CloudWatch metric '${namespace}/${name}': ${error.message}`, error);
    throw error;
  }
};

/**
 * Creates a CloudWatch Log Group. If the group already exists, this function will not throw an error,
 * but will gracefully handle the `ResourceAlreadyExistsException`.
 *
 * @param {string} logGroupName - The name of the log group to create.
 * @returns {Promise<void>} A promise that resolves when the log group is created or already exists.
 * @throws {Error} If there is an error creating the log group other than it already existing.
 */
export const createLogGroup = async (logGroupName) => {
  try {
    await cloudWatchLogsClient.send(new CreateLogGroupCommand({
      logGroupName
    }));
  } catch (error) {
    if (error instanceof ResourceAlreadyExistsException) {
      // Log group already exists, which is an expected scenario for idempotency.
      // console.warn(`CloudWatch Log Group '${logGroupName}' already exists.`);
    } else {
      console.error(`Error creating CloudWatch Log Group '${logGroupName}': ${error.message}`, error);
      throw error;
    }
  }
};

/**
 * Creates a CloudWatch Log Stream within a specified log group. If the stream already exists,
 * this function will not throw an error, but will gracefully handle the `ResourceAlreadyExistsException`.
 *
 * @param {string} logGroupName - The name of the log group.
 * @param {string} logStreamName - The name of the log stream to create.
 * @returns {Promise<void>} A promise that resolves when the log stream is created or already exists.
 * @throws {Error} If there is an error creating the log stream other than it already existing.
 */
export const createLogStream = async (logGroupName, logStreamName) => {
  try {
    await cloudWatchLogsClient.send(new CreateLogStreamCommand({
      logGroupName,
      logStreamName
    }));
  } catch (error) {
    if (error instanceof ResourceAlreadyExistsException) {
      // Log stream already exists, which is an expected scenario for idempotency.
      // console.warn(`CloudWatch Log Stream '${logStreamName}' already exists in group '${logGroupName}'.`);
    } else {
      console.error(`Error creating CloudWatch Log Stream '${logStreamName}' in group '${logGroupName}': ${error.message}`, error);
      throw error;
    }
  }
};

/**
 * Retrieves the upload sequence token for a given CloudWatch Log Stream.
 * This token is required for `PutLogEventsCommand` calls.
 *
 * @param {string} logGroupName - The name of the log group.
 * @param {string} logStreamName - The name of the log stream.
 * @returns {Promise<string|undefined>} The next sequence token, or undefined if the stream does not exist.
 * @throws {Error} If there is an error describing the log streams.
 * @private
 */
const getSequenceToken = async (logGroupName, logStreamName) => {
  const describeParams = {
    logGroupName,
    logStreamNamePrefix: logStreamName,
    limit: 1,
  };
  const describeResponse = await cloudWatchLogsClient.send(new DescribeLogStreamsCommand(describeParams));
  const logStream = describeResponse.logStreams?.find(ls => ls.logStreamName === logStreamName);
  return logStream?.uploadSequenceToken;
};

/**
 * Puts log events to a CloudWatch Log Stream.
 * This function handles retrieving the `sequenceToken` needed for putting log events
 * by performing a `DescribeLogStreamsCommand` call prior to `PutLogEventsCommand`.
 * It also handles retries for `InvalidSequenceTokenException` up to a certain limit.
 *
 * @param {string} logGroupName - The name of the log group.
 * @param {string} logStreamName - The name of the log stream.
 * @param {Array<{ message: string, timestamp: number }>} events - An array of log event objects.
 *   Each object must have a `message` (string) and a `timestamp` (number, epoch milliseconds).
 *   Events will be sorted by timestamp before sending, as required by CloudWatch Logs.
 * @returns {Promise<void>} A promise that resolves when the log events are successfully put.
 * @throws {Error} If there is an error putting the log events or retrieving the sequence token.
 */
export const putLogEvents = async (logGroupName, logStreamName, events) => {
  if (!events || events.length === 0) {
    return; // No events to log
  }

  // Sort events by timestamp as required by CloudWatch Logs
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  const MAX_RETRIES = 3;
  let retries = 0;
  let currentSequenceToken;

  while (retries < MAX_RETRIES) {
    try {
      // 1. Get the current sequence token for the log stream
      // On first attempt or retry, always fetch the latest token.
      currentSequenceToken = await getSequenceToken(logGroupName, logStreamName);

      const putParams = {
        logGroupName,
        logStreamName,
        logEvents: sortedEvents.map(event => ({
          message: event.message,
          timestamp: event.timestamp,
        })),
        // If a sequence token was found, include it in the put command.
        // For the very first put to a new stream, sequenceToken will be undefined, which is acceptable.
        sequenceToken: currentSequenceToken,
      };

      // 2. Put the log events
      const response = await cloudWatchLogsClient.send(new PutLogEventsCommand(putParams));

      // If successful, log the nextSequenceToken for potential future use (though we refetch each time for robustness here)
      // console.log(`Successfully put log events to ${logGroupName}/${logStreamName}. Next sequence token: ${response.nextSequenceToken}`);
      return; // Success, exit loop
    } catch (error) {
      if (error instanceof InvalidSequenceTokenException || error instanceof DataAlreadyAcceptedException) {
        // This can happen if another process simultaneously wrote to the stream,
        // or if the token became stale. Retry with a fresh token.
        console.warn(`CloudWatchLogs sequence token mismatch or data already accepted for ${logGroupName}/${logStreamName}. Retrying... (Attempt ${retries + 1}/${MAX_RETRIES})`);
        retries++;
        // Do not throw, allow retry.
      } else {
        console.error(`Error putting log events to ${logGroupName}/${logStreamName}: ${error.message}`, error);
        throw error;
      }
    }
  }
  // If we reach here, retries were exhausted
  console.error(`Failed to put log events to ${logGroupName}/${logStreamName} after ${MAX_RETRIES} attempts due to sequence token issues.`);
  throw new Error(`Failed to put log events to CloudWatch Logs after multiple retries.`);
};