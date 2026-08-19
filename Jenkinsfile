pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Catalog Service') {
            steps {
                dir('backend/catalog-service') {
                    bat 'npm ci'
                    bat 'npx prisma generate'
                    bat 'npx eslint "{src,apps,libs,test}/**/*.ts"'
                    bat 'npm test -- --runInBand'
                    bat 'npm run build'
                }
            }
        }

        stage('HR Service') {
            steps {
                dir('backend/hr-service') {
                    bat 'npm ci'
                    bat 'npx eslint "{src,apps,libs,test}/**/*.ts"'
                    bat 'npm test -- --runInBand'
                    bat 'npm run build'
                }
            }
        }

        stage('Order Service') {
            steps {
                dir('backend/order-service') {
                    bat 'npm ci'
                    bat 'npx eslint "{src,apps,libs,test}/**/*.ts"'
                    bat 'npm test -- --runInBand'
                    bat 'npm run build'
                }
            }
        }

        stage('Organization Service') {
            steps {
                dir('backend/organization-service') {
                    bat 'npm ci'
                    bat 'npx eslint "{src,apps,libs,test}/**/*.ts"'
                    bat 'npm test -- --runInBand'
                    bat 'npm run build'
                }
            }
        }

        stage('Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                    bat 'npm run lint'
                    bat 'npm run build'
                }
            }
        }
    }

    post {
        success {
            echo 'All backend services and frontend passed CI successfully!'
        }

        failure {
            echo 'CI failed. Check the failed stage.'
        }
    }
}
