import { Layout, AppLink } from "../components"

const HomePage = () => {
  return (
    <Layout>
      <h1 className="text-6xl font-bold text-center">
        Welcome to{" "}
        <AppLink href="/articles" className="text-blue-600">
          Articles
        </AppLink>
      </h1>
    </Layout>
  )
}

export default HomePage
