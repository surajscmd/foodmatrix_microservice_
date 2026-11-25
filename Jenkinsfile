pipeline {
    agent { label 'foodmatrix-ci' }
    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 90, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        skipDefaultCheckout(true)
    }
    parameters {
        booleanParam(name: 'PUBLISH_IMAGES', defaultValue: false, description: 'Publish tested images to ECR; trusted main branch only')
        booleanParam(name: 'DEPLOY_STAGING', defaultValue: false, description: 'Deploy after publishing and explicit approval')
        string(name: 'AWS_REGION', defaultValue: 'ap-south-1', description: 'AWS region')
        string(name: 'IMAGE_REGISTRY', defaultValue: '', description: 'ECR prefix, e.g. ACCOUNT.dkr.ecr.REGION.amazonaws.com/foodmatrix')
        string(name: 'EKS_CLUSTER_NAME', defaultValue: '', description: 'Staging EKS cluster')
    }
    environment {
        TF_IN_AUTOMATION = 'true'
        NEXT_TELEMETRY_DISABLED = '1'
    }
    stages {
        stage('Checkout') {
            steps {
                deleteDir()
                checkout scm
                script {
                    env.IMAGE_TAG = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    if (params.DEPLOY_STAGING && !params.PUBLISH_IMAGES) {
                        error('Deployment requires PUBLISH_IMAGES so this run tests and publishes its own commit.')
                    }
                    if ((params.PUBLISH_IMAGES || params.DEPLOY_STAGING) &&
                        (env.BRANCH_NAME != 'main' || env.CHANGE_ID)) {
                        error('Publishing and deployment are restricted to trusted main branch builds.')
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
            when { branch 'main' }
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
            when { branch 'main' }
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
            when { expression { params.DEPLOY_STAGING } }
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
export KUBECONFIG
trap 'rm -f "$KUBECONFIG"' EXIT
aws eks update-kubeconfig --region "$AWS_REGION" --name "$EKS_CLUSTER_NAME"
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
