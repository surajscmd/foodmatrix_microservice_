FROM jenkins/jenkins:lts-jdk21

USER root

# Install basic tools, xz-utils, and AWS CLI v2
RUN apt-get update \
    && apt-get install -y ca-certificates curl git jq unzip xz-utils \
    && curl -fsSLo /tmp/awscliv2.zip "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/aws /tmp/awscliv2.zip

# Install Node.js 22.x (checksum-verified official tarball)
ARG NODE_VERSION=22.14.0
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    case "$arch" in \
      amd64) node_arch=x64 ;; \
      arm64) node_arch=arm64 ;; \
      *) echo "Unsupported arch: $arch" >&2; exit 1 ;; \
    esac; \
    cd /tmp; \
    curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${node_arch}.tar.xz"; \
    curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"; \
    grep " node-v${NODE_VERSION}-linux-${node_arch}.tar.xz$" SHASUMS256.txt | sha256sum -c -; \
    tar -xJf "node-v${NODE_VERSION}-linux-${node_arch}.tar.xz" -C /usr/local --strip-components=1; \
    rm -rf /tmp/*; \
    node -v; npm -v

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