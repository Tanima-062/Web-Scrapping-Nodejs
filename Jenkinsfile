pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = '192.168.9.112:5000'
        SONAR_HOME = tool(name: 'sonar') // SonarQube tool
        SONAR_TOKEN = credentials('sonar') // SonarQube credentials
        SERVICE_NAME = 'unibet-scrapper'
        SONAR_HOST_URL= 'http://sonarqube:9000'

    }

    stages {
    
         
        stage('Build and Push Docker Image') {
            when {
                anyOf {
                    branch 'staging'
                    branch 'testing'
                    branch 'master'
                    branch 'master-review'
                }
            }
            steps {
                script {
                    // Use branch name and service name for the image
                    def imageName = "${BRANCH_NAME}/${SERVICE_NAME}"

                    echo "Building and pushing Docker image: ${DOCKER_REGISTRY}/${imageName}:${BUILD_NUMBER}"

                    sh """
                    docker build -t ${DOCKER_REGISTRY}/${imageName}:${BUILD_NUMBER} .
                    docker push ${DOCKER_REGISTRY}/${imageName}:${BUILD_NUMBER}
                    """
                }
            }
        }

       
    }

    post {
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed!"
        }
    }
}