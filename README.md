# imp

Playing around with creating an incident management application. My goal here is to create something
that is easy to self-host and get started with for a small team. Feature parity with the major
offerings from something like OpsGenie or PagerDuty isn't really the goal.

## Getting Started - Self Hosting

This guide describes how to install & build the application and customize it to your needs.

Pre-requisites:

- [ ] Bun (https://bun.sh)

_TODO: Document this process once there's more to intsall_

## Getting Started - Local Development

This guide describes how to build & run the application locally in order to contribute to its
development.

Pre-requisites:

- [ ] Bun (https://bun.sh)
- [ ] Docker Compose (https://docker.com)

### Setting up your local environment

To get started, first run `bun setup`. This will install local dependencies, create and seed a local
database, etc.

Once this command has completed successfully, you can run `bun dev` to get started. You can now
immediately start using the application at `http://localhost:3001`.

### Executing Tests

There are two kinds of tests available in the project: e2e tests using playwright, and unit tests
using bun.

- unit tests: `bun test`
- e2e tests: `bun test:e2e`

For more information about running e2e tests and the various utilities avaialble to you via the
playwright CLI, please see the [documentation](https://playwright.dev/).

_TODO: Include documentation on architecture and philosophy to help new contributors_

## Roadmap

Right now I'm working towards an MVP, which I would define as having the following features:

- [ ] Core data types: users, teams, services, and incidents. Users belong to teams, services belong
      to teams, incidents belong to services.
- [ ] A dashboard where you can view a time-ordered list of incidents, optionally grouped & filtered
      by service / team / incident tags
- [ ] Clicking into an incident allows you to edit it (title, notes, open/acknowledged/closed
      state). All incident actions are recorded into a timeline. Incident states are 1) open 2)
      acknowledged 3) closed. Incidents have a de-duplication key that is used to de-duplicate
      incoming alert events into the same incident until that incident is closed, at which point
      subsequent alerts will create a new incident.
- [ ] An integration dashboard where you can create an integration with an API key, and configure a
      service like AWS SNS to push events to it.
- [ ] A pluggable lifecycle system describing how to transform an integration event into an
      incident. Honestly will probably just support some kind of "serverless functions" style here.
- [ ] A REST API (for self-hosting integrations) supporting
  - Users
  - Incidents
- [ ] Minimal escalation policy + alerting system. Escalation policies can be attached to teams, the
      users specified in the policy will configure 1 or more notification methods, alerts will be
      sent out by simply iterating over `users * notification methods` for each policy attached to
      the team who owns the service that is being alerted.
- [ ] Minimal queue implementation that allows the application to push and poll for jobs (like
      sending notifications) as this part is by definition not synchronous.
