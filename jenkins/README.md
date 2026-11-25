# FoodMatrix Jenkins setup

The repository uses Jenkins for CI and optional releases. GitHub Actions workflows remain removed. The pipeline definition is not proof of an executed Jenkins deployment; provision the following prerequisites first.

## Agent and plugins

Create a multibranch Pipeline job using the root `Jenkinsfile`, and configure your SCM webhook or branch-scan schedule to trigger builds. Configure a **trusted, isolated Linux agent labeled `foodmatrix-ci`** with Node.js 22, npm, Git, Docker Engine access, Compose v2, Buildx, curl, jq, AWS CLI, Helm 3, Terraform 1.12+ and kubectl. `deploy/scripts/check-tools.sh` checks the installed tools and Docker access.

`jenkins/Dockerfile` builds a Jenkins server image with these CLI tools, including checksum-verified Helm/Terraform/kubectl downloads. It does not provision a worker, Docker daemon, AWS credentials or Jenkins plugins automatically. External agents need the same tools. The test runner uses a database port published on the Docker host loopback: run the agent natively on that Linux host, or use a deliberately configured host-network worker. A bridge-network Jenkins container cannot reach the host loopback through its own `127.0.0.1`. Do not run untrusted pull-request code on an agent with host Docker access or deployment privileges; use disposable isolated agents and separate trust boundaries. For a trusted container agent, grant its runtime user the host socket group ID rather than making the Docker socket world-writable. Docker daemon access is privileged. Do not expose a Docker daemon over an unauthenticated TCP socket.

Install Pipeline/Multibranch, Git, Timestamper, Credentials Binding, and SonarQube Scanner plugins. Configure a SonarQube installation named `SonarQube` with a protected analysis token, and a scanner tool named `sonar-scanner`. Configure the Sonar project key as `FoodMatrix` and select the desired quality gate.

## Checks and database isolation

Every build runs `deploy/scripts/ci-checks.sh`: it starts its own randomly named PostgreSQL 17 container with a temporary random password and an ephemeral localhost port, then installs dependencies, generates Prisma clients, runs non-mutating lint/type checks, Jest unit coverage, HTTP tests and builds for all six services plus frontend checks/build. Database integration wrappers create/drop their own generated databases. HR's HTTP tests use mocked dependencies. Cleanup removes only that run's disposable container/volumes and temporary credential directory.

Never inject application/production database credentials into this stage. Do not enable shell tracing inside the script because it handles disposable credentials. Coverage and JSON unit results are archived; LCOV paths are rebased for a repository-wide Sonar scan. Infrastructure validation renders Helm and validates Terraform without planning/applying AWS resources.

Sonar analysis and its enforced quality gate run on trusted `main` builds. Other branches run checks/image builds but skip Sonar, avoiding unsupported branch analysis on Community Build. Release parameters are rejected on other branches or change-request builds.

## Sonar webhook and gate

Create a Jenkins Secret Text credential named `sonarqube-webhook-secret`. Configure the same secret on the SonarQube webhook and point it to the Jenkins URL ending in `/sonarqube-webhook/` (including the trailing slash). The Sonar container/server must be able to reach that address; its own localhost is not the Jenkins host. The pipeline waits up to 15 minutes and aborts on a failed quality gate. Do not disable this gate to publish a failing build.

## Optional publishing and staging deployment

Both parameters default to false. On `main`, enable `PUBLISH_IMAGES` to build/test/analyze first and then publish all eight local images. Supply `AWS_REGION` and `IMAGE_REGISTRY` in the format `ACCOUNT.dkr.ecr.REGION.amazonaws.com/foodmatrix`. The agent's AWS identity must have the required ECR permissions; use its configured short-lived workload/instance role or another managed credentials mechanism. No AWS keys belong in this repository.

Images use the checked-out 40-character commit SHA. Existing immutable ECR tags are reused; missing tags are published, and authorization/registry errors fail the run. Docker login uses a temporary config directory removed on exit.

For `DEPLOY_STAGING`, also enable publishing and provide `EKS_CLUSTER_NAME`. Configure Jenkins credentials:

| Credential ID               | Type        | Value                                                                                             |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `foodmatrix-staging-values` | Secret file | Reviewed staging Helm values; reference Kubernetes secret names rather than embedding credentials |
| `foodmatrix-kafka-brokers`  | Secret text | Private Kafka bootstrap endpoints                                                                 |
| `foodmatrix-staging-origin` | Secret text | HTTPS public staging origin, without a path                                                       |

The agent needs cluster connectivity, `eks:DescribeCluster`, an EKS access entry and the namespace-scoped [deployer RBAC](../deploy/helm/deployer-rbac.yaml). Smoke tests require `pods/exec` on the application pods; this permission is explicitly included. Configure these outside the pipeline before deployment. The pipeline never applies Terraform or grants itself access.

After publishing, Jenkins requires explicit deployment approval. The shared deploy script runs Helm with `--atomic`, waits for rollout and runs public edge/login plus in-cluster database readiness smoke checks. A failed smoke test marks the build failed but does not reverse migrations or automatically undo a completed Helm release. Investigate and use the documented rollback procedure.

Bootstrap secrets, databases, certificates, Kafka credentials/topics, monitoring and backups follow [the deployment runbook](../deploy/README.md). Public smoke tests deliberately do not create orders, payments, stock movements or payroll records; authenticated workflow acceptance is a separate step.
