pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment Check') {
            steps {
                bat 'node --version'
                bat 'npm --version'
                bat 'where node'
            }
        }

        stage('Test') {
            steps {
                echo 'Node.js is available to Jenkins!'
            }
        }
    }
}