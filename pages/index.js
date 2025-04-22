import Head from 'next/head';
import FaceDetection from '../components/FaceDetection';
import { Container } from 'react-bootstrap';

export default function Home() {
  return (
    <>
      <Head>
        <title>Face Age Predictor</title>
        <meta name="description" content="Predict the age of faces in images using AI" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css"
          rel="stylesheet"
        />
      </Head>
      
      <main>
        <FaceDetection />
      </main>
      
      <footer className="bg-light py-3 mt-5">
        <Container className="text-center text-muted">
          <p>
            &copy; {new Date().getFullYear()} Face Age Predictor | 
            Powered by Next.js and face-api.js
          </p>
        </Container>
      </footer>
    </>
  );
}