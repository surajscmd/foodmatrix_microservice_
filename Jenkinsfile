pipeline {
    agent { label 'foodmatrix-ci' }
    triggers {
        githubPush()
        pollSCM('* * * * *')
    }
    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 90, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        skipDefaultCheckout(true)
    }
    parameters {
        booleanParam(name: 'PUBLISH_IMAGES', defaultValue: true, description: 'Publish tested images to ECR; trusted main branch only')
        booleanParam(name: 'DEPLOY_STAGING', defaultValue: true, description: 'Deploy automatically to EKS on main branch builds')
        booleanParam(name: 'REQUIRE_APPROVAL', defaultValue: false, description: 'Pause for manual approval before Helm upgrade')
        booleanParam(name: 'RUN_SONAR', defaultValue: false, description: 'Run SonarQube scan and quality gate (requires running SonarQube server)')
        string(name: 'AWS_REGION', defaultValue: 'ap-south-1', description: 'AWS region')
        string(name: 'IMAGE_REGISTRY', defaultValue: '035136507772.dkr.ecr.ap-south-1.amazonaws.com/foodmatrix', description: 'ECR prefix')
        string(name: 'EKS_CLUSTER_NAME', defaultValue: 'foodmatrix-staging', description: 'Staging EKS cluster')
    }
    environment {
        TF_IN_AUTOMATION = 'true'
        NEXT_TELEMETRY_DISABLED = '1'
    }
    stages {
        stage('Checkout') {
            steps {
                deleteDir()
                script {
                    def scmVars = null
                    retry(3) {
                        scmVars = checkout scm
                    }
                    def rawBranch = env.BRANCH_NAME ?: scmVars?.GIT_BRANCH ?: env.GIT_BRANCH ?: ''
                    if (!rawBranch) {
                        rawBranch = sh(script: "git for-each-ref --points-at HEAD --format='%(refname:short)' refs/remotes/origin | head -n 1", returnStdout: true).trim()
                    }
                    env.IMAGE_TAG = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.RESOLVED_BRANCH = rawBranch.replaceFirst('^refs/remotes/origin/', '').replaceFirst('^origin/', '')
                    if (params.DEPLOY_STAGING && !params.PUBLISH_IMAGES) {
                        error('Deployment requires PUBLISH_IMAGES so this run tests and publishes its own commit.')
                    }
                    if ((params.PUBLISH_IMAGES || params.DEPLOY_STAGING) &&
                        (env.RESOLVED_BRANCH != 'main' || env.CHANGE_ID)) {
                        error("Publishing and deployment are restricted to trusted main branch builds (resolved=${env.RESOLVED_BRANCH}, raw=${rawBranch}).")
                    }
                }
            }
        }
        stage('Tooling') {
            steps {
                sh 'bash deploy/scripts/check-tools.sh'
            }
        }
        stage('Lint, types, unit coverage and HTTP tests') {
            steps {
                sh 'bash deploy/scripts/ci-checks.sh'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'backend/*/coverage/**', allowEmptyArchive: true
                }
            }
        }
        stage('Deployment configuration') {
            steps {
                sh '''terraform -chdir=deploy/terraform fmt -check
terraform -chdir=deploy/terraform init -backend=false -input=false
terraform -chdir=deploy/terraform validate
bash deploy/scripts/validate-helm.sh'''
            }
        }
        stage('SonarQube analysis') {
            when { expression { params.RUN_SONAR && env.RESOLVED_BRANCH == 'main' } }
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'sonar-scanner'
                        withEnv(["SCANNER_HOME=${scannerHome}"]) {
                            sh '"$SCANNER_HOME/bin/sonar-scanner"'
                        }
                    }
                }
            }
        }
        stage('SonarQube quality gate') {
            when { expression { params.RUN_SONAR && env.RESOLVED_BRANCH == 'main' } }
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true, webhookSecretId: 'sonarqube-webhook-secret'
                }
            }
        }
        stage('Build images') {
            steps {
                sh '''set -eu
for image in frontend kong organization-service hr-service catalog-service order-service inventory-service notification-service; do
  bash deploy/scripts/build-image.sh "$image" "foodmatrix/$image:$IMAGE_TAG"
done'''
            }
        }
        stage('Publish images') {
            when { expression { params.PUBLISH_IMAGES } }
            steps {
                withEnv(["AWS_REGION=${params.AWS_REGION}", "IMAGE_REGISTRY=${params.IMAGE_REGISTRY}"]) {
                    sh 'bash deploy/scripts/publish-images.sh'
                }
            }
        }
        stage('Approve staging deployment') {
            when { expression { params.DEPLOY_STAGING && params.REQUIRE_APPROVAL } }
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    input message: "Deploy tested commit ${env.IMAGE_TAG} to staging?", ok: 'Deploy'
                }
            }
        }
        stage('Deploy and smoke test') {
            when { expression { params.DEPLOY_STAGING } }
            steps {
                withCredentials([
                    file(credentialsId: 'foodmatrix-staging-values', variable: 'VALUES_FILE'),
                    string(credentialsId: 'foodmatrix-kafka-brokers', variable: 'KAFKA_BROKERS'),
                    string(credentialsId: 'foodmatrix-staging-origin', variable: 'SMOKE_BASE_URL')
                ]) {
                    withEnv(["AWS_REGION=${params.AWS_REGION}", "IMAGE_REGISTRY=${params.IMAGE_REGISTRY}", "EKS_CLUSTER_NAME=${params.EKS_CLUSTER_NAME}"]) {
                        sh '''set -eu
: "${EKS_CLUSTER_NAME:?Configure the staging cluster}"
KUBECONFIG=$(mktemp)
VALUES_TMP=$(mktemp)
export KUBECONFIG
trap 'rm -f "$KUBECONFIG" "$VALUES_TMP"' EXIT
aws eks update-kubeconfig --region "$AWS_REGION" --name "$EKS_CLUSTER_NAME"
cp "$VALUES_FILE" "$VALUES_TMP"
LIVE_TUNNEL=$(kubectl -n foodmatrix logs deploy/cloudflared --tail=200 2>/dev/null | grep -Eo 'https://[a-z0-9-]+\\.trycloudflare\\.com' | tail -n 1 || true)
if [ -n "$LIVE_TUNNEL" ]; then
  sed -i "s|^publicOrigin:.*|publicOrigin: $LIVE_TUNNEL|" "$VALUES_TMP"
  SMOKE_BASE_URL="$LIVE_TUNNEL"
fi
export VALUES_FILE="$VALUES_TMP"
export SMOKE_BASE_URL
bash deploy/scripts/deploy-app.sh
bash deploy/scripts/smoke-test.sh'''
                    }
                }
            }
        }
    }
    post {
        success { echo 'All configured checks and requested release stages passed.' }
        failure { echo 'Pipeline failed; later release stages were not run. Check the failed stage.' }
    }
}
