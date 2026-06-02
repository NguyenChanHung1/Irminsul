import Head from "next/head";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  return (
    <>
      <Head>
        <title>Irminsul</title>
        <meta name="description" content="Irminsul monorepo frontend" />
      </Head>
      <main style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
        <h1>Irminsul</h1>
        <p>Next.js frontend connected to NestJS backend.</p>
        <p>
          Backend API: <code>{API_URL}</code>
        </p>
      </main>
    </>
  );
}
