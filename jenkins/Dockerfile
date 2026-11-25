FROM jenkins/jenkins:lts-jdk21

USER root

# Install basic tools
RUN apt-get update \
    && apt-get install -y ca-certificates curl git jq unzip awscli

# Install Node.js 22.x
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Install Docker CLI
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg \
       -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo \
       "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
       $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
       > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y docker-ce-cli docker-compose-plugin docker-buildx-plugin \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ARG HELM_VERSION=3.19.0
ARG TERRAFORM_VERSION=1.12.2
ARG KUBECTL_VERSION=v1.34.0
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    cd /tmp; \
    curl -fsSLO "https://get.helm.sh/helm-v${HELM_VERSION}-linux-${arch}.tar.gz"; \
    curl -fsSLO "https://get.helm.sh/helm-v${HELM_VERSION}-linux-${arch}.tar.gz.sha256sum"; \
    sha256sum -c "helm-v${HELM_VERSION}-linux-${arch}.tar.gz.sha256sum"; \
    tar -xzf "helm-v${HELM_VERSION}-linux-${arch}.tar.gz"; \
    install "linux-${arch}/helm" /usr/local/bin/helm; \
    curl -fsSLO "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_${arch}.zip"; \
    curl -fsSLO "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_SHA256SUMS"; \
    grep " terraform_${TERRAFORM_VERSION}_linux_${arch}.zip$" "terraform_${TERRAFORM_VERSION}_SHA256SUMS" | sha256sum -c -; \
    unzip "terraform_${TERRAFORM_VERSION}_linux_${arch}.zip" -d /usr/local/bin; \
    curl -fsSLo kubectl "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${arch}/kubectl"; \
    curl -fsSLo kubectl.sha256 "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${arch}/kubectl.sha256"; \
    echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c -; \
    install kubectl /usr/local/bin/kubectl; \
    rm -rf /tmp/*

USER jenkins