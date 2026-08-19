pipeline {
    agent any

  environment {
    SONAR_PROJECT_KEY = 'FoodMatrix'
    SONAR_PROJECT_NAME = 'FoodMatrix'
}
    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Catalog Service') {
            steps {
                dir('backend/catalog-service') {
                    sh 'npm ci'
                    sh 'npx prisma generate'
                    sh 'npm run build'
                }
            }
        }

        stage('HR Service') {
            steps {
                dir('backend/hr-service') {
                    sh 'npm ci'
                    sh 'npx prisma generate'
                    sh 'npm run build'
                }
            }
        }

        stage('Order Service') {
            steps {
                dir('backend/order-service') {
                    sh 'npm ci'
                    sh 'npx prisma generate'
                    sh 'npm run build'
                }
            }
        }

        stage('Organization Service') {
            steps {
                dir('backend/organization-service') {
                    sh 'npm ci'
                    sh 'npx prisma generate'
                    sh 'npm run build'
                }
            }
        }

        stage('Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'sonar-scanner'

                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                              -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                              -Dsonar.projectName="${SONAR_PROJECT_NAME}" \
                              -Dsonar.sources=backend,frontend \
                              -Dsonar.exclusions="**/node_modules/**,**/dist/**,**/.next/**,**/coverage/**"
                        """
                    }
                }
            }
        }
    }
    stage('Docker Build') {
    steps {
        sh 'docker compose build'
          }
    }

    post {
        success {
            echo 'All services, frontend and SonarQube analysis completed successfully!'
        }

        failure {
            echo 'CI failed. Check the failed stage.'
        }
    }
}