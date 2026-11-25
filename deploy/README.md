# Deploy FoodMatrix on AWS

Terraform provisions the AWS infrastructure. Helm deploys the FoodMatrix containers and monitoring to EKS. The first target is staging in `ap-south-1`. A public Network Load Balancer terminates TLS and forwards traffic to NGINX. NGINX routes the website to Next.js and `/api/notification/socket.io` to the private Notification Service. Next.js calls Kong over the cluster network.

## 1. Provision AWS infrastructure

Install AWS CLI, Terraform 1.12+, Helm 3, kubectl, and jq. Authenticate using an AWS identity allowed to provision the resources. Copy `terraform/example.tfvars` to `terraform/staging.tfvars` and set the Kubernetes API CIDRs. For shared operation, copy `terraform/backend.tf.example` to `backend.tf` in the same folder and configure an existing private, versioned S3 state bucket and lock permissions.

Choose either private Kafka from an existing provider or the optional MSK cluster. To have Terraform provision MSK, create a Secrets Manager secret named `AmazonMSK_...` in the same AWS account and region, encrypted with a customer-managed symmetric KMS key. Its payload is JSON with `username` and `password` keys. Set `kafka_scram_secret_arn` in your tfvars. The optional cluster creates three brokers, so include them, the EKS nodes, RDS, EBS, NAT, and the load balancer in the staging cost estimate.

```bash
terraform -chdir=deploy/terraform init
terraform -chdir=deploy/terraform plan -var-file=staging.tfvars -out=staging.tfplan
terraform -chdir=deploy/terraform apply staging.tfplan
aws eks update-kubeconfig --region ap-south-1 \
  --name "$(terraform -chdir=deploy/terraform output -raw cluster_name)"
kubectl create namespace foodmatrix
```

Request an ACM certificate covering the app domain in the same AWS region and complete its DNS validation. Set the domain and certificate ARN in a private copy of `helm/foodmatrix/values-eks.example.yaml`. This file contains configuration only.

## 2. Prepare databases and Kubernetes secrets

From a private admin workstation or a temporary PostgreSQL client pod in the VPC, connect to RDS as `matrixadmin` and run `scripts/init-postgres.sql` with `psql`. The master password is in the secret identified by the Terraform output `postgres_admin_secret_arn`. For a data migration, restore the existing data using the matching ownership and migration history before installing. Use the six resulting roles and databases in the application secrets.

Download the current AWS RDS CA bundle and put it in the app namespace.

```bash
curl -fsSLo global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
kubectl -n foodmatrix create configmap foodmatrix-rds-ca --from-file=global-bundle.pem
```

Create these Kubernetes secrets in `foodmatrix` from your secret manager or protected local files. You can use `kubectl -n foodmatrix create secret generic SECRET_NAME --from-env-file=PATH`. Keep real values out of Git and ordinary CI configuration variables; use protected secrets.

| Secret                                                  | Keys                                                                                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `organization-service`                                  | `DATABASE_URL`, `BETTER_AUTH_SECRET`; optional `PASSWORD_RESET_WEBHOOK_URL` and `PASSWORD_RESET_WEBHOOK_TOKEN`                                  |
| `hr-service`, `notification-service`                    | Own `DATABASE_URL`                                                                                                                              |
| `catalog-service`, `order-service`, `inventory-service` | Own `DATABASE_URL` and the same strong `INTERNAL_API_KEY`                                                                                       |
| `foodmatrix-kafka`                                      | `KAFKA_SASL_USERNAME` and `KAFKA_SASL_PASSWORD` for SCRAM; `KAFKA_SSL=true` for TLS-only Kafka                                                  |
| `foodmatrix-bootstrap`                                  | `BOOTSTRAP_FRANCHISE_NAME`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (12–128 chars), first installation only |

Use URL-encoded credentials in each connection string. For RDS, use `postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/DATABASE?sslmode=verify-full&sslrootcert=/etc/foodmatrix/postgres/global-bundle.pem` for Node. Set `MIGRATION_DATABASE_URL` in each database secret to the same base URL with `?sslmode=require&sslcert=/etc/foodmatrix/postgres/global-bundle.pem&sslaccept=strict` for the Prisma CLI. Database TLS files are mounted into the deployment, migration jobs, and admin job. When Kafka is supplied externally, use a private endpoint reachable from EKS and set `kafkaTopics.replicationFactor` to the broker count or lower. You can provision topics independently with `kafkaTopics.enabled=false` and keep runtime permissions separate.

## 3. Install monitoring and publish images

```bash
bash deploy/scripts/install-observability.sh
```

This installs persistent Prometheus, Grafana, Loki, and Tempo, then the OpenTelemetry operator and collectors. Next.js and NestJS pods receive Node instrumentation for OTLP metrics and sampled traces. The log collector tails only FoodMatrix pod stdout/stderr and sends it to Loki. Prometheus scrapes the collector and Kong. Grafana comes with Kubernetes dashboards and the Loki and Tempo data sources. Alert rules flag unavailable deployments and repeated container restarts. Configure an Alertmanager receiver separately if alerts should leave the cluster.

GitHub Actions workflows have been removed. Publish images manually or through a separately configured Jenkins pipeline using `scripts/build-image.sh`. Authenticate Docker to the intended ECR registry and build/push all eight images with the same Git commit SHA as the immutable tag:

```bash
export IMAGE_REGISTRY="$(terraform -chdir=deploy/terraform output -raw image_registry)"
export IMAGE_TAG="$(git rev-parse HEAD)"
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin "${IMAGE_REGISTRY%%/*}"
for image in frontend kong organization-service hr-service catalog-service order-service inventory-service notification-service; do
  bash deploy/scripts/build-image.sh "$image" "$IMAGE_REGISTRY/$image:$IMAGE_TAG" --push
done
```

Use an AWS identity with ECR publishing permissions. The Jenkinsfile implements tests, coverage, the main-branch Sonar quality gate, shared image builds, optional publishing and approved staging deployment. Configure its external prerequisites using [the Jenkins setup guide](../jenkins/README.md). Optional Terraform GitHub OIDC publishing-role resources remain available, but are not required for manual publishing or Jenkins.

## 4. Roll out the app

Set `bootstrap.enabled: true` in the initial Helm values file. Provide the published SHA, local values file, and authenticated Kafka broker endpoints.

```bash
export IMAGE_REGISTRY="$(terraform -chdir=deploy/terraform output -raw image_registry)"
export IMAGE_TAG="<published Git commit SHA>"
export KAFKA_BROKERS="<private bootstrap endpoints, comma-separated>"
export VALUES_FILE="/path/to/staging-values.yaml"
bash deploy/scripts/deploy-app.sh
kubectl -n foodmatrix get svc foodmatrix-edge
```

Point the app DNS record to the reported load balancer. Helm creates Kafka topics and runs database migrations before the application rollout. After the admin job succeeds, remove `bootstrap.enabled: true` from the rollout values and delete the one-time Kubernetes secret. Use backward-compatible schema migrations because a Helm rollback does not reverse committed database changes.

For Jenkins deployment, configure an agent with AWS CLI, Helm, kubectl, jq and cluster connectivity, and grant its AWS identity `eks:DescribeCluster` plus the required EKS access. Terraform can register an existing role through `deploy_role_arn`; apply `helm/deployer-rbac.yaml` once as the cluster administrator. Invoke the same `deploy/scripts/deploy-app.sh` with the environment variables above. The Jenkinsfile implements this opt-in stage; its private environment values and AWS/EKS access must still be configured.

## 5. Verify staging

- Log in as an admin and a restaurant user. Confirm that the restaurant session can only access its assigned location.
- Place an order from the waiter pad, mark it ready in the kitchen, and complete payment in POS. Confirm order history, stock deduction, and live notifications. The socket should connect on `wss://<app-domain>/api/notification/socket.io`.
- Run `kubectl -n monitoring port-forward svc/grafana 3000:80` and log in using the credentials stored in the Grafana Kubernetes secret. In Explore, check Prometheus `up{service="kong"}` and `up{service="otel-gateway"}`, Loki `{service_name=~".+"}`, and Tempo traces after generating traffic. Use `kubectl -n foodmatrix get pods,jobs` to check the app and failed hook jobs.
- To roll back the app, inspect revisions with `helm history -n foodmatrix foodmatrix` and use `helm rollback -n foodmatrix foodmatrix REVISION --wait`.

Loki, Tempo, and the notification gateway use single replicas in this staging setup. Multiple notification replicas require cross-pod Socket.IO event fan-out. For a higher-availability deployment, use multi-AZ RDS, durable object storage and a replicated configuration for telemetry, and a tested restore procedure.

## 6. Local container development

The root Compose file now uses the shared deployment images for all six services, frontend and Kong. An NGINX edge exposes the frontend and socket endpoint together at `http://localhost:3000`. Kafka is included from its infrastructure Compose file. PostgreSQL remains external.

1. Use Docker Compose 2.20+ for `include` support. Copy each backend's `.env.docker.example` to `.env.docker`, set its own database URL, and supply the shared internal key and Organization secret. Do not commit these files. Use `host.docker.internal` to reach PostgreSQL on the Docker Desktop host; Linux requires an equivalent reachable address or host-gateway configuration.
2. Create databases and apply committed migrations before starting the application. The stack does not automatically seed, bootstrap or migrate existing data. Use the service-specific Prisma config documented in the project guide.
3. Back up existing Kafka data before recreating old broker containers: earlier configurations had no named volumes. Do not assume adding a volume migrates a container's existing logs. Stop producers/consumers and brokers for a consistent backup, inspect the old broker's log directories and cluster ID, preserve all broker/controller metadata, and restore into the corresponding new volumes with appropriate ownership. Set `KAFKA_CLUSTER_ID` to the existing ID when restoring. Keep the old containers/data until the restored cluster is verified. Do not run `down -v` against data you need.
4. Run `docker compose config --quiet`, then `docker compose up -d --build` from the repository root. Native frontend development also uses 3000; choose one mode at a time. Stop the unused native-development containers first; project-prefixed Kafka names avoid container-name collisions, but both modes still bind the same host Kafka ports.
5. Check `docker compose ps` and service logs. Kafka UI is read-only on `127.0.0.1:8080`. Broker listeners are bound to localhost. Root Compose does not publish Kong Admin; standalone Kong Admin is localhost-only.

Container builds exclude environment files through the root `.dockerignore`; legacy direct service builds also have local ignore files. Never pass production secrets as Docker build arguments.

## 7. Jenkins and SonarQube

See [jenkins/README.md](../jenkins/README.md) for the CI agent, quality gate and release setup, and [sonarqube/README.md](../sonarqube/README.md) for the pinned SonarQube/PostgreSQL installation. Neither requires restoring GitHub Actions workflows.

The six backend `/health/ready` endpoints run a bounded, coalesced database query and return 503 on failure without exposing connection details. `/health/live` reports process liveness without depending on PostgreSQL. Helm uses those paths; readiness does not make Kafka an HTTP availability dependency. Background delivery must be monitored separately through logs/outbox backlog and consumer health.
