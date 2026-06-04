pipeline{
    agent any

    tools{
        nodejs 'Node20'
    }

    environment{
        VERCEL_TOCKEN = credentials 'VERCEL_TOCKEN'
    }

    stages{

        stage('clone'){
            steps{
                git branch: 'main', url: 'https://github.com/Kishor1703/Task_manager_Frontend'
            }
        }

        stage('Install dependencies'){
            steps{
                sh 'npm install'
            }
        }

        stage('Build'){
            steps{
                sh 'npm run build'
            }
        }

        stage('Deploy to Vercel'){
            steps{
                sh 'npx vercel --prod --token $VERCEL_TOCKEN'
            }
        }
    }

}