# SonarQube with PostgreSQL

This setup pins SonarQube Community Build to `26.11.0.134175-community`, uses a dedicated PostgreSQL 17 database and persistent volumes, and publishes the UI only on `127.0.0.1:9000`. It no longer disables Elasticsearch bootstrap checks.

1. Review Sonar's [host requirements](https://docs.sonarsource.com/sonarqube-community-build/server-installation/pre-installation/linux), including the Docker host's kernel settings and memory. Container ulimits are configured, but Compose cannot configure every host prerequisite.
2. Copy `.env.example` to `.env` in this directory and replace `SONAR_DB_PASSWORD` with a private random value. It must match the persisted database on subsequent starts; changing an environment variable does not reset an existing PostgreSQL password.
3. From the repository root, validate and start explicitly:

   ```bash
   docker compose --env-file sonarqube/.env -f sonarqube/docker-compose.yml config --quiet
   docker compose --env-file sonarqube/.env -f sonarqube/docker-compose.yml up -d
   ```

4. Wait for startup in the service logs, open `http://localhost:9000`, change the initial admin credentials, create/configure the `FoodMatrix` project and quality gate, then configure the Jenkins token/webhook using [jenkins/README.md](../jenkins/README.md). Use a private network or secure authenticated tunnel/proxy for remote CI access; the localhost binding intentionally prevents public access.

**Existing installation:** do not blindly recreate a SonarQube container using the old embedded database. Back up its data and configuration first. This PostgreSQL configuration creates a new database; it does not automatically migrate H2 history. Follow the supported upgrade/migration procedure for your installed version, or explicitly choose a fresh server and reanalysis. Existing data volumes are not deleted by this change.

Do not use `docker compose down -v` on data you want to retain. Back up PostgreSQL and retain the matching SonarQube configuration/version. Review supported upgrade paths and test changes before changing the pinned version.
