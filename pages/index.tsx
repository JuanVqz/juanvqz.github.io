import Header from "@/components/header";
import Button from "@/components/button";

export default function Home() {
  return (
    <div>
      <Header title={"JuanVqz"} />
      <main className="font-mono">
        <h1>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>
        <Button />
      </main>
    </div>
  );
}
