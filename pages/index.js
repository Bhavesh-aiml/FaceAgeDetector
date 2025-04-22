import Head from 'next/head';
import FaceDetection from '../components/FaceDetection';
import ErrorBoundary from '../components/ErrorBoundary';
import { Container } from 'react-bootstrap';

export default function Home() {
  return (
    <>
      <Head>
        <title>Face Age Predictor</title>
        <meta name="description" content="Predict the age of faces in images using AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css"
          rel="stylesheet"
        />
      </Head>
      
      <Container className="py-4">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <h1 className="text-center mb-4 display-4">Face Age Predictor</h1>
            <p className="text-center lead mb-4">
              Upload a photo or use your webcam to detect faces and estimate age
            </p>
            
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-body">
                <ErrorBoundary>
                  <FaceDetection />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </Container>
      
      <footer className="py-3 mt-5" data-bs-theme="dark">
        <Container className="text-center text-muted">
          <p className="small mb-0">
            &copy; {new Date().getFullYear()} Face Age Predictor | 
            Powered by Next.js and face-api.js
          </p>
        </Container>
      </footer>
    </>
  );
}